const fs = require("fs");
const { Pool } = require("pg");

const lookupLimit = Number(process.env.FREE_LOOKUP_LIMIT_PER_MONTH || process.env.MAX_FREE_LOOKUPS_PER_MONTH || 0);
let pool;
let initialized = false;

function normalizeCert(value) {
  if (!value) {
    return null;
  }

  if (value.includes("BEGIN CERTIFICATE")) {
    return value.replace(/\\n/g, "\n");
  }

  if (fs.existsSync(value)) {
    return fs.readFileSync(value, "utf8");
  }

  return null;
}

function databaseConfig() {
  const sslCa = normalizeCert(process.env.DATABASE_CA_CERT || process.env.PG_CA_CERT || process.env.PGSSLROOTCERT);
  const ssl = sslCa
    ? { ca: sslCa, rejectUnauthorized: true }
    : { rejectUnauthorized: false };

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl
    };
  }

  if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGDATABASE) {
    return null;
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl
  };
}

function getPool() {
  if (!pool) {
    const config = databaseConfig();
    if (!config) {
      return null;
    }

    pool = new Pool({
      ...config,
      max: Number(process.env.PGPOOL_MAX || 5),
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5000)
    });
  }

  return pool;
}

async function initializeUsageTracking() {
  const db = getPool();
  if (!db || initialized) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS property_lookup_usage (
      id BIGSERIAL PRIMARY KEY,
      ip_address INET NOT NULL,
      lookup_month DATE NOT NULL,
      street TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      allowed BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS property_lookup_usage_ip_month_allowed_idx
      ON property_lookup_usage (ip_address, lookup_month, allowed)
  `);

  initialized = true;
}

function currentLookupMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function isEnabled() {
  return process.env.USAGE_TRACKING_ENABLED !== "false" && lookupLimit > 0;
}

async function trackLookupUsage(ipAddress, query) {
  if (!isEnabled()) {
    return {
      allowed: true,
      limit: lookupLimit || null,
      used: null,
      remaining: null,
      trackingEnabled: false
    };
  }

  const db = getPool();
  if (!db) {
    throw new Error("Usage tracking is enabled, but database environment variables are missing.");
  }

  await initializeUsageTracking();

  const lookupMonth = currentLookupMonth();
  const usageResult = await db.query(
    `
      SELECT COUNT(*)::int AS used
      FROM property_lookup_usage
      WHERE ip_address = $1::inet
        AND lookup_month = $2::date
        AND allowed = TRUE
    `,
    [ipAddress, lookupMonth]
  );

  const used = usageResult.rows[0].used;
  const allowed = used < lookupLimit;

  await db.query(
    `
      INSERT INTO property_lookup_usage
        (ip_address, lookup_month, street, city, state, zip, allowed)
      VALUES ($1::inet, $2::date, $3, $4, $5, $6, $7)
    `,
    [ipAddress, lookupMonth, query.street, query.city, query.state, query.zip, allowed]
  );

  return {
    allowed,
    limit: lookupLimit,
    used: allowed ? used + 1 : used,
    remaining: allowed ? Math.max(lookupLimit - used - 1, 0) : 0,
    trackingEnabled: true
  };
}

async function getUsageDashboard(month) {
  const db = getPool();
  if (!db) {
    throw new Error("Database environment variables are missing.");
  }

  await initializeUsageTracking();

  const lookupMonth = month && /^\d{4}-\d{2}$/.test(month)
    ? `${month}-01`
    : currentLookupMonth();

  const [summaryResult, byIpResult, recentResult, locationResult] = await Promise.all([
    db.query(
      `
        SELECT
          COUNT(*)::int AS total_lookups,
          COUNT(*) FILTER (WHERE allowed = TRUE)::int AS allowed_lookups,
          COUNT(*) FILTER (WHERE allowed = FALSE)::int AS blocked_lookups,
          COUNT(DISTINCT ip_address)::int AS unique_ips,
          MIN(created_at) AS first_lookup_at,
          MAX(created_at) AS last_lookup_at
        FROM property_lookup_usage
        WHERE lookup_month = $1::date
      `,
      [lookupMonth]
    ),
    db.query(
      `
        SELECT
          ip_address::text AS ip_address,
          COUNT(*)::int AS total_lookups,
          COUNT(*) FILTER (WHERE allowed = TRUE)::int AS allowed_lookups,
          COUNT(*) FILTER (WHERE allowed = FALSE)::int AS blocked_lookups,
          MIN(created_at) AS first_lookup_at,
          MAX(created_at) AS last_lookup_at,
          (
            ARRAY_AGG(
              TRIM(CONCAT_WS(', ', NULLIF(street, ''), NULLIF(city, ''), NULLIF(state, ''), NULLIF(zip, '')))
              ORDER BY created_at DESC
            )
          )[1] AS last_lookup_address
        FROM property_lookup_usage
        WHERE lookup_month = $1::date
        GROUP BY ip_address
        ORDER BY allowed_lookups DESC, total_lookups DESC, last_lookup_at DESC
        LIMIT 100
      `,
      [lookupMonth]
    ),
    db.query(
      `
        SELECT
          ip_address::text AS ip_address,
          street,
          city,
          state,
          zip,
          allowed,
          created_at
        FROM property_lookup_usage
        WHERE lookup_month = $1::date
        ORDER BY created_at DESC
        LIMIT 25
      `,
      [lookupMonth]
    ),
    db.query(
      `
        SELECT
          city,
          state,
          zip,
          COUNT(*)::int AS total_lookups,
          COUNT(DISTINCT ip_address)::int AS unique_ips
        FROM property_lookup_usage
        WHERE lookup_month = $1::date
        GROUP BY city, state, zip
        ORDER BY total_lookups DESC, unique_ips DESC
        LIMIT 10
      `,
      [lookupMonth]
    )
  ]);

  const summary = summaryResult.rows[0];
  const ipRows = byIpResult.rows.map(row => ({
    ...row,
    remaining: lookupLimit > 0 ? Math.max(lookupLimit - row.allowed_lookups, 0) : null,
    over_limit: lookupLimit > 0 && row.allowed_lookups >= lookupLimit
  }));

  return {
    month: lookupMonth.slice(0, 7),
    limitPerIp: lookupLimit || null,
    summary,
    byIp: ipRows,
    recentLookups: recentResult.rows,
    topLocations: locationResult.rows
  };
}

module.exports = {
  initializeUsageTracking,
  getUsageDashboard,
  trackLookupUsage
};
