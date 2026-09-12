# Lookup Quota and Visitor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors request additional searches after exhausting their free quota, and let administrators reset and inspect visitor quotas without losing reporting history.

**Architecture:** Keep raw lookup history immutable. A `property_lookup_quota_resets` row defines the most recent reset boundary for an IP address and month; allowed lookups after that point count against the active quota. Page-visit rows store only hosting-provided location headers. The client renders server-provided blocked-search copy and routes visitors to a contact form that explicitly requests more searches.

**Tech Stack:** Node.js 20, Express, PostgreSQL, React 18, React Router 6, Jest/React Testing Library, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-lookup-quota-and-visitor-dashboard-design.md`

## Global Constraints

- Do not send visitor IP addresses to a third-party location provider.
- Use only trusted, hosting-supplied request headers for city and state; render `Unknown` when unavailable.
- The blocked-search text must be exactly: `You’ve reached the maximum number of free searches. If you would like more searches, please contact us and we will provide you with more.`
- Derive the contact requester IP on the server; never accept it from browser form input.
- Preserve lookup and visitor records when an administrator resets a quota.
- Keep the logo 50 percent larger and in the same public-header position on Home and Learn More.

---

## File Structure

- Create: `server/lookupQuota.js` — pure reset-boundary and quota-count logic used by usage tracking and Node tests.
- Create: `server/lookupQuota.test.js` — regression coverage for reset-boundary behavior.
- Modify: `server/usageTracker.js` — migrations, reset persistence, reset-aware lookup counting, hosting-header location persistence, dashboard data.
- Modify: `index.js` — authenticated reset endpoint, trusted visitor location extraction, approved blocked-search response, and contact IP context.
- Modify: `server/contactMailer.js` — validates explicit request type and writes request/IP metadata into the email.
- Modify: `client/src/services/adminApi.js` — authenticated reset API call.
- Modify: `client/src/containers/AdminUsageDashboard.js` and `.css` — visitor city/state display and reset action with loading/error states.
- Modify: `client/src/services/api.js` and `client/src/App.js` — retain 429 response metadata and render the actionable blocked-search prompt.
- Modify: `client/src/content/ContactContent.js` — recognizes more-searches mode and submits the explicit request type.
- Modify: `client/src/components/FooterContainer.js`, `client/src/App.css`, `client/src/responsive.css`, and public-header components — accessible footer links and unified 150%-sized logo placement.
- Modify: `client/src/App.test.js` and add focused client tests — blocked-search action, contact request mode, and footer routing.
- Modify: `package.json` — run Node server tests with `npm test`.

### Task 1: Reset-aware quota domain logic

**Files:**
- Create: `server/lookupQuota.js`
- Create: `server/lookupQuota.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `getQuotaUsage({ limit, allowedLookupCount })`, returning `{ used, remaining, overLimit }`.

- [ ] **Step 1: Write the failing Node tests**

```js
test('counts active allowed lookups after a quota reset', () => {
  expect(getQuotaUsage({ limit: 3, allowedLookupCount: 2 }))
    .toEqual({ used: 2, remaining: 1, overLimit: false });
});

test('marks a quota exhausted when active allowed lookups equal its limit', () => {
  expect(getQuotaUsage({ limit: 3, allowedLookupCount: 3 }))
    .toEqual({ used: 3, remaining: 0, overLimit: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/lookupQuota.test.js`

Expected: failure resolving `./lookupQuota`.

- [ ] **Step 3: Write minimal implementation**

```js
function getQuotaUsage({ limit, allowedLookupCount }) {
  const used = Number(allowedLookupCount || 0);
  return { used, remaining: Math.max(limit - used, 0), overLimit: used >= limit };
}

module.exports = { getQuotaUsage };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/lookupQuota.test.js`

Expected: two passing tests.

- [ ] **Step 5: Commit**

```bash
git add package.json server/lookupQuota.js server/lookupQuota.test.js
git commit -m "feat: add reset-aware quota domain logic"
```

### Task 2: Persist resets and hosting-provided visitor locations

**Files:**
- Modify: `server/usageTracker.js`
- Modify: `index.js`
- Test: `server/lookupQuota.test.js`

**Interfaces:**
- Consumes: `getQuotaUsage({ limit, allowedLookupCount })`.
- Produces: `resetLookupQuota(ipAddress, month)`.
- Produces: `trackPageVisit(ipAddress, path, visitorLocation)` where `visitorLocation` is `{ city, state }`.
- Produces: `getLookupStartAt(resetAt)`, returning the reset timestamp or `null`.

- [ ] **Step 1: Write the failing test**

```js
test('uses the reset timestamp as the active lookup boundary', () => {
  const resetAt = new Date('2026-09-12T12:00:00.000Z');
  expect(getLookupStartAt(resetAt)).toBe(resetAt);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/lookupQuota.test.js`

Expected: failure because `getLookupStartAt` is not exported.

- [ ] **Step 3: Write minimal implementation**

