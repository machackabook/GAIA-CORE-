/**
 * Elevation Profile & Topographic Cross-Section Tool
 * Interactive cross-section elevation graph between two coordinates on the globe,
 * displaying slope percentage, peak elevation, elevation gain/loss, and terrain ruggedness.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Mountain,
  TrendingUp,
  MapPin,
  Crosshair,
  Compass,
  ArrowUpDown,
  Download,
  Share2,
  Navigation,
  Clock,
  Layers,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Shield,
  Activity,
  Flame,
} from 'lucide-react';
import {
  calculateElevationCrossSection,
  ELEVATION_PRESETS,
  getSlopeClassification,
  ElevationTransectPreset,
} from '../../utils/elevationProfile';
import { ElevationProfileData, ElevationProfilePoint } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

interface ElevationProfilePanelProps {
  currentLat: number;
  currentLng: number;
  pointA: { lat: number; lng: number; label: string };
  pointB: { lat: number; lng: number; label: string };
  onChangePointA: (pt: { lat: number; lng: number; label: string }) => void;
  onChangePointB: (pt: { lat: number; lng: number; label: string }) => void;
  isPickingPoint: 'A' | 'B' | null;
  onSetPickingPoint: (target: 'A' | 'B' | null) => void;
  onFlyToCoordinate?: (lat: number, lng: number) => void;
}

export const ElevationProfilePanel: React.FC<ElevationProfilePanelProps> = ({
  currentLat,
  currentLng,
  pointA,
  pointB,
  onChangePointA,
  onChangePointB,
  isPickingPoint,
  onSetPickingPoint,
  onFlyToCoordinate,
}) => {
  const [activePresetId, setActivePresetId] = useState<string>('grand-canyon');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<'meters' | 'feet'>('meters');

  // Calculate elevation cross section
  const profileData: ElevationProfileData = useMemo(() => {
    return calculateElevationCrossSection(
      pointA.lat,
      pointA.lng,
      pointA.label,
      pointB.lat,
      pointB.lng,
      pointB.label,
      80
    );
  }, [pointA, pointB]);

  // Handle Preset selection
  const handleSelectPreset = (preset: ElevationTransectPreset) => {
    setActivePresetId(preset.id);
    onChangePointA({ lat: preset.latA, lng: preset.lngA, label: preset.labelA });
    onChangePointB({ lat: preset.latB, lng: preset.lngB, label: preset.labelB });
    audioEngine.playNote(72, 0.5);
    if (onFlyToCoordinate) {
      onFlyToCoordinate((preset.latA + preset.latB) / 2, (preset.lngA + preset.lngB) / 2);
    }
  };

  // Swap Point A and B
  const handleSwapPoints = () => {
    const temp = { ...pointA };
    onChangePointA({ ...pointB });
    onChangePointB(temp);
    audioEngine.playNote(65, 0.4);
  };

  // Set Point A to Current Location
  const handleUseCurrentLocationForA = () => {
    onChangePointA({
      lat: currentLat,
      lng: currentLng,
      label: `Current Geodetic (${currentLat.toFixed(4)}°, ${currentLng.toFixed(4)}°)`,
    });
    audioEngine.playNote(76, 0.5);
  };

  // Export JSON Report
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profileData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `elevation-profile-${pointA.label.replace(/\s+/g, '_')}-to-${pointB.label.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setCopiedNotification('Elevation Profile Data Exported!');
    setTimeout(() => setCopiedNotification(null), 3000);
    audioEngine.playNote(80, 0.6);
  };

  // Graph Dimensions
  const graphWidth = 840;
  const graphHeight = 260;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 35;
  const paddingBottom = 45;

  const innerWidth = graphWidth - paddingLeft - paddingRight;
  const innerHeight = graphHeight - paddingTop - paddingBottom;

  // Min and Max elevations for Y-axis scaling
  const minElev = Math.min(profileData.minElevationM, 0);
  const maxElev = Math.max(profileData.peakElevationM + 150, 1000);
  const elevRange = maxElev - minElev || 1;

  const points = profileData.points;
  const totalDist = profileData.totalDistanceKm || 1;

  // Map to SVG coordinates
  const svgCoords = useMemo(() => {
    return points.map((p) => {
      const x = paddingLeft + (p.distanceKm / totalDist) * innerWidth;
      const y = paddingTop + innerHeight - ((p.elevationM - minElev) / elevRange) * innerHeight;
      return { x, y, point: p };
    });
  }, [points, totalDist, innerWidth, innerHeight, minElev, elevRange]);

  // Construct SVG Path
  const areaPathD = useMemo(() => {
    if (svgCoords.length === 0) return '';
    const lineParts = svgCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`);
    const bottomY = paddingTop + innerHeight;
    const lastX = svgCoords[svgCoords.length - 1].x;
    const firstX = svgCoords[0].x;
    return `${lineParts.join(' ')} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [svgCoords, paddingTop, innerHeight]);

  const linePathD = useMemo(() => {
    if (svgCoords.length === 0) return '';
    return svgCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  }, [svgCoords]);

  // Peak SVG coordinate
  const peakCoord = useMemo(() => {
    let best = svgCoords[0];
    svgCoords.forEach((c) => {
      if (c.point.elevationM === profileData.peakElevationM) {
        best = c;
      }
    });
    return best;
  }, [svgCoords, profileData.peakElevationM]);

  // Min SVG coordinate
  const minCoord = useMemo(() => {
    let best = svgCoords[0];
    svgCoords.forEach((c) => {
      if (c.point.elevationM === profileData.minElevationM) {
        best = c;
      }
    });
    return best;
  }, [svgCoords, profileData.minElevationM]);

  // Active hovered point
  const hoveredData = hoveredPointIndex !== null && svgCoords[hoveredPointIndex] ? svgCoords[hoveredPointIndex] : null;

  return (
    <div className="flex flex-col gap-3 p-3 max-h-[72vh] overflow-y-auto no-scrollbar text-slate-200">
      {/* Header & Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shadow-md">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Topo Cross-Section & Elevation Profile
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-mono font-bold">
                NASA SRTM Model
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Calculate geodesic Great-Circle terrain transects, slope percentage, and peak elevations between any two points.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setDisplayUnit('meters')}
              className={`px-2 py-0.5 rounded ${displayUnit === 'meters' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Meters (m)
            </button>
            <button
              onClick={() => setDisplayUnit('feet')}
              className={`px-2 py-0.5 rounded ${displayUnit === 'feet' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Feet (ft)
            </button>
          </div>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            title="Download full JSON dataset"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Preset Transect Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
          Landmark Presets:
        </span>
        {ELEVATION_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-cyan-400 shadow-sm'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Mountain className="w-3 h-3" />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Coordinate Selection Bar (Point A <-> Point B) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
        {/* Point A */}
        <div className="md:col-span-5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Point A (Origin)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleUseCurrentLocationForA}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300"
                title="Set Point A to current device position"
              >
                My Location
              </button>
              <button
                onClick={() => {
                  onSetPickingPoint(isPickingPoint === 'A' ? null : 'A');
                  audioEngine.playNote(70, 0.4);
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  isPickingPoint === 'A'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/60'
                }`}
                title="Click on the 3D globe to pick Point A"
              >
                <Crosshair className="w-3 h-3" />
                <span>{isPickingPoint === 'A' ? 'Click Globe...' : 'Pick on Globe'}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono">
            <input
              type="number"
              step="0.0001"
              value={pointA.lat}
              onChange={(e) =>
                onChangePointA({ ...pointA, lat: parseFloat(e.target.value) || 0 })
              }
              placeholder="Latitude"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              step="0.0001"
              value={pointA.lng}
              onChange={(e) =>
                onChangePointA({ ...pointA, lng: parseFloat(e.target.value) || 0 })
              }
              placeholder="Longitude"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="text-[11px] text-slate-400 truncate font-sans">
            {pointA.label} (Elev: {displayUnit === 'meters' ? `${profileData.pointA.altitude}m` : `${Math.round(profileData.pointA.altitude * 3.28084)}ft`})
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-2 flex items-center justify-center">
          <button
            onClick={handleSwapPoints}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Swap Origin and Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5 rotate-90 md:rotate-0" />
            <span className="text-[11px] font-bold">Swap</span>
          </button>
        </div>

        {/* Point B */}
        <div className="md:col-span-5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Point B (Target)
            </span>
            <button
              onClick={() => {
                onSetPickingPoint(isPickingPoint === 'B' ? null : 'B');
                audioEngine.playNote(70, 0.4);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                isPickingPoint === 'B'
                  ? 'bg-amber-600 text-white ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/60'
              }`}
              title="Click on the 3D globe to pick Point B"
            >
              <Crosshair className="w-3 h-3" />
              <span>{isPickingPoint === 'B' ? 'Click Globe...' : 'Pick on Globe'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono">
            <input
              type="number"
              step="0.0001"
              value={pointB.lat}
              onChange={(e) =>
                onChangePointB({ ...pointB, lat: parseFloat(e.target.value) || 0 })
              }
              placeholder="Latitude"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              step="0.0001"
              value={pointB.lng}
              onChange={(e) =>
                onChangePointB({ ...pointB, lng: parseFloat(e.target.value) || 0 })
              }
              placeholder="Longitude"
              className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="text-[11px] text-slate-400 truncate font-sans">
            {pointB.label} (Elev: {displayUnit === 'meters' ? `${profileData.pointB.altitude}m` : `${Math.round(profileData.pointB.altitude * 3.28084)}ft`})
          </div>
        </div>
      </div>

      {/* Picking Point Mode Banner */}
      {isPickingPoint && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border border-cyan-500/70 rounded-xl text-cyan-200 text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">
              Interactive Globe Picking Mode: Click any terrain or landmark coordinate on the 3D Globe to set Point {isPickingPoint}!
            </span>
          </div>
          <button
            onClick={() => onSetPickingPoint(null)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Key Metrics Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {/* Peak Elevation */}
        <div className="bg-slate-950/90 border border-amber-600/40 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Mountain className="w-3 h-3" />
            Peak Elevation
          </span>
          <div className="mt-1">
            <div className="text-base font-extrabold text-white font-mono">
              {displayUnit === 'meters'
                ? `${profileData.peakElevationM.toLocaleString()} m`
                : `${profileData.peakElevationFt.toLocaleString()} ft`}
            </div>
            <div className="text-[10px] text-slate-400">
              at {displayUnit === 'meters' ? `${profileData.peakDistanceKm} km` : `${Math.round(profileData.peakDistanceKm * 0.621371)} mi`}
            </div>
          </div>
        </div>

        {/* Max Slope Percentage */}
        <div className="bg-slate-950/90 border border-rose-600/40 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Max Slope %
          </span>
          <div className="mt-1">
            <div className="text-base font-extrabold text-rose-300 font-mono">
              +{profileData.maxUphillSlopePct}%
            </div>
            <div className="text-[10px] text-slate-400">
              Down: {profileData.maxDownhillSlopePct}%
            </div>
          </div>
        </div>

        {/* Average Slope */}
        <div className="bg-slate-950/90 border border-cyan-600/40 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Avg Slope %
          </span>
          <div className="mt-1">
            <div className="text-base font-extrabold text-cyan-300 font-mono">
              {profileData.avgSlopePct}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {getSlopeClassification(profileData.avgSlopePct).category.split(' ')[0]}
            </div>
          </div>
        </div>

        {/* Elevation Gain / Loss */}
        <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            Gain / Loss
          </span>
          <div className="mt-1 font-mono">
            <div className="text-xs font-bold text-emerald-400">
              +{displayUnit === 'meters' ? `${profileData.elevationGainM}m` : `${Math.round(profileData.elevationGainM * 3.28084)}ft`}
            </div>
            <div className="text-[10px] text-rose-400">
              -{displayUnit === 'meters' ? `${profileData.elevationLossM}m` : `${Math.round(profileData.elevationLossM * 3.28084)}ft`}
            </div>
          </div>
        </div>

        {/* Distance & Bearing */}
        <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Distance / Azimuth
          </span>
          <div className="mt-1">
            <div className="text-xs font-extrabold text-white font-mono">
              {displayUnit === 'meters' ? `${profileData.totalDistanceKm} km` : `${profileData.totalDistanceMiles} mi`}
            </div>
            <div className="text-[10px] text-cyan-300 font-mono">
              {profileData.bearingDeg}° ({profileData.bearingCardinal})
            </div>
          </div>
        </div>

        {/* Traverse Time & Ruggedness */}
        <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-xl flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Tobler Traverse
          </span>
          <div className="mt-1">
            <div className="text-xs font-extrabold text-amber-300 font-mono">
              ~{profileData.estimatedHikeHours} hrs
            </div>
            <div className="text-[10px] text-slate-400 truncate" title={profileData.ruggednessClass}>
              {profileData.ruggednessClass}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Cross-Section Elevation Graph */}
      <div className="relative bg-slate-950/95 border border-slate-800 rounded-2xl p-2 shadow-2xl overflow-hidden">
        {/* Graph Subtitle */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Cross-Section Topography & Slope Profile
            </span>
            <span className="text-[11px] text-slate-400">
              (Hover crosshair anywhere on graph for instantaneous gradient)
            </span>
          </div>

          {/* Quick Fly Camera button */}
          {onFlyToCoordinate && (
            <button
              onClick={() => {
                onFlyToCoordinate(profileData.peakCoordinate.lat, profileData.peakCoordinate.lng);
                audioEngine.playNote(78, 0.5);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[11px] text-cyan-300 hover:text-white transition-colors"
            >
              <Navigation className="w-3 h-3" />
              <span>Center on Peak</span>
            </button>
          )}
        </div>

        {/* SVG Container */}
        <div className="w-full overflow-x-auto select-none">
          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="w-full h-auto min-w-[620px]"
            onMouseLeave={() => setHoveredPointIndex(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * graphWidth;
              // Find closest point
              let closestIdx = 0;
              let minDist = Infinity;
              svgCoords.forEach((c, idx) => {
                const dist = Math.abs(c.x - svgX);
                if (dist < minDist) {
                  minDist = dist;
                  closestIdx = idx;
                }
              });
              setHoveredPointIndex(closestIdx);
            }}
          >
            <defs>
              {/* Gradient for Terrain Fill */}
              <linearGradient id="terrainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" /> {/* Snow Cap */}
                <stop offset="25%" stopColor="#e2e8f0" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.7" /> {/* Rock */}
                <stop offset="75%" stopColor="#0d9488" stopOpacity="0.6" /> {/* Forest / Montane */}
                <stop offset="100%" stopColor="#047857" stopOpacity="0.4" /> {/* Valley Grass */}
              </linearGradient>

              {/* Glowing Line Filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines (horizontal elevation lines) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + innerHeight * (1 - ratio);
              const elevVal = Math.round(minElev + ratio * elevRange);
              const displayVal = displayUnit === 'meters' ? `${elevVal}m` : `${Math.round(elevVal * 3.28084)}ft`;
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={graphWidth - paddingRight}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {displayVal}
                  </text>
                </g>
              );
            })}

            {/* Distance Axis markers */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const x = paddingLeft + innerWidth * ratio;
              const distVal = Math.round(totalDist * ratio * 10) / 10;
              const displayDist = displayUnit === 'meters' ? `${distVal}km` : `${Math.round(distVal * 0.621371 * 10) / 10}mi`;
              return (
                <g key={ratio}>
                  <line
                    x1={x}
                    y1={paddingTop + innerHeight}
                    x2={x}
                    y2={paddingTop + innerHeight + 4}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={paddingTop + innerHeight + 15}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {displayDist}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area of Mountain Terrain */}
            <path d={areaPathD} fill="url(#terrainGradient)" />

            {/* Terrain Surface Line */}
            <path
              d={linePathD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              filter="url(#glow)"
            />

            {/* Segment Slope Color Bars along base */}
            {svgCoords.map((c, i) => {
              if (i === 0) return null;
              const prev = svgCoords[i - 1];
              const slope = Math.abs(c.point.slopePct);
              let barColor = '#10b981'; // gentle < 5%
              if (slope >= 30) barColor = '#ef4444'; // extreme > 30%
              else if (slope >= 18) barColor = '#f97316'; // steep 18-30%
              else if (slope >= 8) barColor = '#eab308'; // moderate 8-18%

              return (
                <line
                  key={`slope-${i}`}
                  x1={prev.x}
                  y1={paddingTop + innerHeight + 2}
                  x2={c.x}
                  y2={paddingTop + innerHeight + 2}
                  stroke={barColor}
                  strokeWidth="3.5"
                />
              );
            })}

            {/* Origin Point A Pin */}
            <g transform={`translate(${svgCoords[0].x}, ${svgCoords[0].y})`}>
              <circle r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <text x="6" y="-6" fill="#34d399" fontSize="9" fontWeight="bold">
                A ({pointA.label.split(' ')[0]})
              </text>
            </g>

            {/* Target Point B Pin */}
            <g transform={`translate(${svgCoords[svgCoords.length - 1].x}, ${svgCoords[svgCoords.length - 1].y})`}>
              <circle r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="-6" y="-6" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end">
                B ({pointB.label.split(' ')[0]})
              </text>
            </g>

            {/* Peak Elevation Beacon Pin */}
            {peakCoord && (
              <g transform={`translate(${peakCoord.x}, ${peakCoord.y})`}>
                <line x1="0" y1="0" x2="0" y2="-22" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
                <rect x="-42" y="-36" width="84" height="15" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
                <text x="0" y="-26" fill="#fef08a" fontSize="8" fontWeight="bold" textAnchor="middle">
                  ▲ PEAK: {displayUnit === 'meters' ? `${profileData.peakElevationM}m` : `${profileData.peakElevationFt}ft`}
                </text>
              </g>
            )}

            {/* Min Elevation Trough Pin */}
            {minCoord && minCoord.point.elevationM !== peakCoord?.point.elevationM && (
              <g transform={`translate(${minCoord.x}, ${minCoord.y})`}>
                <circle r="3.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
                <text x="6" y="10" fill="#67e8f9" fontSize="8" fontWeight="bold">
                  ▼ Min: {displayUnit === 'meters' ? `${profileData.minElevationM}m` : `${profileData.minElevationFt}ft`}
                </text>
              </g>
            )}

            {/* Hover Crosshair / Scrubber Reticle */}
            {hoveredData && (
              <g>
                <line
                  x1={hoveredData.x}
                  y1={paddingTop}
                  x2={hoveredData.x}
                  y2={paddingTop + innerHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={hoveredData.x}
                  cy={hoveredData.y}
                  r="6"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Hovered Sample Detail HUD */}
        {hoveredData ? (
          <div className="mx-2 my-1 px-3 py-2 bg-slate-900 border border-cyan-500/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {hoveredData.point.lat.toFixed(4)}°, {hoveredData.point.lng.toFixed(4)}°
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-cyan-300 font-bold">
                Dist: {displayUnit === 'meters' ? `${hoveredData.point.distanceKm} km` : `${hoveredData.point.distanceMiles} mi`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-300 font-bold">
                Elev: {displayUnit === 'meters' ? `${hoveredData.point.elevationM} m` : `${hoveredData.point.elevationFt} ft`}
              </span>
              <span className="text-slate-400">|</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${getSlopeClassification(hoveredData.point.slopePct).badgeBg} ${getSlopeClassification(hoveredData.point.slopePct).colorClass}`}>
                Slope: {hoveredData.point.slopePct > 0 ? `+${hoveredData.point.slopePct}%` : `${hoveredData.point.slopePct}%`}
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                ({hoveredData.point.terrainType})
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-2 my-1 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            Hover cursor over the elevation graph or click anywhere on the profile to inspect point-by-point gradient metrics.
          </div>
        )}

        {/* Slope Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2 text-[10px] text-slate-400 border-t border-slate-900">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-300">Slope Gradient Key:</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2.5 h-1 bg-emerald-500 rounded" /> Level (&lt;8%)
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2.5 h-1 bg-amber-500 rounded" /> Moderate (8-18%)
            </span>
            <span className="flex items-center gap-1 text-orange-400 font-medium">
              <span className="w-2.5 h-1 bg-orange-500 rounded" /> Steep (18-30%)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <span className="w-2.5 h-1 bg-rose-500 rounded" /> Alpine Ridge (&gt;30%)
            </span>
          </div>

          <div className="text-slate-500">
            Great Circle Arc: {profileData.points.length} Geodesic Samples
          </div>
        </div>
      </div>
    </div>
  );
};
