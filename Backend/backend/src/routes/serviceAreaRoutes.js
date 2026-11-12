const router = require("express").Router();
const { SERVICE_CITIES, getServiceAreas, identifyCity } = require("../services/serviceAreaService");
let nextGeocoderRequestAt = 0;

router.get("/identify", (req, res) => {
  const { latitude, longitude } = req.query;
  if (latitude === undefined || longitude === undefined ||
      String(latitude).trim() === "" || String(longitude).trim() === "") {
    return res.status(400).json({ message: "Latitude and longitude are required." });
  }
  try {
    const city = identifyCity(latitude, longitude);
    return res.json({ city });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

router.get("/search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const city = typeof req.query.city === "string"
    ? SERVICE_CITIES.find((value) => value.toLowerCase() === req.query.city.trim().toLowerCase())
    : null;
  if (query.length < 3 || query.length > 160) {
    return res.status(400).json({ message: "Enter a location search between 3 and 160 characters." });
  }
  if (!city) return res.status(400).json({ message: "Choose Mangaluru, Bantwal or Udupi before searching." });

  try {
    getServiceAreas();
    const now = Date.now();
    if (now < nextGeocoderRequestAt) {
      res.set("Retry-After", String(Math.ceil((nextGeocoderRequestAt - now) / 1000)));
      return res.status(429).json({ message: "Please wait a moment before searching again." });
    }
    nextGeocoderRequestAt = now + 1000;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({
      q: `${query}, ${city}, Karnataka, India`,
      format: "jsonv2",
      countrycodes: "in",
      limit: "8"
    });
    const response = await fetch(url, {
      headers: { "User-Agent": process.env.GEOCODER_USER_AGENT || "DrainWatch/1.0" },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(502).json({ message: "Location search is temporarily unavailable." });

    const results = await response.json();
    const matches = results.flatMap((item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || identifyCity(latitude, longitude) !== city) return [];
      return [{ display_name: item.display_name, latitude, longitude, city }];
    });
    return res.json({ results: matches });
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

router.get("/", (req, res) => {
  try {
    return res.json(getServiceAreas());
  } catch (error) {
    return res.status(503).json({ message: error.message });
  }
});

module.exports = router;