'use client';

import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, Thermometer } from 'lucide-react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
}

const DAKAR_LAT = 14.6928;
const DAKAR_LON = -17.4467;
const CACHE_KEY = 'senagros_weather';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getWeatherLabel(code: number): { label: string; Icon: typeof Sun } {
  if (code === 0) return { label: 'Ensoleillé', Icon: Sun };
  if (code <= 3) return { label: 'Partiellement nuageux', Icon: Cloud };
  if (code <= 48) return { label: 'Brouillard', Icon: Cloud };
  if (code <= 57) return { label: 'Bruine', Icon: CloudDrizzle };
  if (code <= 67) return { label: 'Pluie', Icon: CloudRain };
  if (code <= 77) return { label: 'Neige', Icon: CloudSnow };
  if (code <= 82) return { label: 'Averses', Icon: CloudRain };
  return { label: 'Orage', Icon: CloudRain };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      // Check cache
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { data: WeatherData; ts: number };
          if (Date.now() - parsed.ts < CACHE_TTL) {
            setWeather(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore cache errors
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${DAKAR_LAT}&longitude=${DAKAR_LON}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=Africa/Dakar`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API error');
        const json = await res.json();
        const data: WeatherData = {
          temperature: json.current.temperature_2m,
          weatherCode: json.current.weather_code,
          windSpeed: json.current.wind_speed_10m,
          humidity: json.current.relative_humidity_2m,
        };
        setWeather(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch {
        // Use cached data even if expired
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as { data: WeatherData };
            setWeather(parsed.data);
          }
        } catch {
          // no weather available
        }
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">Météo</h3>
        <p className="mt-2 text-sm text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">Météo</h3>
        <p className="mt-2 text-sm text-gray-400">Indisponible</p>
      </div>
    );
  }

  const { label, Icon } = getWeatherLabel(weather.weatherCode);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Météo</h3>
        <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">Dakar</span>
      </div>
      <div className="flex items-center gap-4">
        <Icon className="h-10 w-10 text-orange-400" />
        <div>
          <p className="text-3xl font-bold text-gray-800">{Math.round(weather.temperature)}°C</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-gray-400">
        <span>Vent: {weather.windSpeed} km/h</span>
        <span>Humidité: {weather.humidity}%</span>
      </div>
    </div>
  );
}
