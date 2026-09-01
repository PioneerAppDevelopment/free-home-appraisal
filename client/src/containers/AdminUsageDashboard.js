import React, { useEffect, useMemo, useState } from 'react';
import AdminApi from '../services/adminApi';
import './AdminUsageDashboard.css';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function percent(value, total) {
  if (!total) {
    return '0%';
  }
  return `${Math.round((value / total) * 100)}%`;
}

export default function AdminUsageDashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [token, setToken] = useState(window.localStorage.getItem('adminDashboardToken') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsage = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await AdminApi.getUsage(month, token);
      setData(result);
      if (token) {
        window.localStorage.setItem('adminDashboardToken', token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const summary = data?.summary || {};
  const totalLookups = summary.total_lookups || 0;
  const allowedLookups = summary.allowed_lookups || 0;
  const blockedLookups = summary.blocked_lookups || 0;
  const uniqueIps = summary.unique_ips || 0;

  const highestIp = useMemo(() => {
    if (!data?.byIp?.length) {
      return null;
    }
    return data.byIp[0];
  }, [data]);

  return (
    <main className="admin-dashboard">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">FreeHomeAppraisal</p>
          <h1>Usage Dashboard</h1>
          <p className="admin-subtitle">
            Track lookup activity by IP address, monitor monthly quota pressure, and spot repeat usage patterns.
          </p>
        </div>
        <div className="admin-controls">
          <label>
            Month
            <input type="month" value={month} onChange={event => setMonth(event.target.value)} />
          </label>
          <label>
            Admin token
            <input
              type="password"
              value={token}
              placeholder="Only needed if configured"
              onChange={event => setToken(event.target.value)}
            />
          </label>
          <button type="button" onClick={loadUsage}>Refresh</button>
        </div>
      </section>

      {error ? <div className="admin-alert">{error}</div> : null}

      <section className="admin-metrics">
        <article>
          <span>Total Lookups</span>
          <strong>{formatNumber(totalLookups)}</strong>
          <small>{formatNumber(uniqueIps)} unique IPs</small>
        </article>
        <article>
          <span>Allowed</span>
          <strong>{formatNumber(allowedLookups)}</strong>
          <small>{percent(allowedLookups, totalLookups)} of requests</small>
        </article>
        <article>
          <span>Blocked</span>
          <strong>{formatNumber(blockedLookups)}</strong>
          <small>{percent(blockedLookups, totalLookups)} over limit</small>
        </article>
        <article>
          <span>Monthly Limit</span>
          <strong>{data?.limitPerIp ? formatNumber(data.limitPerIp) : 'Off'}</strong>
          <small>free lookups per IP</small>
        </article>
      </section>

      <section className="admin-insights">
        <div className="admin-panel">
          <h2>Usage by IP</h2>
          <p>
            {highestIp
              ? `Top IP ${highestIp.ip_address} used ${formatNumber(highestIp.allowed_lookups)} allowed lookups this month.`
              : 'No lookup activity for this month yet.'}
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Allowed</th>
                  <th>Blocked</th>
                  <th>Total</th>
                  <th>Remaining</th>
                  <th>Last Lookup</th>
                  <th>Last Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7">Loading usage data...</td></tr>
                ) : data?.byIp?.length ? data.byIp.map(row => (
                  <tr key={row.ip_address} className={row.over_limit ? 'is-over-limit' : ''}>
                    <td>{row.ip_address}</td>
                    <td>{formatNumber(row.allowed_lookups)}</td>
                    <td>{formatNumber(row.blocked_lookups)}</td>
                    <td>{formatNumber(row.total_lookups)}</td>
                    <td>{row.remaining === null ? 'N/A' : formatNumber(row.remaining)}</td>
                    <td>{formatDate(row.last_lookup_at)}</td>
                    <td>{row.last_lookup_address || 'N/A'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="7">No usage has been recorded for this month.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="admin-side">
          <div className="admin-panel">
            <h2>Top Locations</h2>
            <ul className="admin-list">
              {data?.topLocations?.length ? data.topLocations.map(location => (
                <li key={`${location.city}-${location.state}-${location.zip}`}>
                  <span>{[location.city, location.state, location.zip].filter(Boolean).join(', ') || 'Unknown'}</span>
                  <strong>{formatNumber(location.total_lookups)}</strong>
                </li>
              )) : <li><span>No location data yet</span><strong>0</strong></li>}
            </ul>
          </div>

          <div className="admin-panel">
            <h2>Recent Lookups</h2>
            <ul className="admin-recent">
              {data?.recentLookups?.length ? data.recentLookups.slice(0, 8).map((lookup, index) => (
                <li key={`${lookup.ip_address}-${lookup.created_at}-${index}`}>
                  <div>
                    <strong>{lookup.ip_address}</strong>
                    <span>{[lookup.street, lookup.city, lookup.state, lookup.zip].filter(Boolean).join(', ')}</span>
                  </div>
                  <em className={lookup.allowed ? 'allowed' : 'blocked'}>{lookup.allowed ? 'Allowed' : 'Blocked'}</em>
                </li>
              )) : <li>No recent activity</li>}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
