/**
 * Spatial Audio Settings Panel
 * Controls Spatial Audio Synthesis for emergency alerts and trail cam feeds,
 * with an interactive stereo width slider and real-time soundstage visualization.
 */

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Radio,
  AlertTriangle,
  Camera,
  Play,
  RotateCcw,
  Sparkles,
  Headphones,
  ShieldCheck,
  Check,
  Activity,
  Layers,
} from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';

interface SpatialAudioSettingsPanelProps {
  onSettingsChanged?: () => void;
}

export const SpatialAudioSettingsPanel: React.FC<SpatialAudioSettingsPanelProps> = ({
  onSettingsChanged,
}) => {
  const [spatialEnabled, setSpatialEnabled] = useState(audioEngine.spatialAudioEnabled);
  const [emergencySpatial, setEmergencySpatial] = useState(audioEngine.emergencyAlertsSpatialAudio);
  const [trailCamSpatial, setTrailCamSpatial] = useState(audioEngine.trailCamFeedsSpatialAudio);
  const [stereoWidth, setStereoWidth] = useState(audioEngine.stereoWidth);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Sync state to audioEngine
  const handleToggleSpatial = () => {
    const next = !spatialEnabled;
    setSpatialEnabled(next);
    audioEngine.spatialAudioEnabled = next;
    audioEngine.playNote(next ? 74 : 52, 0.6);
    onSettingsChanged?.();
  };

  const handleToggleEmergency = () => {
    const next = !emergencySpatial;
    setEmergencySpatial(next);
    audioEngine.emergencyAlertsSpatialAudio = next;
    audioEngine.playNote(next ? 76 : 54, 0.5);
    onSettingsChanged?.();
  };

  const handleToggleTrailCam = () => {
    const next = !trailCamSpatial;
    setTrailCamSpatial(next);
    audioEngine.trailCamFeedsSpatialAudio = next;
    audioEngine.playNote(next ? 72 : 50, 0.5);
    onSettingsChanged?.();
  };

  const handleStereoWidthChange = (val: number) => {
    setStereoWidth(val);
    audioEngine.stereoWidth = val;
    onSettingsChanged?.();
  };

  const handleTestEmergency = () => {
    audioEngine.playEmergencySpatialBeacon('Wildfire Warning Alpha', 40);
    setTestFeedback('Dispatched 3D spatial siren beacon (Azimuth: +40° East)');
    setTimeout(() => setTestFeedback(null), 3000);
  };

  const handleTestTrailCam = () => {
    audioEngine.playTrailCamSpatialAmbience('Sierra Sentinel #4', -55);
    setTestFeedback('Dispatched 3D ambient acoustic chime (Azimuth: -55° West)');
    setTimeout(() => setTestFeedback(null), 3000);
  };

  const handleTest360Sweep = () => {
    setTestFeedback('Executing 360° binaural surround sound sweep...');
    const angles = [-90, -45, 0, 45, 90];
    angles.forEach((angle, idx) => {
      setTimeout(() => {
        audioEngine.playNote(68 + idx * 2, 0.7, (angle / 90) * 12, 1, -10);
      }, idx * 180);
    });
    setTimeout(() => setTestFeedback(null), 3500);
  };

  const handleResetDefaults = () => {
    setSpatialEnabled(true);
    setEmergencySpatial(true);
    setTrailCamSpatial(true);
    setStereoWidth(1.0);
    audioEngine.spatialAudioEnabled = true;
    audioEngine.emergencyAlertsSpatialAudio = true;
    audioEngine.trailCamFeedsSpatialAudio = true;
    audioEngine.stereoWidth = 1.0;
    audioEngine.playNote(69, 0.6);
    setTestFeedback('Reset spatial audio synthesis parameters to factory reference standard.');
    setTimeout(() => setTestFeedback(null), 2500);
    onSettingsChanged?.();
  };

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Header and status banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Headphones className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Spatial Audio Synthesis &amp; 3D Soundstage</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono border ${
                spatialEnabled
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {spatialEnabled ? 'HRTF 3D ACTIVE' : 'BYPASSED / MONO'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Web Audio HRTF panners for directional emergency alerts &amp; trail cam environmental acoustics.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          title="Reset to 1.0x default natural stereo width"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {testFeedback && (
        <div className="bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 animate-fade-in">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
          <span>{testFeedback}</span>
        </div>
      )}

      {/* Main Grid: Controls + Stereo Width Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left Column: Toggles for Emergency & Trail Cams */}
        <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
          <span className="font-semibold text-white block text-xs">Acoustic Feed Toggles</span>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${spatialEnabled ? 'bg-cyan-600/30 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                {spatialEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-semibold text-white block">Spatial Audio Synthesis</span>
                <span className="text-[10px] text-slate-400">Master 3D sound positioning engine</span>
              </div>
            </div>
            <button
              onClick={handleToggleSpatial}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                spatialEnabled ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  spatialEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Emergency Alerts Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${emergencySpatial ? 'bg-red-600/30 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Emergency Alerts Spatial Audio</span>
                <span className="text-[10px] text-slate-400">Directional siren beacons &amp; disaster warnings</span>
              </div>
            </div>
            <button
              onClick={handleToggleEmergency}
              disabled={!spatialEnabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-40 ${
                emergencySpatial && spatialEnabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  emergencySpatial && spatialEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Trail Cam Feeds Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${trailCamSpatial ? 'bg-amber-600/30 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Trail Cam Feeds Spatial Audio</span>
                <span className="text-[10px] text-slate-400">Ambient mountain wind &amp; optical wildlife chimes</span>
              </div>
            </div>
            <button
              onClick={handleToggleTrailCam}
              disabled={!spatialEnabled}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-40 ${
                trailCamSpatial && spatialEnabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  trailCamSpatial && spatialEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right Column: Stereo Width Slider & Soundstage Field Meter */}
        <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white block text-xs">Stereo Width Adjustment</span>
              <span className="text-cyan-400 font-mono text-xs font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {(stereoWidth * 100).toFixed(0)}% ({stereoWidth.toFixed(2)}x)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Expands or focuses the stereo separation of ambient environmental sound emitters in binaural space.
            </p>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={stereoWidth}
                onChange={(e) => handleStereoWidthChange(parseFloat(e.target.value))}
                disabled={!spatialEnabled}
                className="w-full accent-cyan-500 disabled:opacity-40 cursor-pointer h-2 bg-slate-900 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.0x (Mono)</span>
                <span>1.0x (Natural HRTF)</span>
                <span>2.0x (Ultra-Wide 3D)</span>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
              {[
                { label: 'Mono', val: 0.0 },
                { label: 'Focused', val: 0.75 },
                { label: 'Reference', val: 1.0 },
                { label: 'Wide', val: 1.5 },
                { label: 'Holographic', val: 2.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleStereoWidthChange(p.val)}
                  disabled={!spatialEnabled}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                    Math.abs(stereoWidth - p.val) < 0.04
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Visual Soundstage Field Graphic */}
            <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between text-[9px] text-slate-500 font-mono mb-1">
                <span>LEFT (-100%)</span>
                <span>LISTENER CENTER</span>
                <span>RIGHT (+100%)</span>
              </div>
              <div className="w-full h-8 relative flex items-center justify-center">
                {/* Horizontal soundstage axis */}
                <div className="w-full h-0.5 bg-slate-800 absolute" />
                {/* Listener center point */}
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 z-10 shadow-lg shadow-cyan-500/50" />
                {/* Left Speaker Node */}
                <div
                  className="w-3 h-3 rounded-full bg-emerald-400 z-10 transition-all duration-150 absolute shadow"
                  style={{ left: `calc(50% - ${Math.min(48, stereoWidth * 24)}%)` }}
                />
                {/* Right Speaker Node */}
                <div
                  className="w-3 h-3 rounded-full bg-purple-400 z-10 transition-all duration-150 absolute shadow"
                  style={{ right: `calc(50% - ${Math.min(48, stereoWidth * 24)}%)` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1">
                Acoustic Spread: {stereoWidth === 0 ? 'Point Source (Collapsed)' : stereoWidth < 1 ? 'Narrow Spatial Cone' : stereoWidth === 1 ? 'Binaural Anatomical Field' : 'Expanded Panoramic Surround'}
              </span>
            </div>
          </div>

          {/* Test Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60">
            <button
              onClick={handleTestEmergency}
              className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Test Emergency (40° Right)</span>
            </button>

            <button
              onClick={handleTestTrailCam}
              className="bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5"
            >
              <Camera className="w-3 h-3 text-amber-400" />
              <span>Test Trail Cam (-55° Left)</span>
            </button>

            <button
              onClick={handleTest360Sweep}
              className="bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>360° Sweep</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
