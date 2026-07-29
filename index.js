const express = require("express");
const path = require("path");
const cors = require("cors");
const { initializeUsageTracking, getUsageDashboard, trackLookupUsage } = require("./server/usageTracker");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;
const providerTimeoutMs = 9000;
const providerDelayMs = Number(process.env.REALTYAPI_PROVIDER_DELAY_MS || 400);
const realtyApiKey = process.env.REALTYAPI_KEY;
const attomApiKey = process.env.ATTOM_API_KEY;

app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function fullAddress(query) {
  return [query.street, query.city, query.state, query.zip]
    .filter(Boolean)
    .join(", ");
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed !== null && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function firstString(...values) {
  return values.find(value => typeof value === "string" && value.trim()) || "";
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPath(obj, targetPath) {
  return targetPath.split(".").reduce((cursor, key) => {
    if (cursor === null || cursor === undefined) {
      return undefined;
    }
    return cursor[key];
  }, obj);
}

async function fetchJson(url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(realtyApiKey ? { "x-realtyapi-key": realtyApiKey } : {}),
        ...headers
      }
    });

    const bodyText = await response.text();
    const body = bodyText ? JSON.parse(bodyText) : {};

    if (!response.ok) {
      const message = body && (body.message || body.error) ? body.message || body.error : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function providerError(error) {
  return {
    ok: false,
    error: error.name === "AbortError" ? "Provider timed out" : error.message
  };
}

async function callRealtyProvider(name, fn) {
  if (!realtyApiKey) {
    return { ok: false, skipped: true, error: "Missing REALTYAPI_KEY" };
  }

  try {
    return { ok: true, ...(await fn()) };
  } catch (error) {
    console.warn(`${name} provider failed:`, error.message);
    return providerError(error);
  }
}

async function callAttomProvider(fn) {
  if (!attomApiKey) {
    return { ok: false, skipped: true, error: "Missing ATTOM_API_KEY" };
  }

  try {
    return { ok: true, ...(await fn()) };
  } catch (error) {
    console.warn("attom provider failed:", error.message);
    return providerError(error);
  }
}

function pickValue(raw, candidates) {
  for (const pathCandidate of candidates) {
    const value = firstNumber(getPath(raw, pathCandidate));
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function pickAnyNumber(raw, candidates) {
  for (const pathCandidate of candidates) {
    const value = asNumber(getPath(raw, pathCandidate));
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function pickString(raw, candidates) {
  for (const pathCandidate of candidates) {
    const value = getPath(raw, pathCandidate);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function normalized(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stateZipFromUrl(url) {
  const match = String(url || "").match(/_([A-Z]{2})_(\d{5})(?:_|$)/i);
  if (!match) {
    return null;
  }

  return {
    state: match[1].toUpperCase(),
    zip: match[2]
  };
}

function validateProviderMatch(name, query, provider) {
  const linkLocation = stateZipFromUrl(provider.link);
  if (linkLocation && (linkLocation.state !== query.state || linkLocation.zip !== query.zip)) {
    return {
      ok: false,
      error: `${name} returned a property in ${linkLocation.state} ${linkLocation.zip}, not ${query.state} ${query.zip}`
    };
  }

  const property = provider.property || {};
  if (property.state && normalized(property.state) !== normalized(query.state)) {
    return {
      ok: false,
      error: `${name} returned a different state`
    };
  }

  if (property.zip && String(property.zip).slice(0, 5) !== query.zip) {
    return {
      ok: false,
      error: `${name} returned a different ZIP code`
    };
  }

  return provider;
}

function buildProperty(raw, mapping = {}) {
  return {
    street: pickString(raw, mapping.street || ["address.streetAddress", "propertyDetails.address.streetAddress", "property.address.streetAddress", "detail.location.address.line", "data.location.address.line"]),
    city: pickString(raw, mapping.city || ["address.city", "propertyDetails.address.city", "property.city", "detail.location.address.city", "data.location.address.city"]),
    state: pickString(raw, mapping.state || ["address.state", "propertyDetails.address.state", "property.state", "detail.location.address.state_code", "data.location.address.state_code"]),
    zip: pickString(raw, mapping.zip || ["address.zipcode", "propertyDetails.address.zipcode", "property.zipcode", "detail.location.address.postal_code", "data.location.address.postal_code"]),
    bedrooms: pickValue(raw, mapping.bedrooms || ["bedrooms", "beds", "propertyDetails.bedrooms", "property.bedrooms", "data.bedrooms"]),
    bathrooms: pickValue(raw, mapping.bathrooms || ["bathrooms", "baths", "propertyDetails.bathrooms", "property.bathrooms", "data.bathrooms"]),
    sqft: pickValue(raw, mapping.sqft || ["livingArea", "sqft", "squareFeet", "propertyDetails.livingArea", "property.sqft", "data.sqft"]),
    lotSize: pickValue(raw, mapping.lotSize || ["lotSize", "lotSizeSqFt", "lotAreaValue", "propertyDetails.lotSize", "property.lotSize", "data.lotSize"]),
    yearBuilt: pickValue(raw, mapping.yearBuilt || ["yearBuilt", "propertyDetails.yearBuilt", "property.yearBuilt", "data.yearBuilt"]),
    homeType: pickString(raw, mapping.homeType || ["homeType", "propertyType", "propertyDetails.homeType", "property.homeType", "data.propertyType"]),
    status: pickString(raw, mapping.status || ["homeStatus", "status", "propertyDetails.homeStatus", "property.status", "data.status"]),
    soldPrice: pickValue(raw, mapping.soldPrice || ["lastSoldPrice", "lastSalePrice", "propertyDetails.lastSoldPrice", "property.lastSalePrice", "data.lastSalePrice"]),
    soldDate: pickString(raw, mapping.soldDate || ["lastSoldDate", "lastSaleDate", "propertyDetails.lastSoldDate", "property.lastSaleDate", "data.lastSaleDate"]),
    lat: pickAnyNumber(raw, mapping.lat || ["latitude", "lat", "propertyDetails.latitude", "address.latitude", "property.latitude", "data.latitude"]),
    long: pickAnyNumber(raw, mapping.long || ["longitude", "lng", "long", "propertyDetails.longitude", "address.longitude", "property.longitude", "data.longitude"])
  };
}

function firstAttomProperty(raw) {
  return Array.isArray(raw.property) && raw.property.length ? raw.property[0] : {};
}

async function getAttom(query) {
  return callAttomProvider(async () => {
    const params = new URLSearchParams({
      address1: query.street,
      address2: [query.city, query.state, query.zip].filter(Boolean).join(", ")
    });
    const raw = await fetchJson(
      `https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail?${params}`,
      { apikey: attomApiKey }
    );
    const propertyRaw = firstAttomProperty(raw);

    const provider = {
      value: pickValue(propertyRaw, ["avm.amount.value"]),
      link: "",
      property: buildProperty(propertyRaw, {
        street: ["address.line1"],
        city: ["address.locality"],
        state: ["address.countrySubd"],
        zip: ["address.postal1"],
        bedrooms: ["building.rooms.beds"],
        bathrooms: ["building.rooms.bathstotal", "building.rooms.bathscalc"],
        sqft: ["building.size.livingsize", "building.size.universalsize", "building.size.bldgsize"],
        lotSize: ["lot.lotsize2"],
        yearBuilt: ["summary.yearbuilt"],
        homeType: ["summary.propertyType", "summary.propclass"],
        status: ["summary.absenteeInd"],
        soldPrice: ["sale.amount.saleamt", "sale.amount.saleAmt"],
        soldDate: ["sale.saleTransDate", "sale.salesearchdate"],
        lat: ["location.latitude"],
        long: ["location.longitude"]
      }),
      meta: {
        source: "ATTOM AVM",
        attomId: getPath(propertyRaw, "identifier.attomId") || raw.status && raw.status.attomId || null,
        confidenceScore: pickValue(propertyRaw, ["avm.amount.scr"]),
        low: pickValue(propertyRaw, ["avm.amount.low"]),
        high: pickValue(propertyRaw, ["avm.amount.high"]),
        valuationDate: pickString(propertyRaw, ["avm.eventDate"])
      }
    };

    return validateProviderMatch("ATTOM", query, provider);
  });
}

async function getZillow(query) {
  return callRealtyProvider("zillow", async () => {
    const params = new URLSearchParams({ propertyaddress: fullAddress(query) });
    const raw = await fetchJson(`https://zillow.realtyapi.io/pro/byaddress?${params}`);

    return {
      value: pickValue(raw, ["propertyDetails.zestimate", "propertyDetails.price", "propertyDetails.taxAssessedValue", "propertyDetails.resoFacts.taxAssessedValue", "zestimate", "price"]),
      rentEstimate: pickValue(raw, ["propertyDetails.rentZestimate", "propertyDetails.rentalZestimate", "rentZestimate", "rentalZestimate"]),
      link: pickString(raw, ["propertyDetails.hdpUrl", "propertyDetails.url", "zillowURL", "homeDetails"]),
      property: buildProperty(raw),
      meta: {
        zpid: raw.propertyDetails && raw.propertyDetails.zpid ? raw.propertyDetails.zpid : raw.zpid || null,
        source: "RealtyAPI Zillow"
      }
    };
  });
}

async function getRedfin(query) {
  return callRealtyProvider("redfin", async () => {
    const params = new URLSearchParams({ property_address: fullAddress(query) });
    const raw = await fetchJson(`https://redfin.realtyapi.io/detailsbyaddress?${params}`);

    return {
      value: pickValue(raw, [
        "details.avm.predictedValue",
        "details.avm.amount",
        "details.avm.value",
        "details.avm.estimate",
        "details.aboveTheFold.priceInfo.amount",
        "details.aboveTheFold.priceInfo.price",
        "avm.value",
        "avm.estimate",
        "redfinEstimate",
        "property.redfinEstimate",
        "property.price",
        "price",
        "data.price"
      ]),
      link: pickString(raw, ["details.aboveTheFold.url", "url", "property.url", "data.url"]),
      property: buildProperty(raw, {
        bedrooms: ["details.aboveTheFold.beds", "details.aboveTheFold.numBeds", "details.mainHouseInfoPanelInfo.beds"],
        bathrooms: ["details.aboveTheFold.baths", "details.aboveTheFold.numBaths", "details.mainHouseInfoPanelInfo.baths"],
        sqft: ["details.aboveTheFold.sqFt.value", "details.aboveTheFold.sqft", "details.mainHouseInfoPanelInfo.sqft"],
        lotSize: ["details.aboveTheFold.lotSize.value", "details.aboveTheFold.lotSize"],
        yearBuilt: ["details.aboveTheFold.yearBuilt", "details.mainHouseInfoPanelInfo.yearBuilt"],
        homeType: ["details.aboveTheFold.propertyType", "details.mainHouseInfoPanelInfo.propertyType"],
        status: ["details.aboveTheFold.status", "status"],
        lat: ["details.aboveTheFold.latLong.latitude", "details.aboveTheFold.latitude"],
        long: ["details.aboveTheFold.latLong.longitude", "details.aboveTheFold.longitude"]
      }),
      meta: {
        source: "RealtyAPI Redfin"
      }
    };
  });
}

async function getRealtor(query) {
  return callRealtyProvider("realtor", async () => {
    const params = new URLSearchParams({ address: fullAddress(query) });
    const raw = await fetchJson(`https://realtor.realtyapi.io/details/byaddress?${params}`);

    const provider = {
      value: pickValue(raw, [
        "detail.estimate.currentValue",
        "detail.home.estimate",
        "data.estimate.currentValue",
        "data.home.estimate"
      ]),
      link: pickString(raw, ["detail.href", "detail.permalink", "data.href", "data.permalink", "href", "permalink", "url"]),
      property: buildProperty(raw, {
        street: ["detail.location.address.line", "data.location.address.line", "location.address.line"],
        city: ["detail.location.address.city", "data.location.address.city", "location.address.city"],
        state: ["detail.location.address.state_code", "data.location.address.state_code", "location.address.state_code"],
        zip: ["detail.location.address.postal_code", "data.location.address.postal_code", "location.address.postal_code"],
        bedrooms: ["detail.description.beds", "detail.details.beds", "data.description.beds", "description.beds", "beds"],
        bathrooms: ["detail.description.baths", "detail.details.baths", "data.description.baths", "description.baths", "baths"],
        sqft: ["detail.description.sqft", "detail.details.sqft", "data.description.sqft", "description.sqft", "sqft"],
        lotSize: ["detail.description.lot_sqft", "detail.details.lot_sqft", "data.description.lot_sqft", "description.lot_sqft", "lot_sqft"],
        yearBuilt: ["detail.description.year_built", "detail.details.year_built", "data.description.year_built", "description.year_built", "year_built"],
        homeType: ["detail.description.type", "detail.details.type", "data.description.type", "description.type", "type"],
        status: ["detail.status", "data.status", "status"],
        soldPrice: ["detail.last_sold_price", "data.last_sold_price", "last_sold_price"],
        soldDate: ["detail.last_sold_date", "data.last_sold_date", "last_sold_date"],
        lat: ["detail.location.address.coordinate.lat", "data.location.address.coordinate.lat", "location.address.coordinate.lat", "lat"],
        long: ["detail.location.address.coordinate.lon", "data.location.address.coordinate.lon", "location.address.coordinate.lon", "lon"]
      }),
      meta: {
        source: "RealtyAPI Realtor"
      }
    };

    return validateProviderMatch("Realtor.com", query, provider);
  });
}

async function getHomes(query) {
  return callRealtyProvider("homes", async () => {
    const params = new URLSearchParams({ address: fullAddress(query) });
    const raw = await fetchJson(`https://homes.realtyapi.io/details/byaddress?${params}`);

    const provider = {
      value: pickValue(raw, [
        "detail.estimate.currentValue",
        "detail.home.estimate",
        "data.estimate.currentValue",
        "data.home.estimate"
      ]),
      link: pickString(raw, ["detail.href", "detail.permalink", "data.href", "data.permalink", "href", "permalink", "url"]),
      property: buildProperty(raw, {
        street: ["detail.location.address.line", "data.location.address.line", "location.address.line"],
        city: ["detail.location.address.city", "data.location.address.city", "location.address.city"],
        state: ["detail.location.address.state_code", "data.location.address.state_code", "location.address.state_code"],
        zip: ["detail.location.address.postal_code", "data.location.address.postal_code", "location.address.postal_code"],
        bedrooms: ["detail.description.beds", "detail.details.beds", "data.description.beds", "description.beds", "beds"],
        bathrooms: ["detail.description.baths", "detail.details.baths", "data.description.baths", "description.baths", "baths"],
        sqft: ["detail.description.sqft", "detail.details.sqft", "data.description.sqft", "description.sqft", "sqft"],
        lotSize: ["detail.description.lot_sqft", "detail.details.lot_sqft", "data.description.lot_sqft", "description.lot_sqft", "lot_sqft"],
        yearBuilt: ["detail.description.year_built", "detail.details.year_built", "data.description.year_built", "description.year_built", "year_built"],
        homeType: ["detail.description.type", "detail.details.type", "data.description.type", "description.type", "type"],
        status: ["detail.status", "data.status", "status"],
        soldPrice: ["detail.last_sold_price", "data.last_sold_price", "last_sold_price"],
        soldDate: ["detail.last_sold_date", "data.last_sold_date", "last_sold_date"],
        lat: ["detail.location.address.coordinate.lat", "data.location.address.coordinate.lat", "location.address.coordinate.lat", "lat"],
        long: ["detail.location.address.coordinate.lon", "data.location.address.coordinate.lon", "location.address.coordinate.lon", "lon"]
      }),
      meta: {
        source: "RealtyAPI Homes.com"
      }
    };

    return validateProviderMatch("Homes.com", query, provider);
  });
}

function buildHomeFacts(query, providers) {
  const providerProperties = [
    providers.zillow && providers.zillow.property,
    providers.redfin && providers.redfin.property,
    providers.realtor && providers.realtor.property,
    providers.homes && providers.homes.property,
    providers.attom && providers.attom.property
  ].filter(Boolean);

  const pick = key => {
    for (const property of providerProperties) {
      if (property[key]) {
        return property[key];
      }
    }
    return null;
  };

  const sale = providerProperties.find(property => property.soldPrice && property.soldDate) || {};

  return {
    street_address: query.street,
    city: query.city,
    state: query.state,
    zip_code: query.zip,
    home_type: pick("homeType"),
    bedrooms: pick("bedrooms"),
    bathrooms: pick("bathrooms"),
    sqft: pick("sqft"),
    lot_size: pick("lotSize"),
    year_built: pick("yearBuilt"),
    sold_price: sale.soldPrice || null,
    sold_date: sale.soldDate || null,
    lat: pick("lat"),
    long: pick("long")
  };
}

function blendedEstimate(providers) {
  const values = [
    providers.zillow && providers.zillow.value,
    providers.redfin && providers.redfin.value,
    providers.realtor && providers.realtor.value,
    providers.homes && providers.homes.value,
    providers.attom && providers.attom.value
  ].filter(value => Number.isFinite(value) && value > 0);

  if (!values.length) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!adminToken) {
    next();
    return;
  }

  const providedToken = req.get("x-admin-token") || req.query.token;
  if (providedToken !== adminToken) {
    res.status(401).json({ error: "Admin token is required." });
    return;
  }

  next();
}

app.get("/api/admin/usage", requireAdmin, async (req, res) => {
  try {
    const dashboard = await getUsageDashboard(req.query.month);
    res.status(200).json(dashboard);
  } catch (error) {
    console.error("Admin usage dashboard failed:", error.message);
    res.status(503).json({ error: "Usage dashboard is temporarily unavailable." });
  }
});

app.get("/api/estimate", async (req, res) => {
  const query = {
    street: firstString(req.query.street),
    city: firstString(req.query.city),
    state: firstString(req.query.state).toUpperCase(),
    zip: firstString(req.query.zip)
  };

  if (!query.street || !query.city || !query.state || !query.zip) {
    res.status(400).json({ error: "street, city, state, and zip are required" });
    return;
  }

  let usage;
  try {
    usage = await trackLookupUsage(req.ip, query);
  } catch (error) {
    console.error("Usage tracking failed:", error.message);
    res.status(503).json({ error: "Lookup usage tracking is temporarily unavailable. Please try again shortly." });
    return;
  }

  if (!usage.allowed) {
    res.status(429).json({
      error: "Monthly free lookup limit reached for this IP address.",
      usage
    });
    return;
  }

  const zillow = await getZillow(query);
  await delay(providerDelayMs);
  const redfin = await getRedfin(query);
  await delay(providerDelayMs);
  const realtor = await getRealtor(query);
  await delay(providerDelayMs);
  const homes = await getHomes(query);
  await delay(providerDelayMs);
  const attom = await getAttom(query);

  const providers = { zillow, redfin, realtor, homes, attom };

  res.status(200).json({
    address: query,
    home: buildHomeFacts(query, providers),
    blendedEstimate: blendedEstimate(providers),
    providers,
    zillow: {
      zestimate: zillow.value || null,
      rentZestimate: zillow.rentEstimate || null,
      homeDetails: zillow.link || ""
    },
    realtyMole: {
      price: homes.value || null,
      listingUrl: homes.link || ""
    },
    melissa: {
      value: null,
      Records: []
    },
    redfin: {
      value: redfin.value || null,
      link: redfin.link || ""
    },
    realtor: {
      value: realtor.value || null,
      link: realtor.link || ""
    },
    homes: {
      value: homes.value || null,
      link: homes.link || ""
    },
    attom: {
      value: attom.value || null,
      link: attom.link || "",
      low: attom.meta && attom.meta.low || null,
      high: attom.meta && attom.meta.high || null,
      confidenceScore: attom.meta && attom.meta.confidenceScore || null,
      valuationDate: attom.meta && attom.meta.valuationDate || ""
    },
    mashvisor: {
      value: null
    },
    usage
  });
});

const buildPath = path.join(__dirname, "client/build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

initializeUsageTracking()
  .then(() => {
    app.listen(port, () => {
      console.log(`Free Home Appraisal running on port ${port}`);
    });
  })
  .catch(error => {
    console.error("Failed to initialize usage tracking:", error.message);
    app.listen(port, () => {
      console.log(`Free Home Appraisal running on port ${port} without initialized usage tracking`);
    });
  });
