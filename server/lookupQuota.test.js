const test = require("node:test");
const assert = require("node:assert/strict");
const { getQuotaUsage } = require("./lookupQuota");

test("counts active allowed lookups after a quota reset", () => {
  assert.deepEqual(getQuotaUsage({ limit: 3, allowedLookupCount: 2 }), {
    used: 2,
    remaining: 1,
    overLimit: false
  });
});

test("marks a quota exhausted when active allowed lookups equal its limit", () => {
  assert.deepEqual(getQuotaUsage({ limit: 3, allowedLookupCount: 3 }), {
    used: 3,
    remaining: 0,
    overLimit: true
  });
});
