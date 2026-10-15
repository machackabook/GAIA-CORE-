import React, { useState } from 'react';
import { Globe, Navigation, Building2, Compass, Copy, Check, Search, AlertTriangle, Volume2, Camera, Mountain } from 'lucide-react';
import { ViewMode } from '../types';
import { isValidPlusCode, decodePlusCode } from '../utils/plusCodes';

interface TopHudProps {
  currentLat: number;
  currentLng: number;
  currentAltitude: number;
  plusCode: string;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onSearchQuery: (query: string) => void;
  sosActive: boolean;
  onToggleSos: () => void;
  arModeActive: boolean;
  onToggleArMode: () => void;
  elevationProfileActive?: boolean;
  onOpenElevationProfile?: () => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  currentLat,
  currentLng,
  currentAltitude,
  plusCode,
  viewMode,
  onChangeViewMode,
  onSearchQuery,
  sosActive,
  onToggleSos,
  arModeActive,
  onToggleArMode,
  elevationProfileActive,
  onOpenElevationProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleCopyPlusCode = () => {
    navigator.clipboard.writeText(plusCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchQuery(searchInput.trim());
      setSearchInput('');
    }
  };

  return (
    <header className="absolute top-3 left-3 right-3 pointer-events-none z-20 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      {/* Brand & Telemetry Badge */}
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-slate-200 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="font-semibold tracking-wider text-white uppercase text-[11px]">TERRASPHERE 3D</span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Real-time Latitude & Longitude & Altitude */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
          <span>{currentLat >= 0 ? `${currentLat.toFixed(4)}°N` : `${Math.abs(currentLat).toFixed(4)}°S`}</span>
          <span>{currentLng >= 0 ? `${currentLng.toFixed(4)}°E` : `${Math.abs(currentLng).toFixed(4)}°W`}</span>
          <span className="text-cyan-400 font-medium">ALT: {currentAltitude}m</span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Plus Code Badge with Copy */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded border border-cyan-500/30 font-mono text-[11px]">
          <span className="text-cyan-400 font-semibold">{plusCode}</span>
          <button
            onClick={handleCopyPlusCode}
            title="Copy Google Plus Code"
            className="text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Global Search Bar (Plus Code, Coordinates, City) */}
      <form
        onSubmit={handleSearchSubmit}
        className="pointer-events-auto flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-xl w-full max-w-xs"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search Plus Code, city, or coordinates..."
          className="bg-transparent text-white placeholder-slate-400 text-xs focus:outline-none w-full font-mono"
        />
        <button
          type="submit"
          className="ml-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
        >
          FLY
        </button>
      </form>

      {/* View Mode Switcher & Emergency SOS */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl shadow-xl">
        <button
          onClick={() => onChangeViewMode('globe')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'globe' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Globe 3D</span>
        </button>

        <button
          onClick={() => onChangeViewMode('street')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'street' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Street View</span>
        </button>

        <button
          onClick={() => onChangeViewMode('indoor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'indoor' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Apple IMDF</span>
        </button>

        <button
          onClick={() => onChangeViewMode('orbit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'orbit' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Orbit</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* SOS Emergency Toggle Button */}
        <button
          onClick={onToggleSos}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            sosActive
              ? 'bg-red-600 text-white ring-2 ring-red-400/50'
              : 'bg-red-950/70 text-red-300 hover:bg-red-900 border border-red-700/50'
          }`}
          title="Emergency Response Dispatch & SOS Beacon"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{sosActive ? 'SOS ACTIVE' : 'SOS'}</span>
        </button>

        {/* AR Camera Overlay Toggle */}
        <button
          onClick={onToggleArMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            arModeActive
              ? 'bg-cyan-600 text-white ring-2 ring-cyan-400/50 animate-pulse'
              : 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-cyan-700/50'
          }`}
          title="Toggle AR Camera Overlay Mode with Live Telemetry"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{arModeActive ? 'AR CAM: ON' : 'AR CAM'}</span>
        </button>

        {/* Elevation Cross-Section Profile Tool */}
        {onOpenElevationProfile && (
          <button
            onClick={onOpenElevationProfile}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              elevationProfileActive
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-md'
                : 'bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60'
            }`}
            title="Calculate and display cross-section elevation profile between two coordinates on the globe"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Elevation Profile</span>
          </button>
        )}
      </div>
    </header>
  );
};
