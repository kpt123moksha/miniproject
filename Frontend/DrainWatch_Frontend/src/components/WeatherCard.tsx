import { CloudRain, ThermometerSun } from 'lucide-react';
import type { WeatherData } from '../types';

export default function WeatherCard({weather}:{weather?:WeatherData}) {
  if (!weather?.available) return <section className="panel weather-card">
    <div className="panel-heading"><CloudRain/><div><h3>Weather monitoring</h3><p>Current conditions and rainfall forecast</p></div></div>
    <p className="muted">Weather information is currently unavailable. Please try again later.</p>
  </section>;

  const maxRain = Math.max(0,...(weather.forecast||[]).map(item=>item.rainfallMm||0));
  return <section className="panel weather-card">
    <div className="panel-heading"><CloudRain/><div><h3>Weather monitoring</h3><p>Latest available local weather information</p></div></div>
    <div className="weather-values">
      <div><ThermometerSun/><b>{weather.current?.temperatureC ?? '—'}°C</b><small>Temperature</small></div>
      <div><CloudRain/><b>{weather.current?.rainfallMm ?? '—'} mm</b><small>Current rainfall</small></div>
      <div><CloudRain/><b>{maxRain} mm</b><small>Highest hourly forecast in displayed period</small></div>
    </div>
    <small className="muted">Forecast values are from the weather service, not a flood prediction.</small>
  </section>;
}
