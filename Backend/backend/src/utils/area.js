const { identifyCity } = require("../services/serviceAreaService");

function isInsideConfiguredArea(latitude, longitude) {
  return identifyCity(latitude, longitude) !== null;
}

module.exports = { isInsideConfiguredArea, identifyCity };
