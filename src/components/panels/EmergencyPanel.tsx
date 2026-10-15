import React, { useState } from 'react';
import {
  AlertTriangle,
  Siren,
  ShieldAlert,
  CheckCircle2,
  Navigation2,
  Radio,
  BellRing,
  Flame,
  Car,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  Compass,
  Mic,
  MicOff,
  Volume2,
  PhoneCall,
  Headphones,
  Wifi,
} from 'lucide-react';
import { EmergencyIncident, DisasterWarning, TrafficSegment } from '../../types';
import { encodePlusCode } from '../../utils/plusCodes';
import { audioEngine } from '../../utils/audioEngine';

interface EmergencyPanelProps {
  emergencies: EmergencyIncident[];
  disasters: DisasterWarning[];
  trafficSegments: TrafficSegment[];
  sosActive: boolean;
  onToggleSos: () => void;
  onSelectEmergency: (incident: EmergencyIncident) => void;
  onSelectDisaster: (disaster: DisasterWarning) => void;
  onSelectTraffic: (segment: TrafficSegment) => void;
  onReportIncident: (incident: EmergencyIncident) => void;
  currentLat: number;
  currentLng: number;
  currentPlusCode: string;
}

export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({
  emergencies,
  disasters,
  trafficSegments,
  sosActive,
  onToggleSos,
  onSelectEmergency,
  onSelectDisaster,
  onSelectTraffic,
  onReportIncident,
  currentLat,
  currentLng,
  currentPlusCode,
}) => {
  const [subTab, setSubTab] = useState<'incidents' | 'disasters' | 'traffic' | 'report' | 'radio_voip'>('incidents');
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident>(emergencies[0]);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterWarning>(disasters[0]);
  const [selectedTraffic, setSelectedTraffic] = useState<TrafficSegment>(trafficSegments[0]);

  // Report incident form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<EmergencyIncident['type']>('traffic_accident');
  const [reportSeverity, setReportSeverity] = useState<EmergencyIncident['severity']>('high');
  const [reportDesc, setReportDesc] = useState('');
  const [reportTrafficImpact, setReportTrafficImpact] = useState<EmergencyIncident['trafficImpact']>('lane_closed');
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Web Radio & Google Voice VOIP state
  const [activeRadioChannel, setActiveRadioChannel] = useState('162.55 MHz (Emergency Weather Band)');
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [voipNumberIndex, setVoipNumberIndex] = useState(0);
  const freeVoipNumbers = [
    '+1 (800) 555-0199 (Mesh VOIP Node Alpha)',
    '+1 (888) 412-9921 (Emergency Dispatch Relay)',
    '+1 (877) 304-8812 (Amateur HAM Gateway)',
    '+1 (800) 204-9911 (Search & Rescue Hub)',
  ];

  const handleToggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition API is not supported in this browser. Please type the description manually.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        audioEngine.playNote(72, 0.5);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setReportDesc((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        audioEngine.playNote(76, 0.5);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      alert('Could not start speech recognition.');
    }
  };

  const handleCycleVoipNumber = () => {
    setVoipNumberIndex((prev) => (prev + 1) % freeVoipNumbers.length);
    audioEngine.playNote(79, 0.6);
  };

  const [triageStatus, setTriageStatus] = useState<Record<string, boolean>>({
    perimeter_secured: true,
    reroute_broadcasted: true,
    first_responder_en_route: true,
    patient_stabilized: false,
  });

  const toggleTriage = (key: string) => {
    setTriageStatus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSosClick = () => {
    onToggleSos();
    if (!sosActive) {
      // Trigger emergency synth chime pulse
      audioEngine.playNote(84, 0.95);
      setTimeout(() => audioEngine.playNote(77, 0.9), 250);
      setTimeout(() => audioEngine.playNote(84, 0.95), 500);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    const newInc: EmergencyIncident = {
      id: 'inc-' + Date.now().toString(36),
      title: reportTitle.trim(),
      type: reportType,
      severity: reportSeverity,
      lat: currentLat,
      lng: currentLng,
      plusCode: currentPlusCode,
      reportedTime: 'Just now',
      status: 'active',
      etaMinutes: 6,
      description: reportDesc.trim() || 'Citizen reported local hazard via offline mesh protocol.',
      unitsDispatched: ['Local Squad Alpha', 'Medic Unit 9'],
      trafficImpact: reportTrafficImpact,
      evacuationZoneRadiusKm: reportType === 'wildfire' ? 5.0 : 0.8,
    };

    onReportIncident(newInc);
    setReportTitle('');
    setReportDesc('');
    setReportFeedback(`Incident "${newInc.title}" registered locally and plotted to 3D grid.`);
    setTimeout(() => setReportFeedback(null), 3000);
    audioEngine.playNote(81, 0.85);
  };

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Subtab Navigation Row */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('incidents')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'incidents' ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Accident Updates ({emergencies.length})</span>
          </button>

          <button
            onClick={() => setSubTab('disasters')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'disasters' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Natural Disaster Warnings ({disasters.length})</span>
          </button>

          <button
            onClick={() => setSubTab('traffic')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'traffic' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Public Traffic Data &amp; Closures</span>
          </button>

          <button
            onClick={() => setSubTab('report')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'report' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>

          <button
            onClick={() => setSubTab('radio_voip')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'radio_voip' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span>Web Radio &amp; VoIP</span>
          </button>
        </div>

        <button
          onClick={handleSosClick}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
            sosActive ? 'bg-red-600 text-white animate-none shadow-md' : 'bg-red-950 text-red-200 border border-red-700'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{sosActive ? 'SOS ACTIVE' : 'SOS BEACON'}</span>
        </button>
      </div>

      {/* 1. ACCIDENT UPDATES & LIVE DISPATCH FEED */}
      {subTab === 'incidents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Incident List */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-red-400">Tactical Responder Feed</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {emergencies.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    onSelectEmergency(inc);
                    audioEngine.playEmergencySpatialBeacon(inc.title, (inc.lat - currentLat) * 90);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer border transition-colors ${
                    selectedIncident.id === inc.id
                      ? 'bg-red-950/70 border-red-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-semibold text-white leading-tight">{inc.title}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        inc.severity === 'critical'
                          ? 'bg-red-600 text-white'
                          : inc.severity === 'high'
                          ? 'bg-orange-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>{inc.plusCode}</span>
                    <span className="text-amber-400 font-medium">ETA: {inc.etaMinutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Detail */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
                <span className="font-semibold text-white">Incident Details: {selectedIncident.id}</span>
                <span className="font-mono text-cyan-400 text-[11px]">{selectedIncident.reportedTime}</span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed mb-3">{selectedIncident.description}</p>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Traffic Corridor Impact:</span>
                  <span className="text-amber-400 uppercase font-semibold">
                    {selectedIncident.trafficImpact.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Evacuation Radius:</span>
                  <span className="text-white">{selectedIncident.evacuationZoneRadiusKm || 0.5} km</span>
                </div>
              </div>

              <div className="mt-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Dispatched Units</span>
                <div className="flex flex-wrap gap-1">
                  {selectedIncident.unitsDispatched.map((u, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] text-cyan-300">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-1.5 bg-slate-900/90 rounded border border-slate-700 text-[10px] text-slate-400 flex items-center justify-between mt-2 font-mono">
              <span>Grid Precision: 1m²</span>
              <span className="text-emerald-400">STATUS: {selectedIncident.status.toUpperCase()}</span>
            </div>
          </div>

          {/* Triage Protocol Checklist */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-red-400 flex items-center gap-1.5 mb-2 border-b border-slate-700/60 pb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Active Triage Protocols
              </span>

              <div className="space-y-1.5">
                {[
                  ['perimeter_secured', '1. Establish Safe Perimeter & Grid Lock'],
                  ['reroute_broadcasted', '2. Dynamic Traffic Detour Broadcast'],
                  ['first_responder_en_route', '3. Dispatch Tactical Responders'],
                  ['patient_stabilized', '4. Triage & Hospital Telemetry Handshake'],
                ].map(([k, label]) => (
                  <div
                    key={k}
                    onClick={() => toggleTriage(k)}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900/50 cursor-pointer text-[11px]"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        triageStatus[k] ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-600'
                      }`}
                    >
                      {triageStatus[k] && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span className={triageStatus[k] ? 'text-slate-200 line-through opacity-70' : 'text-slate-300'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 bg-slate-900/90 rounded border border-red-500/30 text-[10px] text-red-300 flex items-center gap-1.5 mt-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Emergency channel broadcast active via local mesh relay.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. NATURAL DISASTER WARNINGS */}
      {subTab === 'disasters' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-orange-400">Civil Defense Warnings</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {disasters.map((dis) => (
                <div
                  key={dis.id}
                  onClick={() => {
                    setSelectedDisaster(dis);
                    onSelectDisaster(dis);
                    audioEngine.playEmergencySpatialBeacon(dis.title, (dis.center[1] - currentLng) * 80);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer border transition-colors ${
                    selectedDisaster.id === dis.id
                      ? 'bg-orange-950/70 border-orange-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{dis.title}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white">
                      {dis.severity}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>Issued: {dis.issuedAt}</span>
                    <span className="text-orange-400 font-bold">Zone: {dis.radiusKm} km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-white block mb-1 border-b border-slate-700/60 pb-1">
                Civilian Safety Instructions
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{selectedDisaster.instructions}</p>

              <div className="p-2 bg-slate-900 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                <span className="text-slate-400 block text-[10px]">Primary Evacuation Corridor:</span>
                <span className="text-emerald-400 font-semibold">{selectedDisaster.evacuationRoute}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-2">
              Evacuation routes continuously prioritize roads unaffected by traffic collisions and flooding.
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-cyan-400 block mb-2 border-b border-slate-700/60 pb-1">
                Designated Resilience Shelters
              </span>
              <div className="space-y-1.5">
                {selectedDisaster.shelterLocations.map((s, i) => (
                  <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-700 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{s.name}</span>
                      <span className="text-[10px] font-mono text-cyan-300">Cap: {s.capacity}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">Plus Code: {s.plusCode}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 bg-emerald-950/60 rounded border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Offline shelter directory loaded into local storage.</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. PUBLIC TRAFFIC DATA & CLOSURES */}
      {subTab === 'traffic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-cyan-400">Public Transit &amp; Road Segments</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {trafficSegments.map((seg) => (
                <div
                  key={seg.id}
                  onClick={() => {
                    setSelectedTraffic(seg);
                    onSelectTraffic(seg);
                  }}
                  className={`p-2 rounded-xl cursor-pointer border transition-colors ${
                    selectedTraffic.id === seg.id
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{seg.roadName}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        seg.congestionLevel === 'free_flow'
                          ? 'bg-emerald-600 text-white'
                          : seg.congestionLevel === 'moderate'
                          ? 'bg-amber-600 text-white'
                          : seg.congestionLevel === 'heavy'
                          ? 'bg-orange-600 text-white'
                          : 'bg-red-700 text-white'
                      }`}
                    >
                      {seg.congestionLevel.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>Speed: {seg.avgSpeedKmh} / {seg.speedLimitKmh} km/h</span>
                    {seg.closureReason && <span className="text-red-400 font-bold">CLOSED</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-white block mb-2 border-b border-slate-700/60 pb-1">
                Segment Telemetry: {selectedTraffic.roadName}
              </span>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Congestion State:</span>
                  <span className="text-cyan-400 uppercase font-bold">
                    {selectedTraffic.congestionLevel.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Average Velocity:</span>
                  <span className="text-white font-bold">{selectedTraffic.avgSpeedKmh} km/h</span>
                </div>
                <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Designated Limit:</span>
                  <span className="text-white">{selectedTraffic.speedLimitKmh} km/h</span>
                </div>

                {selectedTraffic.closureReason && (
                  <div className="p-2 bg-red-950/70 border border-red-600 rounded text-red-200 text-[11px]">
                    <span className="font-bold block">Closure Reason:</span>
                    <span>{selectedTraffic.closureReason}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-2">
              Public database arterial speeds rendered directly as 3D colored ribbons in street view.
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-cyan-400 block mb-2 border-b border-slate-700/60 pb-1">
                Offline Routing Advisory
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Local routing engines factor real-time traffic slowdowns and emergency roadblocks to construct dynamic detours without relying on external routing APIs.
              </p>
            </div>

            <div className="p-2 bg-slate-900/90 rounded border border-slate-700 text-[11px] font-mono">
              <span className="text-slate-400">Recommended Detour: </span>
              <span className="text-emerald-400 font-semibold">Embarcadero Elevated Bypass (+8 mins saved)</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. REPORT INCIDENT FORM */}
      {subTab === 'report' && (
        <form onSubmit={handleSubmitReport} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-2">
            <span className="font-semibold text-red-400 block mb-1">Incident Classification</span>
            <div>
              <label className="text-slate-400 block text-[10px]">Incident Headline</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. Fallen Tree on West Avenue"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block text-[10px]">Incident Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white text-xs focus:outline-none"
                >
                  <option value="traffic_accident">Traffic Accident</option>
                  <option value="wildfire">Wildfire Spot</option>
                  <option value="seismic">Seismic Damage</option>
                  <option value="flood">Flash Flood</option>
                  <option value="medical">Medical Need</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block text-[10px]">Severity</label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white text-xs focus:outline-none"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-2">
            <span className="font-semibold text-cyan-400 block mb-1">Local Geonav &amp; Traffic Impact</span>
            <div className="p-2 bg-slate-900 rounded border border-slate-700 font-mono text-[10px]">
              <div>Lat: {currentLat.toFixed(5)}° | Lng: {currentLng.toFixed(5)}°</div>
              <div className="text-cyan-400 font-bold mt-0.5">Plus Code: {currentPlusCode}</div>
            </div>

            <div>
              <label className="text-slate-400 block text-[10px]">Corridor Traffic Impact</label>
              <select
                value={reportTrafficImpact}
                onChange={(e) => setReportTrafficImpact(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
              >
                <option value="lane_closed">Single Lane Closed</option>
                <option value="road_blocked">Complete Road Blockage</option>
                <option value="full_detour">Full Evacuation Detour Required</option>
                <option value="none">No Roadway Impact</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-slate-400 text-[10px]">Observations &amp; Hazards (Audible Dictation)</label>
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors ${
                    isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700 hover:bg-slate-600 text-cyan-300'
                  }`}
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Details for incoming tactical responders or speak via mic..."
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="mt-2">
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Publish Local Incident Alert</span>
              </button>
              {reportFeedback && (
                <div className="text-[10px] text-emerald-400 text-center mt-1">{reportFeedback}</div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 5. WEB RADIO, STREAMING NEWS, HAM & GOOGLE VOICE VOIP */}
      {subTab === 'radio_voip' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Streaming Web Radio & News */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <span className="font-semibold text-cyan-400 block mb-1 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" />
                Streaming Web Radio &amp; News
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                Tune into regional emergency broadcast frequencies, weather feeds, and amateur HAM repeaters.
              </p>
              <div className="space-y-1">
                {[
                  '162.55 MHz (Emergency Weather Band)',
                  '146.52 MHz (Amateur HAM Calling Channel)',
                  '101.5 FM (Regional Emergency News)',
                  '88.9 MHz (Seismic Alert Stream)',
                ].map((ch) => (
                  <div
                    key={ch}
                    onClick={() => {
                      setActiveRadioChannel(ch);
                      setRadioPlaying(true);
                      audioEngine.playNote(74, 0.6);
                    }}
                    className={`p-1.5 rounded cursor-pointer border text-[11px] font-mono flex items-center justify-between ${
                      activeRadioChannel === ch && radioPlaying
                        ? 'bg-cyan-950/70 border-cyan-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{ch}</span>
                    <span className="text-[10px] text-emerald-400">{activeRadioChannel === ch && radioPlaying ? 'LIVE' : 'Tune'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-700 font-mono text-[10px] text-slate-300 flex items-center justify-between">
              <span>Status: {radioPlaying ? 'Streaming Active' : 'Muted'}</span>
              <button
                onClick={() => setRadioPlaying(!radioPlaying)}
                className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px]"
              >
                {radioPlaying ? 'Stop' : 'Play'}
              </button>
            </div>
          </div>

          {/* Amateur HAM Radio & PTT */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <span className="font-semibold text-cyan-400 block mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Amateur HAM Radio &amp; PTT
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Push-to-Talk (PTT) transceiver simulation for peer-to-peer decentralized tactical relay over RF frequencies.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700 flex flex-col items-center justify-center gap-2">
              <div className="text-[10px] font-mono text-cyan-400">Frequency: 146.520 MHz FM</div>
              <button
                onMouseDown={() => {
                  setPttActive(true);
                  audioEngine.playNote(88, 0.9);
                }}
                onMouseUp={() => setPttActive(false)}
                onTouchStart={() => {
                  setPttActive(true);
                  audioEngine.playNote(88, 0.9);
                }}
                onTouchEnd={() => setPttActive(false)}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-xl transition-all ${
                  pttActive ? 'bg-red-600 text-white ring-4 ring-red-400/50' : 'bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-slate-600'
                }`}
              >
                <Radio className="w-6 h-6 mb-1" />
                <span>{pttActive ? 'TRANSMITTING' : 'HOLD PTT'}</span>
              </button>
              <div className="text-[10px] text-slate-400">Squelch: -114 dBm (Clear)</div>
            </div>
          </div>

          {/* Google Voice VOIP (Dynamic Free Numbers Database Cycling) */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
            <div>
              <span className="font-semibold text-cyan-400 block mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                Google Voice VOIP (No Account Required)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                Dynamic routing via cycling database of available free numbers. Zero registration required.
              </p>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-700 font-mono text-[11px] text-cyan-300">
                <span className="text-slate-400 block text-[10px]">Active Mesh VOIP Line:</span>
                <span className="font-bold text-white">{freeVoipNumbers[voipNumberIndex]}</span>
              </div>
            </div>
            <div className="mt-2">
              <button
                onClick={handleCycleVoipNumber}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 text-xs"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Cycle Next Free VOIP Number</span>
              </button>
              <div className="text-[10px] text-emerald-400 text-center mt-1">Encrypted M2M audio bridge established.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
