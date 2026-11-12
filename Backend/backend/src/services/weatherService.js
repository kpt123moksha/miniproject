async function getWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,precipitation,rain,weather_code&hourly=precipitation&forecast_days=1&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
  const data = await response.json();

  return {
    temperature: data.current?.temperature_2m ?? null,
    precipitation: data.current?.precipitation ?? null,
    rain: data.current?.rain ?? null,
    weatherCode: data.current?.weather_code ?? null,
    hourly: (data.hourly?.time || []).slice(0, 12).map((time, index) => ({
      time,
      precipitation: data.hourly.precipitation[index]
    }))
  };
}

async function getElevation(latitude, longitude) {
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Elevation service is temporarily unavailable.");
  const data = await response.json();
  const elevation = data.results?.[0]?.elevation;
  return Number.isFinite(elevation) ? elevation : null;
}

module.exports = { getWeather, getElevation };
