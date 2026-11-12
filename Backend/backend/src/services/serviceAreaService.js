
const fs = require("fs");
const path = require("path");

// Mangaluru, Bantwal and Udupi use their respective taluk boundaries as service areas.
const SERVICE_CITIES = ["Mangaluru", "Bantwal", "Udupi"];
const REQUIRED_SERVICE_CITIES = ["Mangaluru", "Bantwal", "Udupi"];

const COORDINATE_EPSILON = 1e-10;
const BACKEND_ROOT = path.resolve(__dirname, "../..");

function canonicalCity(value) {
  if (typeof value !== "string") return null;

  return SERVICE_CITIES.find(
    (city) => city.toLowerCase() === value.trim().toLowerCase()
  ) || null;
}

function validPosition(position) {
  return (
    Array.isArray(position) &&
    position.length >= 2 &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1]) &&
    position[0] >= -180 &&
    position[0] <= 180 &&
    position[1] >= -90 &&
    position[1] <= 90
  );
}

function validRing(ring) {
  return (
    Array.isArray(ring) &&
    ring.length >= 4 &&
    ring.every(validPosition)
  );
}

function validPolygon(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every(validRing)
  );
}

function validGeometry(geometry) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return validPolygon(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every(validPolygon)
    );
  }

  return false;
}

function isConfiguredTalukBoundary(feature, city) {
  const properties = feature?.properties || {};
  const expectedBoundaries = {
    Mangaluru: { name: "Mangaluru taluk", subdistrict: "5561" },
    Bantwal: { name: "Bantwal taluk", subdistrict: "5562" },
    Udupi: { name: "Udupi taluku", subdistrict: "5523" }
  };
  const expected = expectedBoundaries[city];
  return Boolean(
    expected &&
    properties.name === expected.name &&
    String(properties.admin_level) === "6" &&
    String(properties["ref:LGD:subdistrict"]) === expected.subdistrict
  );
}

function getInvalidBoundaryReason(feature) {
  const city = canonicalCity(feature?.properties?.city);
  if (city && isConfiguredTalukBoundary(feature, city)) return null;
  const properties = feature?.properties || {};
  const administrativeName = [
    properties.name,
    properties.official_name,
    properties.boundary,
    properties.type
  ].filter((value) => typeof value === "string").join(" ").toLowerCase();

  if (/\b(taluk|taluka|tehsil|district|subdistrict)\b/.test(administrativeName)) {
    return `The configured boundary "${properties.name || administrativeName}" is not a supported service-area boundary.`;
  }
  if (String(properties.admin_level) === "6") {
    return "The configured boundary has OSM admin_level=6, but it is not a supported service-area boundary.";
  }
  return null;
}

function pointOnSegment(x, y, start, end) {
  const cross =
    (y - start[1]) * (end[0] - start[0]) -
    (x - start[0]) * (end[1] - start[1]);

  if (Math.abs(cross) > COORDINATE_EPSILON) return false;

  return (
    x >= Math.min(start[0], end[0]) - COORDINATE_EPSILON &&
    x <= Math.max(start[0], end[0]) + COORDINATE_EPSILON &&
    y >= Math.min(start[1], end[1]) - COORDINATE_EPSILON &&
    y <= Math.max(start[1], end[1]) + COORDINATE_EPSILON
  );
}

function pointInRing(longitude, latitude, ring) {
  let inside = false;

  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index++
  ) {
    const [currentLongitude, currentLatitude] = ring[index];
    const [previousLongitude, previousLatitude] = ring[previous];

    if (
      pointOnSegment(
        longitude,
        latitude,
        ring[previous],
        ring[index]
      )
    ) {
      return true;
    }

    const crossesLatitude =
      (currentLatitude > latitude) !==
      (previousLatitude > latitude);

    if (crossesLatitude) {
      const crossingLongitude =
        ((previousLongitude - currentLongitude) *
          (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
        currentLongitude;

      if (longitude < crossingLongitude) {
        inside = !inside;
      }
    }
  }

  return inside;
}

function pointInPolygon(longitude, latitude, rings) {
  if (!pointInRing(longitude, latitude, rings[0])) {
    return false;
  }

  return !rings
    .slice(1)
    .some((hole) => pointInRing(longitude, latitude, hole));
}

function pointInGeometry(longitude, latitude, geometry) {
  if (geometry.type === "Polygon") {
    return pointInPolygon(
      longitude,
      latitude,
      geometry.coordinates
    );
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) =>
      pointInPolygon(longitude, latitude, polygon)
    );
  }

  return false;
}

function getServiceAreas() {
  const configuredPath = process.env.SERVICE_AREAS_GEOJSON;

  if (!configuredPath) {
    throw new Error(
      "Service areas are not configured. Set SERVICE_AREAS_GEOJSON."
    );
  }

  const filePath = path.resolve(BACKEND_ROOT, configuredPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Service-area GeoJSON was not found at ${filePath}.`
    );
  }

  let data;

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    data = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Service-area GeoJSON is not valid JSON.");
  }

  if (
    data.type !== "FeatureCollection" ||
    !Array.isArray(data.features)
  ) {
    throw new Error(
      "Service-area data must be a GeoJSON FeatureCollection."
    );
  }

  const features = data.features.filter(
    (feature) => SERVICE_CITIES.includes(canonicalCity(feature?.properties?.city))
  );

  const nonMunicipalReason = features
    .map(getInvalidBoundaryReason)
    .find(Boolean);
  if (nonMunicipalReason) {
    throw new Error(
      `${nonMunicipalReason} Replace it with a supported verified service-area boundary.`
    );
  }

  for (const city of REQUIRED_SERVICE_CITIES) {
    if (
      !features.some(
        (feature) =>
          canonicalCity(feature.properties.city) === city
      )
    ) {
      throw new Error(
        `Service-area GeoJSON must include a feature with properties.city set to ${city}.`
      );
    }
  }

  for (const feature of features) {
    if (!validGeometry(feature.geometry)) {
      throw new Error(
        `${feature.properties.city} service-area feature must have valid Polygon or MultiPolygon coordinates.`
      );
    }
  }

  return {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        city: canonicalCity(feature.properties.city)
      }
    }))
  };
}

function identifyCity(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  const serviceAreas = getServiceAreas();

  const match = serviceAreas.features.find((feature) =>
    pointInGeometry(lon, lat, feature.geometry)
  );

  return match?.properties.city || null;
}

module.exports = {
  SERVICE_CITIES,
  getServiceAreas,
  identifyCity,
  pointInGeometry
};
