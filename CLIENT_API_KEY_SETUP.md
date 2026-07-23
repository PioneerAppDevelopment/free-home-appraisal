# Free Home Appraisal API Key Setup

This project is starting with one API provider account: RealtyAPI.

RealtyAPI gives us one API key that can call multiple real estate data sources, including Zillow, Redfin, Realtor.com, and Homes.com.

Please use a company-owned email address for the account, not a personal email address.

Important: API keys are passwords for paid data access. Do not paste them into regular email. Share the key through a secure password manager, encrypted note, or add it directly to the Vercel project environment variables if you have access.

## What We Need Back

Please provide this value:

```text
REALTYAPI_KEY=
```

## RealtyAPI Setup

Purpose: RealtyAPI powers the first version of the live estimate aggregator. We use it to pull property data from multiple large real estate sites through one account.

Website: https://www.realtyapi.io/

Steps:

1. Go to https://www.realtyapi.io/.
2. Click **Get API Key** or **Sign Up**.
3. Create the account with a company-owned email address.
4. Choose the lowest plan that supports API testing. RealtyAPI may include starter credits or free calls.
5. In the dashboard, create or copy the API key.
6. Confirm the account can access these providers:
   - Zillow
   - Redfin
   - Realtor.com
   - Homes.com
7. Send us the key securely as:

```text
REALTYAPI_KEY=the_key_you_created
```

## Final Checklist

Before sending this back, please confirm:

- The RealtyAPI account is owned by the client's company.
- Billing is enabled if RealtyAPI requires it.
- API access is active, not just a marketing/demo account.
- The key name is copied exactly: `REALTYAPI_KEY`.
- The key is shared securely, not pasted into normal email.

## Reference Links

- RealtyAPI website: https://www.realtyapi.io/
- RealtyAPI docs: https://www.realtyapi.io/docs
- RealtyAPI OpenAPI specs: https://www.realtyapi.io/docs/integrations/openapi
- Zillow endpoint example: https://zillow.realtyapi.io/openapi.json
- Redfin endpoint example: https://redfin.realtyapi.io/openapi.json
- Realtor endpoint example: https://realtor.realtyapi.io/openapi.json
