# Lookup quota and visitor dashboard design

## Context

The application limits free property searches per visitor IP address and
already records lookup and page-visit activity. Administrators need to reset
an individual IP's monthly search allowance without losing the activity that
supports reporting. Visitors who reach the limit need a clear route to ask for
more searches. The dashboard should expose visitor location only when the
hosting platform has supplied it; it must not send visitor IP addresses to a
third-party geolocation provider.

## Decision

- Add a per-IP, per-month quota-reset record. The active allowance is based on
  allowed lookups made after the most recent reset. Existing lookup records are
  retained for reporting and auditability.
- Add an authenticated admin endpoint and dashboard action to record a reset.
  The action reloads the selected month after success.
- Capture city and state from trusted hosting-provided request headers when
  available. Store those values with page visits and expose the latest known
  values in the admin IP table. Display `Unknown` when the platform does not
  provide either value. Do not call a third-party location service.
- Return the approved, user-facing maximum-search message on blocked lookups.
  The frontend presents a Contact Us Now button that navigates to the contact
  form with an explicit more-searches request context.
- The contact API derives the requester IP from the incoming request and adds
  the more-searches request context to the email. It does not accept an IP
  value from the browser.
- Consolidate the public header logo layout so home and Learn More use the
  same placement; increase its rendered size by 50 percent. Replace footer
  text with accessible internal navigation links.

## Data flow

1. A page visit records the request IP, requested path, and hosting-supplied
   city/state when present.
2. A lookup checks for that IP's latest reset in the active month and counts
   only allowed lookups after the reset timestamp. It then records the lookup
   attempt as allowed or blocked.
3. A blocked lookup returns the approved contact prompt. Choosing it opens the
   contact page in more-searches mode. On submit, the server adds the request
   type and server-derived IP to the contact email.
4. An administrator selects Reset quota for an IP. The server upserts a reset
   record for that IP and month. The dashboard refreshes, preserving all
   historic usage and visitor data.

## Error handling and security

- Reset requests use the existing admin-token protection and validate both the
  IP address and month server-side.
- Failed hosting location extraction is non-fatal and records no location.
- A reset action exposes a clear error without changing the dashboard data.
- The contact submission only includes requester metadata for the explicit
  more-searches request mode.

## Verification

- Add regression tests for reset-aware usage counting, blocked lookup copy,
  contact-request metadata, and footer navigation.
- Run the client test suite and production build.
