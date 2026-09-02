<p align="center">
  <img src="client/public/img/FreeHomeAppraisalLogo.png" alt="FreeHomeAppraisal Logo" width="600" />
</p>


FreeHomeAppraisal (branded as **FreeHomeAppraisal** / FHA) is a full-stack web application that aggregates property value estimates from multiple third-party data sources and calculates a single blended estimate called the **"FreeHomeAppraisal"**. Users enter a US home address, and the app fetches valuations from Zillow, Realtor, Redfin, Melissa Data, Realty Mole, Mashvisor, Data Tree, and Estated, then displays them side-by-side with a computed average.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Installation & Setup](#installation--setup)
6. [Running the App](#running-the-app)
7. [Backend API Reference](#backend-api-reference)
8. [Database Models](#database-models)
9. [Frontend Pages & Routes](#frontend-pages--routes)
10. [Key Components](#key-components)
11. [External API Integrations](#external-api-integrations)
12. [PDF Export](#pdf-export)
13. [Known Issues & Developer Notes](#known-issues--developer-notes)
14. [Deployment](#deployment)
15. [Future Roadmap](#future-roadmap)

---

## Architecture Overview

This is a **monorepo** containing a Node.js/Express backend (project root) and a React single-page application (in the `client/` subdirectory).

### Current State (Vercel deployment)

The **frontend is the only actively deployed piece.** It runs as a standalone React app on Vercel and handles all property estimate fetching directly on the client side via `client/src/services/api.js`. The Express backend is **not connected or called** in the current deployment.

```
Browser  ──►  React SPA (Vercel)  ──►  External APIs (directly from client)
```

### History & Intended Architecture

In earlier iterations, the backend handled all third-party API calls (Zillow, Realtor, Melissa, etc.) and served the React build as static files. The codebase was mid-refactor — moving API aggregation out of the Express server — when the frontend was deployed to Vercel for review. The backend code has been retained as a reference and starting point.

```
[Original design]
Browser  ──►  React SPA  ──►  Express /estimates/:addr  ──►  External APIs
                                    └──►  MongoDB (users, homes, contacts)
```

### Backend Refactor Opportunity

The incoming developer is free to choose a modern backend/BaaS to replace the Express server. Good candidates include:
- **Supabase** — Postgres + Auth + Edge Functions
- **Firebase** — Firestore + Auth + Cloud Functions
- **Convex / PlanetScale / Neon** — serverless-friendly alternatives

All the original third-party API integration logic is preserved in `index.js` as a reference for whatever replacement is built.

---

## Tech Stack

### Backend
| Concern | Library / Version |
|---|---|
| Runtime | Node.js 12.16.x |
| HTTP server | Express 4 |
| Database ORM | Mongoose 5 |
| Database | MongoDB (local, `resthub` db) |
| Zillow API client | node-zillow 2 |
| HTTP requests | node-fetch 2 |
| PDF generation | pdfkit 0.11 |
| Config | dotenv |

### Frontend
| Concern | Library / Version |
|---|---|
| Runtime | Node.js 18.x |
| Framework | React 18 |
| Routing | React Router DOM v6 |
| UI Components | MUI (Material UI) v5 |
| Charting | Recharts 2 |
| Maps | google-map-react 2 |
| Address Search | Google Places Autocomplete API |
| PDF export | jsPDF 2 + html2canvas 1 |
| HTTP requests | Axios 1 |
| Styling | CSS, SCSS, Tailwind CSS 3 |

---

## Project Structure

```
free-home-appraisal/
├── index.js                  # Express server entry point — all API aggregation logic lives here
├── package.json              # Backend dependencies & scripts
├── .env                      # Backend environment variables (not committed)
├── md-seed-config.js         # mongoose-data-seed configuration
│
├── routes/
│   └── api-routes.js         # CRUD REST routes for /api/contacts, /api/users, /api/homes
│
├── controllers/
│   ├── contactController.js  # CRUD handlers for Contact model
│   ├── userController.js     # CRUD handlers for User model
│   └── homeController.js     # CRUD handlers for Home model
│
├── models/
│   ├── contactModel.js       # Mongoose schema: Contact
│   ├── userModel.js          # Mongoose schema: User
│   └── homeModel.js          # Mongoose schema: Home (property records)
│
├── seeders/
│   ├── users.seeder.js       # Seed data for User collection
│   └── homes.seeder.js       # Seed data for Home collection
│
└── client/                   # React frontend (Create React App, ejected)
    ├── package.json
    ├── .env                  # Frontend environment variables (not committed)
    ├── .env.example          # Template for frontend env vars
    ├── vercel.json           # Vercel deployment config (frontend-only deploys)
    │
    └── src/
        ├── App.js            # Root component — holds all app state, routing, search logic
        ├── index.js          # ReactDOM entry point, wraps App in BrowserRouter
        │
        ├── services/
        │   └── api.js        # API service layer (currently returns MOCK DATA — see Dev Notes)
        │
        ├── containers/
        │   ├── LandingPageContainer.js   # Hero section with CTA buttons
        │   ├── NavContainer.js           # Nav + search bar shown on /estimates page
        │   ├── APIContainer.js           # Results layout (HouseCard + estimates + PDF button)
        │   ├── EstimateContainer.js      # Grid of EstimateCard components
        │   ├── EmptySearchContainer.js   # Shown when no search has been performed
        │   ├── FooterContainer.js        # Site footer
        │   └── ProfilePage.js            # Placeholder profile page
        │
        ├── components/
        │   ├── Places.js         # Google Places Autocomplete address input (active search input)
        │   ├── NewSearch.js      # Thin wrapper around Places.js
        │   ├── SearchBar.js      # Older MUI Autocomplete search bar (currently commented out)
        │   ├── HouseCard.js      # Property details card: Street View photo, map, home info, amenities
        │   ├── Map.js            # Google Map centered on the searched property
        │   ├── MapMarker.js      # Pin marker component for Map.js
        │   ├── EstimateCard.js   # Individual estimate card (one per data source)
        │   ├── FHAEstimate.js    # Computes and displays the blended "FreeHomeAppraisal" average
        │   ├── PDFButton.js      # Download PDF button
        │   ├── UserLogin.js      # Login modal with inline SignUp toggle
        │   ├── SignUp.js         # Sign-up form component (UI only)
        │   ├── NavMenu.js        # Top navigation links
        │   ├── Logo.js           # Logo component
        │   ├── Title.js          # Page title component
        │   ├── Waves.js          # Decorative SVG wave animation
        │   ├── CenterWidget.js   # Dashboard widget (unused in routing)
        │   ├── LeftWidget.js     # Dashboard widget (unused in routing)
        │   ├── RightWidget.js    # Dashboard widget (unused in routing)
        │   └── connector.js      # HOC used by Places.js
        │
        ├── content/
        │   ├── LandingPageContent.js   # Marketing copy sections on the home page
        │   ├── AboutContent.js         # About page body (placeholder Lorem Ipsum)
        │   ├── ContactContent.js       # Contact form (UI only — no submission handler)
        │   └── SellMyHomeContent.js    # Sell My Home page body (placeholder Lorem Ipsum)
        │
        ├── contexts/
        │   ├── UserAuthContext.js   # Empty — planned for auth state
        │   ├── HouseContext.js      # Empty — planned for property state
        │   └── ThemeContext.js      # Empty — planned for theming
        │
        └── dashboard/              # MUI Dashboard starter (not currently routed/used)
            ├── Dashboard.js
            ├── Chart.js
            ├── Deposits.js
            ├── Orders.js
            ├── Title.js
            └── listItems.js
```

---

## Environment Variables

### Backend — `/.env`

Create a `.env` file in the project root:

```env
PORT=4000

# Zillow API (via node-zillow)
ZILLOW_TOKEN=your_zillow_zwsid_here

# Melissa Data Property API
MELISSA_TOKEN=your_melissa_api_token_here

# RapidAPI key (shared across Realtor, Realty Mole, Mashvisor)
X_RAPID_API_KEY=your_rapidapi_key_here
```

### Frontend — `/client/.env`

Create a `.env` file inside the `client/` directory (see `client/.env.example`):

```env
# Google Maps (Street View images, interactive map, Places Autocomplete)
REACT_APP_GOOGLE_MAP_API_KEY=your_google_maps_api_key_here

# Optional — if direct frontend API calls are re-enabled
REACT_APP_ZILLOW_TOKEN=your_zillow_token_here
REACT_APP_MELISSA_TOKEN=your_melissa_token_here
REACT_APP_RAPIDAPI_KEY=your_rapidapi_key_here
```

> **Note:** The Google Maps key must have the following APIs enabled: **Maps JavaScript API**, **Street View Static API**, and **Places API**.

---

## Installation & Setup

### Prerequisites

- Node.js 18.x (for the frontend)
- Node.js 12.x (for the backend — or use `nvm` to switch)
- MongoDB running locally on default port `27017`

### 1. Install backend dependencies

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 3. Configure environment variables

Copy and fill in both `.env` files as described in [Environment Variables](#environment-variables).

### 4. (Optional) Seed the database

```bash
npx md-seed run
```

This populates the `homes` and `users` collections with sample data from `seeders/`.

---

## Running the App

### Development

Run the backend and frontend in two separate terminal windows:

**Terminal 1 — Backend (Express on port 4000):**
```bash
node index.js
# or with auto-restart:
npx nodemon index.js
```

**Terminal 2 — Frontend (React dev server on port 3000):**
```bash
cd client
npm start
```

The React dev server proxies API calls to Express if configured, or they can be called directly at `http://localhost:4000`.

### Production (Heroku / single-server)

The `heroku-postbuild` script in `package.json` handles building the frontend automatically:

```bash
# This happens automatically on Heroku push:
cd client && npm install && npm run build

# Then start the server:
npm start
```

The Express server will serve the React build from `client/build/` and handle all routes.

---

## Backend API Reference

### Base URL

- Development: `http://localhost:4000`
- Production: your deployed domain

---

### Property Estimates

#### `GET /estimates/:street_address/:city/:state/:zip`

The core endpoint. Calls multiple third-party APIs in parallel/sequence and returns aggregated estimate data.

**URL Parameters**

| Parameter | Description | Example |
|---|---|---|
| `street_address` | Street address with `+` replacing spaces | `123+Main+St` |
| `city` | City name with `+` replacing spaces | `Springfield` |
| `state` | Full state name (converted to abbreviation internally) | `New+York` |
| `zip` | 5-digit ZIP code | `11953` |

**Response**

```json
{
  "zillow": { ... },
  "realtor": {
    "value": 450000,
    "extraData": {
      "heating": "Gas",
      "cooling": "Central",
      "additionalPhotos": [...],
      "description": "...",
      "propStatus": "for sale"
    }
  },
  "melissa": { "value": 440000 },
  "redfin": { "value": 455000 },
  "mashvisor": { "value": 462000 },
  "realtyMole": { "value": 448000 }
}
```

**Helper Functions in `index.js`**

- `directionCorrection(input)` — Converts cardinal direction words in addresses (e.g., `North` → `N`) for API compatibility with Realty Mole and Mashvisor.
- `convertRegion(input)` — Converts full state names to two-letter abbreviations (e.g., `New York` → `NY`).

---

### REST API (`/api/*`)

All routes are prefixed with `/api`.

#### Contacts

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/contacts` | Get all contacts |
| `POST` | `/api/contacts` | Create a new contact |
| `GET` | `/api/contacts/:contact_id` | Get a contact by ID |
| `PUT` / `PATCH` | `/api/contacts/:contact_id` | Update a contact |
| `DELETE` | `/api/contacts/:contact_id` | Delete a contact |

#### Users

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/users` | Get all users |
| `POST` | `/api/users` | Create a new user |
| `GET` | `/api/users/:user_id` | Get a user by ID |
| `PUT` / `PATCH` | `/api/users/:user_id` | Update a user |
| `DELETE` | `/api/users/:user_id` | Delete a user |

#### Homes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/homes` | Get all saved home records |
| `POST` | `/api/homes` | Create a new home record |
| `GET` | `/api/homes/:home_id` | Get a home by ID |
| `PUT` / `PATCH` | `/api/homes/:home_id` | Update a home record |
| `DELETE` | `/api/homes/:home_id` | Delete a home record |

---

## Database Models

MongoDB database: `resthub`

### User

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_prefix` | String | Yes | e.g., "Mr.", "Dr." |
| `first_name` | String | Yes | |
| `last_name` | String | Yes | |
| `phone_number` | String | No | |
| `city` | String | No | |
| `state` | String | No | |
| `professional` | Boolean | Yes | Whether user is a real estate professional |
| `email` | String | Yes | |
| `password` | String | Yes | **Stored in plain text — must be hashed before production use** |
| `create_date` | Date | — | Defaults to `Date.now` |

### Home

| Field | Type | Notes |
|---|---|---|
| `img` | String | Image URL |
| `home_type` | String | e.g., "Single Family" |
| `year_built` | Number | |
| `sqft` | Number | Finished square footage |
| `lot_size` | Number | Lot size in sqft |
| `stories` | Number | |
| `bedrooms` | Number | |
| `bathrooms` | Number | |
| `kitchens` | Number | |
| `garage` | Number | |
| `parking` | String | |
| `pool` | String | |
| `fireplace` | String | |
| `ac` | String | |
| `heating` | String | |
| `washer_dryer` | String | |
| `sold_date` | String | |
| `forclosure` | Boolean | Note: misspelled in codebase (`forclosure` not `foreclosure`) |
| `short_sale` | Boolean | |
| `street_number` | String | |
| `street_address` | String | |
| `city` | String | |
| `state` | String | |
| `zip_code` | String | |

### Contact

| Field | Type | Required |
|---|---|---|
| `name` | String | Yes |
| `email` | String | Yes |
| `gender` | String | No |
| `phone` | String | No |
| `create_date` | Date | Defaults to `Date.now` |

---

## Frontend Pages & Routes

Defined in `client/src/App.js` using React Router v6.

| Path | Component(s) | Description |
|---|---|---|
| `/` | `LandingPageContainer` + `LandingPageContent` + `Footer` | Marketing landing page with hero, CTA, and about sections |
| `/estimates` | `NavContainer` + `APIContainer` or `EmptySearchContainer` + `Footer` | Main search and results page |
| `/about` | `NavMenu` + `AboutContent` + `Footer` | About page (placeholder content) |
| `/contact` | `NavMenu` + `ContactContent` + `Footer` | Contact form page |
| `/sell-my-home` | `NavMenu` + `SellMyHomeContent` + `Footer` | Sell My Home page (placeholder content) |
| `/profile` | `ProfilePage` | User profile page (placeholder) |
| `/signup` | `SignUp` | Sign-up form |

---

## Key Components

### `App.js` — Application Root

Holds the central application state as a class component:

- **`estimates`** — Object containing estimate data for all 8 providers (Zillow, Realtor, Redfin, Melissa, Mashvisor, Realty Mole, Data Tree, Estated). Each has `id`, `site_name`, `img`, `value`, `link`, and `active` fields.
- **`foundHome`** — Parsed property data (address, bedrooms, bathrooms, sqft, lat/long).
- **`isLoading` / `loading`** — Controls the loading overlay screen.
- **`searchPerformed`** — Tracks whether a search has been run.

Key methods:
- `handleSearch(searchData)` — Parses address and calls the API service; populates state with results.
- `parseAddress(address)` — Splits a formatted address string into `[street, city, state, zip]`.
- `toggleEstimate(e, id)` — Marks individual estimate cards as active/inactive to include/exclude them from the FreeHomeAppraisal average.
- `savePage()` — Triggers PDF export of the `#print-area` div.
- `getSearchResults(queryObj)` — Passed as a prop to search components; delegates to `handleSearch`.

### `Places.js` — Address Search Input

Uses the **Google Places Autocomplete** API to provide address suggestions restricted to US addresses. On selection, calls `props.search({ address, lat, long })` passing both the formatted address and coordinates.

### `HouseCard.js` — Property Detail Card

Displays:
- **Google Street View** photo of the property (uses `REACT_APP_GOOGLE_MAP_API_KEY`)
- **Interactive Google Map** centered on the property coordinates
- Home info: type, year built, size, lot size, rooms, beds, baths
- Status: last sold date, last sold price, listing status
- Amenities: garage, parking, heating, AC, pool, fireplace, washer/dryer
- Optional description block from Realtor data

### `EstimateCard.js` — Single Source Estimate

Displays the logo, estimated value, and a "Remove Listing" toggle for each data source. A disabled CSS class is applied when `value` is null (not found).

### `FHAEstimate.js` — Blended Estimate ("FreeHomeAppraisal")

Filters the estimates array to only `active` estimates with numeric values, then computes and displays the arithmetic mean. Shows "No Estimates Found" if no valid values exist.

### `UserLogin.js` — Login Modal

Renders a login/logout button in the nav. Opens an MUI Modal with email/password fields and a "Create Account" toggle that switches to the `SignUp` component.

> ⚠️ **Currently uses hardcoded credentials** — see [Known Issues](#known-issues--developer-notes).

---

## External API Integrations

All live API calls are made server-side in `index.js`. The frontend's `services/api.js` currently returns **mock data** (see Dev Notes).

### Zillow

- **Library:** `node-zillow`
- **Method:** `GetDeepSearchResults`
- **Env var:** `ZILLOW_TOKEN` (ZWSID)
- **Returns:** Zestimate value, home details link, property info (beds, baths, sqft, year built, etc.)

### Realtor (via RapidAPI)

- **Host:** `realtor.p.rapidapi.com`
- **Flow:** Two-step — first call auto-completes the address to get an `mpr_id`, second call fetches listing detail
- **Env var:** `X_RAPID_API_KEY`
- **Returns:** Listing price, heating, cooling, photos, description, listing status

### Realty Mole (via RapidAPI)

- **Host:** `realty-mole-property-api.p.rapidapi.com`
- **Endpoint:** `/salePrice`
- **Env var:** `X_RAPID_API_KEY`
- **Returns:** Sale price estimate

### Melissa Data

- **Host:** `property.melissadata.net`
- **Endpoint:** `/v4/WEB/LookupProperty/`
- **Column group:** `GrpEstimatedValue`
- **Env var:** `MELISSA_TOKEN`
- **Returns:** `Tax.MarketValueTotal`

### Mashvisor / Redfin (via RapidAPI)

- **Host:** `mashvisor-api.p.rapidapi.com`
- **Flow:** Two-step — first call looks up property by address to get an internal `id`, second call fetches estimates
- **Env var:** `X_RAPID_API_KEY`
- **Returns:** `redfin_estimate` and `mashvisor_estimate`

### Google Maps (Frontend only)

- **APIs used:** Maps JavaScript API, Street View Static API, Places API
- **Env var:** `REACT_APP_GOOGLE_MAP_API_KEY`
- **Used by:** `Map.js` (interactive map), `HouseCard.js` (Street View photo), `Places.js` (address autocomplete)
- **Note:** The Google Maps script is loaded via `public/index.html` (not dynamically) to avoid conflicts between the Maps SDK and the Places Autocomplete service.

---

## PDF Export

When the user clicks **Download PDF** on the results page:

1. `App.savePage()` is called.
2. `html2canvas` captures the `#print-area` div (the full results section) as a canvas.
3. `jsPDF` creates a legal-size portrait PDF and embeds the canvas image.
4. The file is saved as `<street_address>.pdf`.

The `#print-area` div wraps `HouseCard`, `EstimateContainer`, `FHAEstimate`, and the `PDFButton` inside `APIContainer`.

---

## Known Issues & Developer Notes

> This section is critical reading for anyone continuing development.

1. **Frontend currently uses mock/placeholder data**
   `client/src/services/api.js` returns **hardcoded mock data** (Zillow: $525,000, Realty Mole: $510,000). This was intentional for the current Vercel deployment — the frontend was shipped for UI review while backend refactoring was in progress. The original third-party API call logic exists in `index.js` as a reference. The next developer should replace `services/api.js` with real API calls using whatever backend/BaaS is chosen.

2. **Authentication not implemented**
   `UserLogin.js` previously had hardcoded credentials and now shows a stub alert. There is no real authentication system. The `TODO` comment in `handleSubmit()` includes integration notes for Supabase, Firebase Auth, or a custom JWT endpoint. The User model in the database is also not connected to any login flow.

3. **Placeholder content pages**
   `AboutContent.js` and `SellMyHomeContent.js` contain Lorem Ipsum placeholder text.

4. **Contact form not connected**
   The contact form in `ContactContent.js` has full UI and state management but no `onSubmit` handler — the form data goes nowhere.

5. **Data Tree & Estated estimates are always null**
   `EstimateCard` renders cards for `dataTreeEstimate` and `estatedEstimate` but no API call populates these values. They will always show "Not Found".

6. **`SearchBar.js` is not active**
   The original MUI Autocomplete-based search bar is replaced by `Places.js`. `SearchBar.js` still exists but is commented out in `NavContainer.js`.

7. **Empty context files**
   `HouseContext.js`, `ThemeContext.js`, and `UserAuthContext.js` are empty stubs — they were planned but never implemented.

8. **Dashboard is not routed**
   The `client/src/dashboard/` directory contains a Material UI Dashboard template but is not connected to any route in `App.js`.

9. **`homeController.js` field mismatch**
   The `Home` model schema contains property data fields (sqft, bedrooms, etc.) but the controller's `new` and `update` handlers set user-like fields (`home_prefix`, `first_name`, `last_name`, `email`, `password`). This appears to be a copy-paste error from `userController.js`.

10. **Node version mismatch**
    The backend `package.json` specifies Node 12.16.x, while the frontend specifies Node 18.x. Use `nvm` or equivalent to manage this.

---

## Deployment

### Frontend — Vercel (Active)

The React frontend (`client/`) is the only actively deployed piece. It lives on Vercel as a standalone static app.

**Deploy steps:**

1. Connect the `client/` directory (or the full repo with root directory set to `client/`) to a Vercel project.
2. Set the following environment variables in the Vercel project dashboard:
   - `REACT_APP_GOOGLE_MAP_API_KEY`
   - Any other `REACT_APP_*` vars needed (see [Environment Variables](#environment-variables))
3. Vercel will run `npm run build` automatically on each push.

The `vercel.json` routes all non-static paths to `index.html` so React Router client-side navigation works correctly.

> **Current state:** The deployed frontend uses hardcoded mock data in `services/api.js`. No backend is required to run the app as-is.

### Backend — Not Currently Deployed

The Express backend (`index.js`) is **not deployed** and is **not called** by the current Vercel frontend. The code is retained as a reference for the original API aggregation logic.

The new developer should replace it with a modern backend or BaaS of their choice (see [Architecture Overview](#architecture-overview)). When a new backend is in place, `client/src/services/api.js` is the single file to update to wire real data into the frontend.

---

## Future Roadmap

Based on notes within the codebase and the current state of development:

### Priority: Backend / Data Layer
- Choose and implement a backend/BaaS (Supabase, Firebase, etc.) to replace the Express server
- Replace `client/src/services/api.js` mock data with real API calls to the new backend
- Port the third-party API integrations from `index.js` into the new backend (all logic is preserved there as a reference)
- Implement real user authentication (JWT, OAuth, or BaaS-native auth), replacing the hardcoded credentials in `UserLogin.js`
- Store passwords securely (bcrypt or delegate entirely to BaaS auth)

### Features
- Add more estimation data sources (Data Tree, Estated — cards already exist in the UI but return no data)
- User accounts with saved addresses and properties
- Ability for users to correct/upload home data and photos
- Wire up the contact form submission to an email service

### Content & Polish
- Build out the `/about` and `/sell-my-home` pages (currently Lorem Ipsum placeholders)
- Implement the `UserAuthContext`, `HouseContext`, and `ThemeContext` stubs
- Activate the admin Dashboard view (`client/src/dashboard/`) with role-based access
- Add `REACT_APP_API_URL` env var support so `services/api.js` can point at the new backend URL without code changes