Export `getLookupStartAt(resetAt) { return resetAt || null; }`. Add `property_lookup_quota_resets` with a unique `(ip_address, lookup_month)` key and `reset_at`. Add nullable `visitor_city` and `visitor_state` to `page_visit_usage` through idempotent migrations. Count allowed lookups only after `COALESCE(reset_at, '-infinity')`, retaining total and blocked lookup history. Add protected `POST /api/admin/usage/reset`, validating an IPv4/IPv6 address and `YYYY-MM`, then upserting `reset_at = NOW()`. Extract only configured hosting headers (`CF-IPCity`, `CF-Region`, `X-Appengine-City`, `X-Appengine-Region`) and pass normalized values to `trackPageVisit`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/lookupQuota.test.js`

Expected: all quota tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/lookupQuota.js server/lookupQuota.test.js server/usageTracker.js index.js
git commit -m "feat: persist quota resets and visitor locations"
```

### Task 3: Add contact request and admin dashboard flows

**Files:**
- Modify: `server/contactMailer.js`
- Modify: `index.js`
- Modify: `client/src/services/adminApi.js`
- Modify: `client/src/containers/AdminUsageDashboard.js`
- Modify: `client/src/containers/AdminUsageDashboard.css`
- Modify: `client/src/content/ContactContent.js`
- Modify: `client/src/App.js`
- Modify: `client/src/services/api.js`
- Test: `client/src/App.test.js`

**Interfaces:**
- Consumes: `POST /api/admin/usage/reset` with `{ ipAddress, month }`.
- Consumes: contact body `{ name, email, message, requestType: 'more-searches' }`.
- Produces: 429 response `{ error, usage, contactUrl: '/contact?request=more-searches' }`.

- [ ] **Step 1: Write failing client tests**

```jsx
test('shows a contact action when the lookup quota is exhausted', async () => {
  PropertyService.getEstimates.mockRejectedValueOnce(
    new EstimateRequestError(429, 'You’ve reached the maximum number of free searches.')
  );
  const ref = React.createRef();
  render(<MemoryRouter><App ref={ref} /></MemoryRouter>);
  await act(async () => {
    await ref.current.handleSearch({ address: '1 Main St, New York, NY 10001' });
  });
  expect(screen.getByRole('link', { name: 'Contact Us Now' }))
    .toHaveAttribute('href', '/contact?request=more-searches');
});

test('renders footer navigation as links', () => {
  render(<FooterContainer />, { wrapper: MemoryRouter });
  expect(screen.getByRole('link', { name: 'LEARN MORE' })).toHaveAttribute('href', '/learn-more');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --prefix client -- --runInBand --watchAll=false App.test.js`

Expected: failure because the error type/action and footer links do not exist.

- [ ] **Step 3: Write minimal implementation**

Make `PropertyService` throw an error retaining HTTP status and JSON response. Map status 429 in `App.handleSearch` to the approved copy and a React Router `Contact Us Now` link. In `ContactContent`, detect `request=more-searches`, show the request context, and submit `requestType: 'more-searches'`. In the contact route, pass `req.ip` as server-only context to `sendContactMessage`; append request/IP metadata only after validating that request type. Add a per-IP dashboard reset button with pending/error states and reload data after success. Add City and State columns using latest hosting-provided page-visit data.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --prefix client -- --runInBand --watchAll=false App.test.js`

Expected: all client tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/contactMailer.js index.js client/src/services/adminApi.js client/src/containers/AdminUsageDashboard.js client/src/containers/AdminUsageDashboard.css client/src/content/ContactContent.js client/src/App.js client/src/services/api.js client/src/App.test.js
git commit -m "feat: add lookup quota reset and contact request flows"
```

### Task 4: Unify public branding and complete verification

**Files:**
- Modify: `client/src/components/FooterContainer.js`
- Modify: `client/src/containers/LandingPageContainer.js`
- Modify: `client/src/App.css`
- Modify: `client/src/responsive.css`
- Modify: `README.md`
- Test: `client/src/App.test.js`

**Interfaces:**
- Produces: shared public logo wrapper with desktop width 690px and responsive width 345px.
- Produces: footer links to `/`, `/learn-more`, and `/contact`.

- [ ] **Step 1: Write the failing test**

```jsx
test('uses the shared public logo wrapper on the Learn More route', () => {
  render(<App />, { wrapper: ({ children }) => <MemoryRouter initialEntries={['/learn-more']}>{children}</MemoryRouter> });
  expect(screen.getByAltText('FreeHomeAppraisal.com Logo').closest('.public-logo')).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --prefix client -- --runInBand --watchAll=false App.test.js`

Expected: failure because Learn More uses a different logo wrapper.

- [ ] **Step 3: Write minimal implementation**

Replace the Learn More nested `.logo` wrapper with the shared `.public-logo` wrapper. Set the desktop logo width to 690px (150 percent of 460px), retain a viewport-safe `max-width`, and change the mobile width from 230px to 345px. Replace footer text with React Router `Link` elements, preserving typography, color, hover state, and a visible keyboard focus. Document the trusted hosting headers and reset operation in the README.

- [ ] **Step 4: Run all verification**

Run: `node --test server/lookupQuota.test.js && npm test --prefix client -- --runInBand --watchAll=false && npm run build`

Expected: server tests, client tests, and production build all exit 0.

- [ ] **Step 5: Review, commit, and push**

```bash
git add client/src/components/FooterContainer.js client/src/containers/LandingPageContainer.js client/src/App.css client/src/responsive.css client/src/App.test.js README.md
git diff --check --cached
git commit -m "fix: unify public branding and footer navigation"
git push origin master
```
