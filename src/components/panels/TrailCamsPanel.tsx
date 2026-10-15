import React, { useState, useEffect, useRef } from 'react';
import { Camera, Flame, Eye, Thermometer, Wind, AlertCircle } from 'lucide-react';
import { TrailCam } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

interface TrailCamsPanelProps {
  cams: TrailCam[];
  onFlyToCam: (cam: TrailCam) => void;
}

export const TrailCamsPanel: React.FC<TrailCamsPanelProps> = ({ cams, onFlyToCam }) => {
  const [selectedCam, setSelectedCam] = useState<TrailCam>(cams[0]);
  const [activeFeedMode, setActiveFeedMode] = useState<'visible' | 'thermal_ir' | 'motion_track'>('thermal_ir');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Procedural Simulated Video Feed Generator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const renderFeed = () => {
      animId = requestAnimationFrame(renderFeed);
      const time = performance.now() * 0.002;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (activeFeedMode === 'visible') {
        // Natural landscape view
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.6, '#bae6fd');
        skyGrad.addColorStop(0.65, '#15803d');
        skyGrad.addColorStop(1, '#166534');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Mountain silhouettes
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.65);
        ctx.lineTo(w * 0.35, h * 0.35);
        ctx.lineTo(w * 0.7, h * 0.65);
        ctx.closePath();
        ctx.fill();

        // Trees
        for (let t = 0; t < 6; t++) {
          const tx = 20 + t * 40;
          ctx.fillStyle = '#064e3b';
          ctx.beginPath();
          ctx.moveTo(tx, h * 0.85);
          ctx.lineTo(tx + 12, h * 0.55);
          ctx.lineTo(tx + 24, h * 0.85);
          ctx.closePath();
          ctx.fill();
        }
      } else if (activeFeedMode === 'thermal_ir') {
        // Infrared Thermal gradient
        const irGrad = ctx.createLinearGradient(0, 0, w, h);
        irGrad.addColorStop(0, '#1e1b4b');
        irGrad.addColorStop(0.4, '#4c1d95');
        irGrad.addColorStop(0.7, '#b91c1c');
        irGrad.addColorStop(0.9, '#ea580c');
        irGrad.addColorStop(1, '#fde047');
        ctx.fillStyle = irGrad;
        ctx.fillRect(0, 0, w, h);

        // Wildfire thermal hotspot with undulating heat wave
        const hotX = w * 0.6 + Math.sin(time * 2) * 8;
        const hotY = h * 0.45 + Math.cos(time * 2) * 5;
        const rad = 28 + Math.sin(time * 4) * 4;
        const heatGrad = ctx.createRadialGradient(hotX, hotY, 2, hotX, hotY, rad);
        heatGrad.addColorStop(0, '#ffffff');
        heatGrad.addColorStop(0.3, '#fef08a');
        heatGrad.addColorStop(0.6, '#ef4444');
        heatGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(hotX, hotY, rad, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`FLIR THERMAL [382°C]`, hotX - 35, hotY - 32);
      } else {
        // Motion tracking mode
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }

        // Bounding boxes
        const boxX = w * 0.3 + Math.sin(time) * 20;
        const boxY = h * 0.5 + Math.cos(time * 0.8) * 10;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, 40, 30);

        ctx.fillStyle = '#22c55e';
        ctx.font = '9px monospace';
        ctx.fillText('TARGET: CERVUS (98%)', boxX, boxY - 4);
      }

      // HUD scanline & timestamp overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, w, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px monospace';
      ctx.fillText(`${selectedCam.name} // REC`, 6, 12);
      ctx.fillText(`FPS: 30.0`, w - 50, 12);
    };

    renderFeed();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeFeedMode, selectedCam]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-200 text-xs">
      {/* 1. Camera List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-700/60 pb-1">
          <span className="flex items-center gap-1.5 text-orange-400">
            <Camera className="w-3.5 h-3.5" />
            Nature Trail Cam Grid ({cams.length})
          </span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {cams.map((cam) => (
            <div
              key={cam.id}
              onClick={() => {
                setSelectedCam(cam);
                audioEngine.playTrailCamSpatialAmbience(cam.name, (cam.lng - (-120)) * 15);
              }}
              className={`p-2 rounded-xl cursor-pointer border transition-colors ${
                selectedCam.id === cam.id
                  ? 'bg-orange-950/60 border-orange-500 text-white'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{cam.name}</span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    cam.status === 'alert'
                      ? 'bg-red-600 text-white'
                      : cam.status === 'warning'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {cam.status}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>{cam.region}</span>
                <span className="text-orange-400 font-bold">Risk: {cam.fireRiskScore}/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Live Simulated Video / Thermal Feed */}
      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-200">Optoelectronic Feed</span>
          <div className="flex gap-1">
            {(['thermal_ir', 'visible', 'motion_track'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveFeedMode(m)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                  activeFeedMode === m ? 'bg-orange-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {m === 'thermal_ir' ? 'FLIR IR' : m === 'visible' ? 'RGB' : 'TRACK'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
          <canvas ref={canvasRef} width={280} height={160} className="w-full h-full object-cover" />
        </div>

        <button
          onClick={() => {
            onFlyToCam(selectedCam);
            audioEngine.playTrailCamSpatialAmbience(selectedCam.name, 0);
          }}
          className="mt-2.5 w-full bg-slate-700 hover:bg-slate-600 text-white py-1 rounded font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Fly Camera to Sentinel Mast in 3D
        </button>
      </div>

      {/* 3. Wildfire Risk & Smoke Index */}
      <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div>
          <span className="font-semibold text-orange-400 flex items-center gap-1.5 mb-2">
            <Flame className="w-3.5 h-3.5" />
            Environmental Hazard Diagnostics
          </span>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between items-center">
              <span className="text-slate-400">Smoke Aerosol Level:</span>
              <span
                className={`font-bold ${selectedCam.smokeLevelPpm > 50 ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {selectedCam.smokeLevelPpm} PPM
              </span>
            </div>

            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between items-center">
              <span className="text-slate-400">Ambient Temp / Humidity:</span>
              <span className="text-white">
                {selectedCam.temperature}°C / {selectedCam.humidity}%
              </span>
            </div>

            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between items-center">
              <span className="text-slate-400">Wind Velocity:</span>
              <span className="text-cyan-400 font-bold">{selectedCam.windSpeed} km/h</span>
            </div>

            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700">
              <span className="text-slate-400 block mb-1">AI Detection Stream:</span>
              <div className="flex flex-wrap gap-1">
                {selectedCam.detections.map((d, i) => (
                  <span key={i} className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 bg-slate-900/90 rounded border border-orange-500/30 flex items-center gap-1.5 text-[10px] text-orange-300">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Automated dry-lightning alert trigger armed for this sector.</span>
        </div>
      </div>
    </div>
  );
};
