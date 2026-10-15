import React, { useState } from 'react';
import { MapPin, Plus, Navigation, Crosshair, Check, Globe } from 'lucide-react';
import { MarkerItem } from '../../types';
import { encodePlusCode, decodePlusCode, isValidPlusCode } from '../../utils/plusCodes';

interface NavigationPanelProps {
  markers: MarkerItem[];
  activeMarker: MarkerItem | null;
  onSelectMarker: (marker: MarkerItem) => void;
  onAddMarker: (marker: MarkerItem) => void;
  currentLat: number;
  currentLng: number;
  currentAltitude: number;
  plusCode: string;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  markers,
  activeMarker,
  onSelectMarker,
  onAddMarker,
  currentLat,
  currentLng,
  currentAltitude,
  plusCode,
}) => {
  const [newMarkerName, setNewMarkerName] = useState('');
  const [newMarkerCategory, setNewMarkerCategory] = useState<MarkerItem['category']>('custom');
  const [customColor, setCustomColor] = useState('#38bdf8');
  const [testPlusCode, setTestPlusCode] = useState('849VCWC8+R9');
  const [decodeResult, setDecodeResult] = useState<string | null>(null);

  const handleCreateMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarkerName.trim()) return;

    const newMarker: MarkerItem = {
      id: 'custom-' + Date.now(),
      name: newMarkerName.trim(),
      category: newMarkerCategory,
      lat: currentLat,
      lng: currentLng,
      altitude: currentAltitude,
      plusCode: plusCode,
      color: customColor,
      details: 'User pinned location via TerraSphere Geonav.',
    };

    onAddMarker(newMarker);
    setNewMarkerName('');
  };

  const handleTestDecode = () => {
    if (isValidPlusCode(testPlusCode)) {
      const res = decodePlusCode(testPlusCode);
      if (res) {
        setDecodeResult(`Lat: ${res.latitudeCenter.toFixed(5)}°, Lng: ${res.longitudeCenter.toFixed(5)}°`);
      } else {
        setDecodeResult('Invalid code structure');
      }
    } else {
      setDecodeResult('Code does not match Open Location Code format');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-200 text-xs">
      {/* 1. Global Pin Registry */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-700/60 pb-1">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <MapPin className="w-3.5 h-3.5" />
            Active Map Markers ({markers.length})
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {markers.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMarker(m)}
              className={`p-2 rounded-lg cursor-pointer transition-colors border ${
                activeMarker?.id === m.id
                  ? 'bg-cyan-950/70 border-cyan-500 text-white'
                  : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color || '#38bdf8' }} />
                  <span className="font-medium">{m.name}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-cyan-400">
                  {m.category}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{m.plusCode}</span>
                <span>{m.altitude}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Pin Current Coordinate */}
      <div className="flex flex-col gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
        <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          Pin Current Location
        </span>

        <div className="p-2 bg-slate-900/80 rounded border border-slate-700 font-mono text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Latitude:</span>
            <span className="text-white">{currentLat.toFixed(5)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Longitude:</span>
            <span className="text-white">{currentLng.toFixed(5)}°</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Plus Code:</span>
            <span className="text-cyan-400 font-semibold">{plusCode}</span>
          </div>
        </div>

        <form onSubmit={handleCreateMarker} className="space-y-2 mt-1">
          <input
            type="text"
            value={newMarkerName}
            onChange={(e) => setNewMarkerName(e.target.value)}
            placeholder="Marker name (e.g. Field Station Alpha)..."
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex items-center gap-2">
            <select
              value={newMarkerCategory}
              onChange={(e) => setNewMarkerCategory(e.target.value as MarkerItem['category'])}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none flex-1"
            >
              <option value="custom">Custom Point</option>
              <option value="friend">Rendezvous</option>
              <option value="emergency">Emergency Site</option>
              <option value="trailcam">Trail Sensor</option>
              <option value="network">Mesh Node</option>
            </select>

            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-7 bg-transparent cursor-pointer rounded"
              title="Pin Marker Color"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Marker to Global Grid
          </button>
        </form>
      </div>

      {/* 3. Google Plus Code Laboratory */}
      <div className="flex flex-col gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
        <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          Open Location Code (Plus Code) Engine
        </span>
        <p className="text-[11px] text-slate-300">
          Decodes standard RFC Open Location Codes without requiring third-party external APIs, functioning completely offline.
        </p>

        <div className="space-y-2 mt-1">
          <input
            type="text"
            value={testPlusCode}
            onChange={(e) => setTestPlusCode(e.target.value)}
            placeholder="Enter Plus Code (e.g. 849VCWC8+R9)..."
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-cyan-400 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={handleTestDecode}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-1.5 rounded transition-colors"
          >
            Decode to Latitude / Longitude
          </button>

          {decodeResult && (
            <div className="p-2 bg-slate-900/90 rounded border border-cyan-500/40 font-mono text-[11px] text-cyan-300">
              {decodeResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
