// =============================================================
// MOCK API SERVICE — Development / UI Preview Mode
// =============================================================
//
// This file returns hardcoded data so the app can be run and
// developed without any live API keys or a backend server.
//
// HOW TO USE FOR DEVELOPMENT:
//   1. Edit the mock values below to simulate different properties.
//   2. Run `npm start` in the client/ directory — no backend needed.
//   3. The estimates UI, PDF export, and map will all work using
//      whatever values you set here.
//
// HOW TO WIRE UP REAL DATA (when ready):
//   Replace the return statement below with an actual HTTP call,
//   for example:
//
//     const response = await fetch(
//       `${process.env.REACT_APP_API_URL}/estimates/${street}/${city}/${state}/${zip}`
//     );
//     return response.json();
//
//   Or call your chosen BaaS (Supabase Edge Function, Firebase
//   Cloud Function, etc.) from here. This is the ONLY file that
//   needs to change to connect the frontend to real estimate data.
//
// SHAPE NOTE:
//   The returned object must match the shape below. App.js reads:
//     estimates.zillow.zestimate
//     estimates.realtyMole.price / listingUrl
//     estimates.melissa.Records[0].BuildingInfo.*
//     estimates.melissa.Records[0].CurrentDeed.SalePrice
// =============================================================

const PropertyService = {
  getEstimates: async (street, city, state, zip) => {
    // --- MOCK DATA --- edit these values to test different scenarios ---
    return {
      melissa: {
        Records: [{
          BuildingInfo: {
            YearBuilt: "2000",
            TotalBedrooms: "4",
            TotalBathrooms: "2.5",
            TotalSquareFeet: "2,500"
          },
          CurrentDeed: {
            SalePrice: "450000",
            SaleDate: "2022-01-15"
          }
        }]
      },
      zillow: {
        zestimate: 525000,
        rentZestimate: 2800,
        lastUpdated: new Date().toISOString(),
        homeDetails: 'https://www.zillow.com/homedetails/'
      },
      realtyMole: {
        price: 510000,
        listingUrl: 'https://www.realtymole.com/'
      }
    };
    // --- END MOCK DATA ---
  }
};

export default PropertyService;
