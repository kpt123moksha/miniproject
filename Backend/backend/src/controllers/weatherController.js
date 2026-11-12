const { getWeather, getElevation } = require("../services/weatherService");

async function weather(req, res, next) {
  try {
    const latitude = Number(req.query.latitude ?? process.env.AREA_LATITUDE);
    const longitude = Number(req.query.longitude ?? process.env.AREA_LONGITUDE);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }
    const data = await getWeather(latitude, longitude);
    res.json({ area: process.env.AREA_NAME || "Configured area", ...data });
  } catch (error) { next(error); }
}

async function elevation(req, res, next) {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }
    const elevationM = await getElevation(latitude, longitude);
    res.json({ elevation_m: elevationM });
  } catch (error) { next(error); }
}

module.exports = { weather, elevation };
