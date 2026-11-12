// This is a transparent maintenance-priority score, not an AI model or flood prediction.
function calculateRisk({ severity, rainfallMm, elevationM, previousComplaints = 0 }) {
  let score = 0;

  const severityPoints = { Low: 10, Medium: 20, High: 30, Critical: 40 };
  score += severityPoints[severity] || 10;

  const rain = Number(rainfallMm || 0);
  if (rain >= 50) score += 30;
  else if (rain >= 25) score += 20;
  else if (rain >= 10) score += 10;

  // Elevation is only contextual. Absolute elevation alone cannot prove waterlogging.
  if (elevationM !== null && elevationM !== undefined && Number.isFinite(Number(elevationM))) {
    if (Number(elevationM) < 10) score += 15;
    else if (Number(elevationM) < 25) score += 8;
  }

  score += Math.min(Number(previousComplaints) * 3, 15);
  score = Math.max(0, Math.min(100, score));

  let level = "Low";
  if (score >= 80) level = "Critical";
  else if (score >= 60) level = "High";
  else if (score >= 30) level = "Medium";

  return { score, level };
}

module.exports = { calculateRisk };
