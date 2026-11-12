const { identifyImageSeverity } = require("../services/imageSeverityService");

async function analyzeImage(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ message: "Please attach a JPG, PNG or WEBP image." });
  }

  try {
    const severity = await identifyImageSeverity(req.file);
    res.json({ severity });
  } catch (error) {
    next(error);
  }
}

module.exports = { analyzeImage };
