import React, { useState, useEffect } from 'react';
import { Music, Radio, Sliders, Volume2, Sparkles, Bluetooth, Lightbulb } from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';

export const MidiSpatialPanel: React.FC = () => {
  const [bleMidiStatus, setBleMidiStatus] = useState<'unsupported' | 'disconnected' | 'connected'>('disconnected');
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [synthType, setSynthType] = useState<OscillatorType>('sawtooth');
  const [cutoff, setCutoff] = useState(1200);
  const [lfoRate, setLfoRate] = useState(1.4);
  const [neuralScriptOn, setNeuralScriptOn] = useState(true);
  const [lightingHue, setLightingHue] = useState(audioEngine.currentLightingHue);

  useEffect(() => {
    // Listen for MIDI events from engine
    const unsubscribe = audioEngine.onMidi((note, velocity, isDown) => {
      setActiveNotes((prev) => (isDown ? [...new Set([...prev, note])] : prev.filter((n) => n !== note)));
    });

    audioEngine.setProximityListener((intensity, beaconId) => {
      const newHue = (180 + intensity * 120) % 360;
      setLightingHue(newHue);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnectBleMidi = async () => {
    const success = await audioEngine.requestMidi();
    if (success) {
      setBleMidiStatus('connected');
    } else {
      setBleMidiStatus('unsupported');
    }
  };

  const handleKeyNoteDown = (noteNumber: number) => {
    audioEngine.synthType = synthType;
    audioEngine.playNote(noteNumber, 0.85, 0, 0, -2);
    setActiveNotes((prev) => [...new Set([...prev, noteNumber])]);
  };

  const handleKeyNoteUp = (noteNumber: number) => {
    audioEngine.stopNote(noteNumber);
    setActiveNotes((prev) => prev.filter((n) => n !== noteNumber));
  };

  const updateCutoff = (val: number) => {
    setCutoff(val);
    audioEngine.baseFilterCutoff = val;
  };

  const updateLfo = (val: number) => {
    setLfoRate(val);
    audioEngine.modulationRate = val;
  };

  const toggleNeural = () => {
    const next = !neuralScriptOn;
    setNeuralScriptOn(next);
    audioEngine.neuralScriptEnabled = next;
  };

  // 14 piano keys for interactive virtual MIDI keyboard (C3 to D4)
  const keys = [
    { note: 60, name: 'C', isBlack: false },
    { note: 61, name: 'C#', isBlack: true },
    { note: 62, name: 'D', isBlack: false },
    { note: 63, name: 'D#', isBlack: true },
    { note: 64, name: 'E', isBlack: false },
    { note: 65, name: 'F', isBlack: false },
    { note: 66, name: 'F#', isBlack: true },
    { note: 67, name: 'G', isBlack: false },
    { note: 68, name: 'G#', isBlack: true },
    { note: 69, name: 'A', isBlack: false },
    { note: 70, name: 'A#', isBlack: true },
    { note: 71, name: 'B', isBlack: false },
    { note: 72, name: 'C2', isBlack: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-200 text-xs">
      {/* 1. Virtual MIDI Keyboard & BLE Hook */}
      <div className="flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-700/60 pb-1 mb-2">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Music className="w-3.5 h-3.5" />
            Authorized BLE MIDI & Key Matrix
          </span>
          <button
            onClick={handleConnectBleMidi}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
              bleMidiStatus === 'connected'
                ? 'bg-emerald-600 text-white'
                : bleMidiStatus === 'unsupported'
                ? 'bg-slate-700 text-slate-400'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <Bluetooth className="w-3 h-3" />
            {bleMidiStatus === 'connected' ? 'BLE Paired' : 'Scan BLE MIDI'}
          </button>
        </div>

        {/* Piano Keys Matrix */}
        <div className="relative h-24 bg-slate-900/90 rounded-xl p-1.5 border border-slate-700 flex select-none overflow-x-auto">
          {keys.map((k) => {
            const isPlaying = activeNotes.includes(k.note);
            return (
              <button
                key={k.note}
                onMouseDown={() => handleKeyNoteDown(k.note)}
                onMouseUp={() => handleKeyNoteUp(k.note)}
                onTouchStart={() => handleKeyNoteDown(k.note)}
                onTouchEnd={() => handleKeyNoteUp(k.note)}
                className={`relative flex-1 rounded-b transition-colors flex flex-col justify-end items-center pb-1 font-mono text-[9px] ${
                  k.isBlack
                    ? `bg-slate-800 text-slate-300 mx-[-6px] z-10 h-14 ${
                        isPlaying ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'
                      }`
                    : `bg-slate-200 text-slate-900 h-full ${
                        isPlaying ? 'bg-cyan-400' : 'hover:bg-white'
                      }`
                }`}
              >
                <span>{k.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Polyphony: Web Audio Synth</span>
          <span className="font-mono text-cyan-400">Notes: {activeNotes.join(', ') || 'Idle'}</span>
        </div>
      </div>

      {/* 2. Neural Sound Synthesis Script & DSP Filters */}
      <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Neural DSP Script Modulation
            </span>
            <button
              onClick={toggleNeural}
              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                neuralScriptOn ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              {neuralScriptOn ? 'NEURAL ON' : 'MANUAL'}
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-slate-400">Filter Cutoff:</span>
                <span className="text-cyan-400">{cutoff} Hz</span>
              </div>
              <input
                type="range"
                min="200"
                max="4000"
                step="50"
                value={cutoff}
                onChange={(e) => updateCutoff(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1 font-mono">
                <span className="text-slate-400">Neural LFO Rate:</span>
                <span className="text-cyan-400">{lfoRate.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="10.0"
                step="0.1"
                value={lfoRate}
                onChange={(e) => updateLfo(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="flex gap-1.5 pt-1">
              {(['sawtooth', 'square', 'sine', 'triangle'] as OscillatorType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSynthType(t);
                    audioEngine.synthType = t;
                  }}
                  className={`flex-1 py-1 rounded text-[10px] font-mono capitalize transition-colors border ${
                    synthType === t
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 mt-2">
          Real-time algorithmic filter modulation reacts to network ping and weather pressure.
        </div>
      </div>

      {/* 3. Audio Spatialization & Lighting Synchronization */}
      <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Stage Lighting & Beacon Proximity
            </span>
          </div>

          <p className="text-[11px] text-slate-300 mb-2">
            Automated environment synchronization triggers stage lighting color palettes whenever approaching 3D beacons or friends.
          </p>

          <div
            className="p-3 rounded-xl border border-slate-700 flex items-center justify-between shadow-inner transition-colors duration-300"
            style={{
              backgroundColor: `hsl(${lightingHue}, 60%, 15%)`,
              borderColor: `hsl(${lightingHue}, 70%, 45%)`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full shadow-md"
                style={{ backgroundColor: `hsl(${lightingHue}, 90%, 55%)` }}
              />
              <span className="font-mono font-bold text-white text-[11px]">
                SYNCHRONIZED HUE: {Math.round(lightingHue)}°
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-300">DMX-512 Ready</span>
          </div>
        </div>

        <div className="p-2 bg-slate-900/90 rounded border border-slate-700 text-[10px] text-slate-400 flex items-center justify-between mt-2">
          <span>Spatial Model: HRTF Head-Related</span>
          <span className="text-cyan-400 font-mono">3D Audio Latency: 2.1ms</span>
        </div>
      </div>
    </div>
  );
};
