const express = require("express");
const path = require("path");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;
const providerTimeoutMs = 9000;
const realtyApiKey = process.env.REALTYAPI_KEY;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function fullAddress(query) {
  return [query.street, query.city, query.state, query.zip]
    .filter(Boolean)
    .join(", ");
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed !== null && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function firstString(...values) {
  return values.find(value => typeof value === "string" && value.trim()) || "";
}

function getPath(obj, targetPath) {
  return targetPath.split(".").reduce((cursor, key) => {
    if (cursor === null || cursor === undefined) {
      return undefined;
    }
    return cursor[key];
  }, obj);
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "x-realtyapi-key": realtyApiKey
      }
    });

    const bodyText = await response.text();
    const body = bodyText ? JSON.parse(bodyText) : {};

    if (!response.ok) {
      const message = body && (body.message || body.error) ? body.message || body.error : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

function providerError(error) {
  return {
    ok: false,
    error: error.name === "AbortError" ? "Provider timed out" : error.message
  };
}

async function callRealtyProvider(name, fn) {
  if (!realtyApiKey) {
    return { ok: false, skipped: true, error: "Missing REALTYAPI_KEY" };
  }

  try {
    return { ok: true, ...(await fn()) };
  } catch (error) {
    console.warn(`${name} provider failed:`, error.message);
    return providerError(error);
  }
}

function pickValue(raw, candidates) {
  for (const pathCandidate of candidates) {
    const value = firstNumber(getPath(raw, pathCandidate));
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function pickString(raw, candidates) {
  for (const pathCandidate of candidates) {
    const value = getPath(raw, pathCandidate);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function buildProperty(raw, mapping = {}) {
  return {
    bedrooms: pickValue(raw, mapping.bedrooms || ["bedrooms", "beds", "propertyDetails.bedrooms", "property.bedrooms", "data.bedrooms"]),
    bathrooms: pickValue(raw, mapping.bathrooms || ["bathrooms", "baths", "propertyDetails.bathrooms", "property.bathrooms", "data.bathrooms"]),
    sqft: pickValue(raw, mapping.sqft || ["livingArea", "sqft", "squareFeet", "propertyDetails.livingArea", "property.sqft", "data.sqft"]),
    lotSize: pickValue(raw, mapping.lotSize || ["lotSize", "lotSizeSqFt", "lotAreaValue", "propertyDetails.lotSize", "property.lotSize", "data.lotSize"]),
    yearBuilt: pickValue(raw, mapping.yearBuilt || ["yearBuilt", "propertyDetails.yearBuilt", "property.yearBuilt", "data.yearBuilt"]),
    homeType: pickString(raw, mapping.homeType || ["homeType", "propertyType", "propertyDetails.homeType", "property.homeType", "data.propertyType"]),
    status: pickString(raw, mapping.status || ["homeStatus", "status", "propertyDetails.homeStatus", "property.status", "data.status"]),
    soldPrice: pickValue(raw, mapping.soldPrice || ["lastSoldPrice", "lastSalePrice", "propertyDetails.lastSoldPrice", "property.lastSalePrice", "data.lastSalePrice"]),
    soldDate: pickString(raw, mapping.soldDate || ["lastSoldDate", "lastSaleDate", "propertyDetails.lastSoldDate", "property.lastSaleDate", "data.lastSaleDate"]),
    lat: pickValue(raw, mapping.lat || ["latitude", "lat", "propertyDetails.latitude", "address.latitude", "property.latitude", "data.latitude"]),
    long: pickValue(raw, mapping.long || ["longitude", "lng", "long", "propertyDetails.longitude", "address.longitude", "property.longitude", "data.longitude"])
  };
}

async function getZillow(query) {
  return callRealtyProvider("zillow", async () => {
    const params = new URLSearchParams({ propertyaddress: fullAddress(query) });
    const raw = await fetchJson(`https://zillow.realtyapi.io/pro/byaddress?${params}`);

    return {
      value: pickValue(raw, ["propertyDetails.zestimate", "propertyDetails.price", "propertyDetails.taxAssessedValue", "propertyDetails.resoFacts.taxAssessedValue", "zestimate", "price"]),
      rentEstimate: pickValue(raw, ["propertyDetails.rentZestimate", "propertyDetails.rentalZestimate", "rentZestimate", "rentalZestimate"]),
      link: pickString(raw, ["propertyDetails.hdpUrl", "propertyDetails.url", "zillowURL", "homeDetails"]),
      property: buildProperty(raw),
      meta: {
        zpid: raw.propertyDetails && raw.propertyDetails.zpid ? raw.propertyDetails.zpid : raw.zpid || null,
        source: "RealtyAPI Zillow"
      }
    };
  });
}

async function getRedfin(query) {
  return callRealtyProvider("redfin", async () => {
    const params = new URLSearchParams({ property_address: fullAddress(query) });
    const raw = await fetchJson(`https://redfin.realtyapi.io/detailsbyaddress?${params}`);

    return {
      value: pickValue(raw, [
        "details.avm.predictedValue",
        "details.avm.amount",
        "details.avm.value",
        "details.avm.estimate",
        "details.aboveTheFold.priceInfo.amount",
        "details.aboveTheFold.priceInfo.price",
        "avm.value",
        "avm.estimate",
        "redfinEstimate",
        "property.redfinEstimate",
        "property.price",
        "price",
        "data.price"
      ]),
      link: pickString(raw, ["details.aboveTheFold.url", "url", "property.url", "data.url"]),
      property: buildProperty(raw, {
        bedrooms: ["details.aboveTheFold.beds", "details.aboveTheFold.numBeds", "details.mainHouseInfoPanelInfo.beds"],
        bathrooms: ["details.aboveTheFold.baths", "details.aboveTheFold.numBaths", "details.mainHouseInfoPanelInfo.baths"],
        sqft: ["details.aboveTheFold.sqFt.value", "details.aboveTheFold.sqft", "details.mainHouseInfoPanelInfo.sqft"],
        lotSize: ["details.aboveTheFold.lotSize.value", "details.aboveTheFold.lotSize"],
        yearBuilt: ["details.aboveTheFold.yearBuilt", "details.mainHouseInfoPanelInfo.yearBuilt"],
        homeType: ["details.aboveTheFold.propertyType", "details.mainHouseInfoPanelInfo.propertyType"],
        status: ["details.aboveTheFold.status", "status"],
        lat: ["details.aboveTheFold.latLong.latitude", "details.aboveTheFold.latitude"],
        long: ["details.aboveTheFold.latLong.longitude", "details.aboveTheFold.longitude"]
      }),
      meta: {
        source: "RealtyAPI Redfin"
      }
    };
  });
}

async function getRealtor(query) {
  return callRealtyProvider("realtor", async () => {
    const params = new URLSearchParams({ address: fullAddress(query) });
    const raw = await fetchJson(`https://realtor.realtyapi.io/details/byaddress?${params}`);

    return {
      value: pickValue(raw, [
        "detail.estimate.currentValue",
        "detail.home.estimate",
        "detail.list_price",
        "detail.price",
        "data.estimate.currentValue",
        "data.home.estimate",
        "data.list_price",
        "data.price",
        "property.price",
        "list_price",
        "price"
      ]),
      link: pickString(raw, ["detail.href", "detail.permalink", "data.href", "data.permalink", "href", "permalink", "url"]),
      property: buildProperty(raw, {
        bedrooms: ["detail.description.beds", "detail.details.beds", "data.description.beds", "description.beds", "beds"],
        bathrooms: ["detail.description.baths", "detail.details.baths", "data.description.baths", "description.baths", "baths"],
        sqft: ["detail.description.sqft", "detail.details.sqft", "data.description.sqft", "description.sqft", "sqft"],
        lotSize: ["detail.description.lot_sqft", "detail.details.lot_sqft", "data.description.lot_sqft", "description.lot_sqft", "lot_sqft"],
        yearBuilt: ["detail.description.year_built", "detail.details.year_built", "data.description.year_built", "description.year_built", "year_built"],
        homeType: ["detail.description.type", "detail.details.type", "data.description.type", "description.type", "type"],
        status: ["detail.status", "data.status", "status"],
        soldPrice: ["detail.last_sold_price", "data.last_sold_price", "last_sold_price"],
        soldDate: ["detail.last_sold_date", "data.last_sold_date", "last_sold_date"],
        lat: ["detail.location.address.coordinate.lat", "data.location.address.coordinate.lat", "location.address.coordinate.lat", "lat"],
        long: ["detail.location.address.coordinate.lon", "data.location.address.coordinate.lon", "location.address.coordinate.lon", "lon"]
      }),
      meta: {
        source: "RealtyAPI Realtor"
      }
    };
  });
}

async function getHomes(query) {
  return callRealtyProvider("homes", async () => {
    const params = new URLSearchParams({ address: fullAddress(query) });
    const raw = await fetchJson(`https://homes.realtyapi.io/details/byaddress?${params}`);

    return {
      value: pickValue(raw, [
        "detail.estimate.currentValue",
        "detail.home.estimate",
        "detail.list_price",
        "detail.price",
        "data.estimate.currentValue",
        "data.home.estimate",
        "data.list_price",
        "data.price",
        "property.price",
        "list_price",
        "price"
      ]),
      link: pickString(raw, ["detail.href", "detail.permalink", "data.href", "data.permalink", "href", "permalink", "url"]),
      property: buildProperty(raw, {
        bedrooms: ["detail.description.beds", "detail.details.beds", "data.description.beds", "description.beds", "beds"],
        bathrooms: ["detail.description.baths", "detail.details.baths", "data.description.baths", "description.baths", "baths"],
        sqft: ["detail.description.sqft", "detail.details.sqft", "data.description.sqft", "description.sqft", "sqft"],
        lotSize: ["detail.description.lot_sqft", "detail.details.lot_sqft", "data.description.lot_sqft", "description.lot_sqft", "lot_sqft"],
        yearBuilt: ["detail.description.year_built", "detail.details.year_built", "data.description.year_built", "description.year_built", "year_built"],
        homeType: ["detail.description.type", "detail.details.type", "data.description.type", "description.type", "type"],
        status: ["detail.status", "data.status", "status"],
        soldPrice: ["detail.last_sold_price", "data.last_sold_price", "last_sold_price"],
        soldDate: ["detail.last_sold_date", "data.last_sold_date", "last_sold_date"],
        lat: ["detail.location.address.coordinate.lat", "data.location.address.coordinate.lat", "location.address.coordinate.lat", "lat"],
        long: ["detail.location.address.coordinate.lon", "data.location.address.coordinate.lon", "location.address.coordinate.lon", "lon"]
      }),
      meta: {
        source: "RealtyAPI Homes.com"
      }
    };
  });
}

function buildHomeFacts(query, providers) {
  const providerProperties = [
    providers.zillow && providers.zillow.property,
    providers.redfin && providers.redfin.property,
    providers.realtor && providers.realtor.property,
    providers.homes && providers.homes.property
  ].filter(Boolean);

  const pick = key => {
    for (const property of providerProperties) {
      if (property[key]) {
        return property[key];
      }
    }
    return null;
  };

  return {
    street_address: query.street,
    city: query.city,
    state: query.state,
    zip_code: query.zip,
    home_type: pick("homeType"),
    bedrooms: pick("bedrooms"),
    bathrooms: pick("bathrooms"),
    sqft: pick("sqft"),
    lot_size: pick("lotSize"),
    year_built: pick("yearBuilt"),
    sold_price: pick("soldPrice"),
    sold_date: pick("soldDate"),
    lat: pick("lat"),
    long: pick("long")
  };
}

function blendedEstimate(providers) {
  const values = [
    providers.zillow && providers.zillow.value,
    providers.redfin && providers.redfin.value,
    providers.realtor && providers.realtor.value,
    providers.homes && providers.homes.value
  ].filter(value => Number.isFinite(value) && value > 0);

  if (!values.length) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

app.get("/api/estimate", async (req, res) => {
  const query = {
    street: firstString(req.query.street),
    city: firstString(req.query.city),
    state: firstString(req.query.state).toUpperCase(),
    zip: firstString(req.query.zip)
  };

  if (!query.street || !query.city || !query.state || !query.zip) {
    res.status(400).json({ error: "street, city, state, and zip are required" });
    return;
  }

  const [zillow, redfin, realtor, homes] = await Promise.all([
    getZillow(query),
    getRedfin(query),
    getRealtor(query),
    getHomes(query)
  ]);

  const providers = { zillow, redfin, realtor, homes };

  res.status(200).json({
    address: query,
    home: buildHomeFacts(query, providers),
    blendedEstimate: blendedEstimate(providers),
    providers,
    zillow: {
      zestimate: zillow.value || null,
      rentZestimate: zillow.rentEstimate || null,
      homeDetails: zillow.link || ""
    },
    realtyMole: {
      price: homes.value || null,
      listingUrl: homes.link || ""
    },
    melissa: {
      value: null,
      Records: []
    },
    redfin: {
      value: redfin.value || null,
      link: redfin.link || ""
    },
    realtor: {
      value: realtor.value || null,
      link: realtor.link || ""
    },
    homes: {
      value: homes.value || null,
      link: homes.link || ""
    },
    mashvisor: {
      value: null
    }
  });
});

const buildPath = path.join(__dirname, "client/build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Free Home Appraisal running on port ${port}`);
});
