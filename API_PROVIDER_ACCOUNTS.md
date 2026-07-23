# API Provider Account

The app now starts with a single provider account: RealtyAPI.

`client/api/estimate.js` calls RealtyAPI from a server-side function and fans out to separate RealtyAPI platform hosts in sequence:

- Zillow: `https://zillow.realtyapi.io`
- Redfin: `https://redfin.realtyapi.io`
- Realtor.com: `https://realtor.realtyapi.io`

The default delay between platform calls is 400 ms. Override it with:

```text
REALTYAPI_PROVIDER_DELAY_MS=400
```

## Required Key

Add this value as a Vercel project environment variable:

```text
REALTYAPI_KEY=your_realtyapi_key_here
```

Do not put this key in a `REACT_APP_*` variable. RealtyAPI keys must stay server-side.

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
