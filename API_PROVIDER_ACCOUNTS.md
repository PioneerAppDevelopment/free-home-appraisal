# API Provider Account

The app now starts with a single provider account: RealtyAPI.

`client/api/estimate.js` calls RealtyAPI from a server-side function and fans out to separate RealtyAPI platform hosts in sequence:

- Zillow: `https://zillow.realtyapi.io`
- Redfin: `https://redfin.realtyapi.io`
- Realtor.com: `https://realtor.realtyapi.io`
- Homes.com: `https://homes.realtyapi.io`

ATTOM is also used as an AVM/property-record provider:

- ATTOM AVM: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail`

RentCast is used as an AVM/comps provider:

- RentCast value estimate: `https://api.rentcast.io/v1/avm/value`

The default delay between platform calls is 400 ms. Override it with:

```text
REALTYAPI_PROVIDER_DELAY_MS=400
```

## Required Key

Add this value as a server-side project environment variable:

```text
REALTYAPI_KEY=your_realtyapi_key_here
ATTOM_API_KEY=your_attom_api_key_here
RENTCAST_API_KEY=your_rentcast_api_key_here
```

Do not put these keys in `REACT_APP_*` variables. Provider keys must stay server-side.

## Usage Tracking

Property lookups are tracked by IP address in PostgreSQL before any paid provider calls are made. Set the monthly free lookup cap with:

```text
FREE_LOOKUP_LIMIT_PER_MONTH=10
```

Set these database values in DigitalOcean:

```text
PGHOST=your_postgres_host
PGPORT=25060
PGDATABASE=defaultdb
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
DATABASE_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

`DATABASE_CA_CERT` can be either the certificate text with `\n` line breaks or a server-local file path to the CA certificate. `DATABASE_SSL_REJECT_UNAUTHORIZED=false` matches DigitalOcean's `sslmode=require` behavior and avoids startup failures from self-signed certificate chains. If usage tracking must be temporarily disabled, set:

```text
USAGE_TRACKING_ENABLED=false
```

The admin usage dashboard is available at:

```text
/admin
```

For production, set an admin token so the dashboard API is not public:

```text
ADMIN_DASHBOARD_TOKEN=choose_a_long_private_value
```

## Local Development

For frontend-only UI work:

```env
REACT_APP_USE_MOCKS=true
```

For local API testing, put `REALTYAPI_KEY` in an ignored local env file and run through Vercel dev, or deploy to Vercel with the provider env var configured.

The React app calls:

```text
/api/estimate?street=...&city=...&state=...&zip=...
```

## Later Additions

RealtyAPI gives us the quickest path to multiple large consumer sites with one key. If valuation quality needs to improve later, the next additions would be:

- RentCast for AVM/comps
- Melissa for property/tax/deed records
- Bridge Interactive if the client qualifies for official MLS/Zillow Group data access
