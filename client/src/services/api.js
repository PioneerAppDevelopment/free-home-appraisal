const API_BASE_URL = process.env.REACT_APP_API_URL || "";

function mockEstimateResponse() {
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
}

const PropertyService = {
  getEstimates: async (street, city, state, zip) => {
    if (process.env.REACT_APP_USE_MOCKS === "true") {
      return mockEstimateResponse();
    }

    const params = new URLSearchParams({ street, city, state, zip });
    const response = await fetch(`${API_BASE_URL}/api/estimate?${params}`);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Estimate request failed with ${response.status}`);
    }

    return response.json();
  }
};

export default PropertyService;
