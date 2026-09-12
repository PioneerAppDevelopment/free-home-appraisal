function getQuotaUsage({ limit, allowedLookupCount }) {
  const used = Number(allowedLookupCount || 0);
  return { used, remaining: Math.max(limit - used, 0), overLimit: used >= limit };
}

module.exports = { getQuotaUsage };
