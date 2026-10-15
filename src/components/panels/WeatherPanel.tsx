import React from 'react';
import { Cloud, CloudRain, Sun, Wind, Gauge, Droplets, Thermometer, ShieldAlert, Sparkles } from 'lucide-react';
import { WeatherData } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

interface WeatherPanelProps {
  weather: WeatherData;
  onUpdateWeather: (updated: WeatherData) => void;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ weather, onUpdateWeather }) => {
  const setCondition = (cond: WeatherData['condition']) => {
    let temp = weather.temperature;
    let humidity = weather.humidity;
    let wind = weather.windSpeed;
    let aqi = weather.aqi;

    if (cond === 'Rain') {
      humidity = 88;
      temp = 14.2;
    } else if (cond === 'Snow') {
      temp = -2.5;
      humidity = 75;
    } else if (cond === 'Storm') {
      humidity = 95;
      wind = 54.0;
      aqi = 25;
    } else if (cond === 'Sunny') {
      temp = 24.5;
      humidity = 42;
      wind = 12.0;
    }

    const updated = {
      ...weather,
      condition: cond,
      temperature: temp,
      humidity,
      windSpeed: wind,
      aqi,
    };
    onUpdateWeather(updated);
    audioEngine.modulateFromTelemetry(25, wind);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-200 text-xs">
      {/* 1. Primary Reading & Condition */}
      <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-cyan-400 uppercase tracking-wide">Atmospheric State</span>
            <span className="font-mono text-[11px]">{weather.city}</span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{weather.temperature.toFixed(1)}°C</span>
            <span className="text-slate-400 font-mono text-sm">
              ({((weather.temperature * 9) / 5 + 32).toFixed(1)}°F)
            </span>
          </div>
          <div className="text-cyan-400 font-medium mt-0.5">{weather.condition}</div>
        </div>

        {/* Condition Preset Buttons */}
        <div className="mt-3 grid grid-cols-3 gap-1">
          {(['Sunny', 'Partly Cloudy', 'Rain', 'Snow', 'Storm', 'Fog'] as WeatherData['condition'][]).map((cond) => (
            <button
              key={cond}
              onClick={() => setCondition(cond)}
              className={`py-1 px-1.5 rounded text-[10px] font-medium transition-colors border ${
                weather.condition === cond
                  ? 'bg-cyan-600 border-cyan-400 text-white'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Wind & Pressure */}
      <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          Wind Vector & Pressure
        </span>

        <div className="space-y-2 my-2 font-mono text-[11px]">
          <div className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded border border-slate-700">
            <span className="text-slate-400">Speed:</span>
            <span className="text-white font-semibold">{weather.windSpeed.toFixed(1)} km/h</span>
          </div>

          <div className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded border border-slate-700">
            <span className="text-slate-400">Direction:</span>
            <span className="text-cyan-400 font-semibold">{weather.windDirection} (285°)</span>
          </div>

          <div className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded border border-slate-700">
            <span className="text-slate-400">Barometer:</span>
            <span className="text-white">{weather.pressure.toFixed(1)} hPa</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          Modulating 3D wind particle drift and spatial acoustic turbulence.
        </div>
      </div>

      {/* 3. Moisture & Air Quality */}
      <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          Moisture & Biosphere
        </span>

        <div className="space-y-2 my-2 font-mono text-[11px]">
          <div className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded border border-slate-700">
            <span className="text-slate-400">Relative Humidity:</span>
            <span className="text-white font-semibold">{weather.humidity}%</span>
          </div>

          <div className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded border border-slate-700">
            <span className="text-slate-400">Precipitation Chance:</span>
            <span className="text-cyan-400 font-semibold">{weather.precipitationProbability}%</span>
          </div>

          <div className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded border border-slate-700">
            <span className="text-slate-400">Air Quality Index (AQI):</span>
            <span className={`font-semibold ${weather.aqi < 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {weather.aqi} {weather.aqi < 50 ? '(Good)' : '(Moderate)'}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">Grounding sensors verify particulate concentration.</div>
      </div>

      {/* 4. Solar UV & Atmospheric Radar */}
      <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          Solar Radiation & UV
        </span>

        <div className="my-2 p-2 bg-slate-900/80 rounded border border-slate-700 text-center">
          <div className="text-2xl font-extrabold text-amber-400 font-mono">UV {weather.uvIndex}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Moderate Exposure Threshold</div>
        </div>

        <div className="p-2 bg-slate-900/80 rounded border border-slate-700 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Atmospheric Density:</span>
          <span className="text-white font-mono">1.225 kg/m³</span>
        </div>

        <div className="text-[10px] text-cyan-400 mt-1">
          Dynamic cloud attenuation and real-time solar declination active.
        </div>
      </div>
    </div>
  );
};
