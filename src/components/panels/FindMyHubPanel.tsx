import React, { useState } from 'react';
import {
  Users,
  Compass,
  Navigation,
  Phone,
  Home,
  MapPin,
  Eye,
  Battery,
  Footprints,
  Satellite,
  Download,
  Trash2,
  CheckCircle2,
  Sparkles,
  Play,
  Zap,
  Store,
} from 'lucide-react';
import {
  FriendUser,
  GpsBreadcrumb,
  GnssStatus,
  GoogleHomeAutomationRule,
} from '../../types';
import { haversineDistanceKm, calculateBearingDegrees } from '../../utils/geoMath';
import { audioEngine } from '../../utils/audioEngine';
import { OmniAppStorePanel } from './OmniAppStorePanel';

interface FindMyHubPanelProps {
  friends: FriendUser[];
  onLocateFriend: (friend: FriendUser) => void;
  gpsBreadcrumbs: GpsBreadcrumb[];
  onClearBreadcrumbs: () => void;
  homeRules: GoogleHomeAutomationRule[];
  onToggleHomeRule: (ruleId: string) => void;
  onFireHomeRule: (ruleId: string) => void;
  userLat: number;
  userLng: number;
  userAltitude: number;
  userPlusCode: string;
}

export const FindMyHubPanel: React.FC<FindMyHubPanelProps> = ({
  friends,
  onLocateFriend,
  gpsBreadcrumbs,
  onClearBreadcrumbs,
  homeRules,
  onToggleHomeRule,
  onFireHomeRule,
  userLat,
  userLng,
  userAltitude,
  userPlusCode,
}) => {
  const [subTab, setSubTab] = useState<'snap_topography' | 'google_omni_appstore' | 'gps_memory' | 'home_automation'>('snap_topography');
  const [selectedFriend, setSelectedFriend] = useState<FriendUser>(friends[0]);
  const [voiceCallActive, setVoiceCallActive] = useState<string | null>(null);
  const [automationFeedback, setAutomationFeedback] = useState<string | null>(null);

  // Garmin-grade GNSS Telemetry status
  const gnss: GnssStatus = {
    constellations: ['GPS (L1/L5 Dual-Band)', 'Galileo (E1/E5a)', 'GLONASS (G1/G2)', 'BeiDou (B1/B2)'],
    satellitesLocked: 28,
    hdop: 0.65,
    precisionM: 0.42,
    elevationAngle: 42.5,
    lockType: '3D_RTK_FIX',
  };

  const handleLocate = (friend: FriendUser) => {
    setSelectedFriend(friend);
    onLocateFriend(friend);
    audioEngine.playNote(72, 0.75);
    audioEngine.triggerBeaconProximity(friend.id, 5);
  };

  const handleSimulateVoiceCall = (friendName: string) => {
    setVoiceCallActive(friendName);
    audioEngine.playNote(80, 0.5);
    setTimeout(() => {
      audioEngine.playNote(80, 0.5);
    }, 400);
    setTimeout(() => {
      setVoiceCallActive(null);
    }, 4000);
  };

  const handleExportGpx = () => {
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="TerraSphere 3D Garmin Engine">\n<trk><name>Traversed GPS Track Memory</name><trkseg>\n`;
    gpsBreadcrumbs.forEach((b) => {
      gpx += `  <trkpt lat="${b.lat}" lon="${b.lng}"><ele>${b.altitude}</ele><time>${b.timestamp}</time><desc>PlusCode: ${b.plusCode}, Speed: ${b.speedKmh}km/h</desc></trkpt>\n`;
    });
    gpx += `</trkseg></trk>\n</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrasphere-garmin-track-${new Date().toISOString().split('T')[0]}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerAutomation = (rule: GoogleHomeAutomationRule) => {
    onFireHomeRule(rule.id);
    setAutomationFeedback(`Executed "${rule.name}": ${rule.actionPayload}`);
    audioEngine.playNote(88, 0.8);
    setTimeout(() => setAutomationFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('snap_topography')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'snap_topography' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Find My / Snap Topography ({friends.length})</span>
          </button>

          <button
            onClick={() => setSubTab('google_omni_appstore')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'google_omni_appstore' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Co-Facts &amp; Omni AppStore</span>
          </button>

          <button
            onClick={() => setSubTab('gps_memory')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'gps_memory' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Garmin GPS Track Memory ({gpsBreadcrumbs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('home_automation')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'home_automation' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Google Home Automation Hooks ({homeRules.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-cyan-400">
          <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-cyan-500/30">
            GNSS Precision: ±{gnss.precisionM}m
          </span>
        </div>
      </div>

      {/* 1. SNAPCHAT / GOOGLE FIND MY FRIENDS TOPOGRAPHY */}
      {subTab === 'snap_topography' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Friend Topography List */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-cyan-400">Peers &amp; Family Topography</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {friends.map((friend) => {
                const distKm = haversineDistanceKm(userLat, userLng, friend.lat, friend.lng);
                const distMeters = Math.round(distKm * 1000);
                const bearing = Math.round(calculateBearingDegrees(userLat, userLng, friend.lat, friend.lng));

                return (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`p-2 rounded-xl cursor-pointer border transition-colors ${
                      selectedFriend.id === friend.id
                        ? 'bg-cyan-950/70 border-cyan-400 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: friend.avatarColor }} />
                        <span className="font-semibold text-white">{friend.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">[{friend.callsign}]</span>
                    </div>

                    {/* Snap Topography Motion Bubble */}
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Footprints className="w-3 h-3" />
                        {distMeters < 1000 ? `${distMeters}m walk` : `${distKm.toFixed(1)}km`} ({bearing}°)
                      </span>
                      <span>ALT: {friend.altitude}m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Proximity & Walkway Triangulation */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            {selectedFriend ? (
              <div>
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
                  <span className="font-semibold text-white">Triangulation: {selectedFriend.name}</span>
                  <span className="font-mono text-cyan-400 text-[10px]">{selectedFriend.plusCode}</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Designated Walkway:</span>
                    <span className="text-emerald-400 font-semibold">Transit Plaza Corridor A</span>
                  </div>

                  <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Triangulation Lock:</span>
                    <span className="text-cyan-400 font-bold">LOCKED (3-Point Beacon Arc)</span>
                  </div>

                  <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Current Velocity:</span>
                    <span className="text-white">4.4 km/h (Walking)</span>
                  </div>

                  <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Google Voice ID:</span>
                    <span className="text-slate-300">gv-{selectedFriend.callsign.toLowerCase()}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex gap-1.5">
                  <button
                    onClick={() => handleLocate(selectedFriend)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-1 rounded font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Fly Camera in 3D</span>
                  </button>

                  <button
                    onClick={() => handleSimulateVoiceCall(selectedFriend.name)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors"
                    title="Simulate Google Voice Contact Handshake"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voice</span>
                  </button>
                </div>

                {voiceCallActive && (
                  <div className="mt-1.5 p-1 bg-emerald-950 border border-emerald-500 rounded text-center text-[10px] text-emerald-300 animate-none">
                    Connecting Google Voice relay to {voiceCallActive}...
                  </div>
                )}
              </div>
            ) : null}

            <div className="text-[10px] text-slate-400 mt-2">
              Triangulation computes vector bearing and pedestrian walkway elevation in real-time.
            </div>
          </div>

          {/* People Finder / Share With Me Rules */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-cyan-400 block mb-2 border-b border-slate-700/60 pb-1">
                Google People Finder &amp; Share With Me
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Decentralized People Finder protocol allows finding designated contacts during regional network outages or disaster evacuations.
              </p>

              <div className="p-2 bg-slate-900 rounded border border-slate-700 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Share With Me:</span>
                  <span className="text-emerald-400 font-semibold">Active (Mutual Roster)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plus Code Beacon:</span>
                  <span className="text-white">{userPlusCode}</span>
                </div>
              </div>
            </div>

            <div className="p-2 bg-emerald-950/60 rounded border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Offline People Finder cache verified across local mesh.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. GOOGLE ACCOUNT CO-FACTS & OMNI APPSTORE ECOSYSTEM */}
      {subTab === 'google_omni_appstore' && (
        <OmniAppStorePanel
          userLat={userLat}
          userLng={userLng}
          userAltitude={userAltitude}
          userPlusCode={userPlusCode}
          friendsCount={friends.length}
        />
      )}

      {/* 3. GARMIN-GRADE PRECISION GPS & TRACK MEMORY */}
      {subTab === 'gps_memory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Garmin GNSS Receiver Overview */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-cyan-400 block mb-2 border-b border-slate-700/60 pb-1">
                Garmin High-Precision GNSS
              </span>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Fix State:</span>
                  <span className="text-emerald-400 font-bold">{gnss.lockType}</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Satellites Locked:</span>
                  <span className="text-white font-bold">{gnss.satellitesLocked} Constellations</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">HDOP Precision:</span>
                  <span className="text-emerald-400">{gnss.hdop} (Ideal)</span>
                </div>
                <div className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between">
                  <span className="text-slate-400">Radial Error:</span>
                  <span className="text-white">±{gnss.precisionM} m</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-2">
              Dual-frequency L1/L5 carrier tracking eliminates ionospheric distortion globally.
            </div>
          </div>

          {/* Breadcrumb Path Memory Log */}
          <div className="md:col-span-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
                <span className="font-semibold text-white">Traversed GPS Location Memory ({gpsBreadcrumbs.length} nodes)</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleExportGpx}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export GPX</span>
                  </button>
                  <button
                    onClick={onClearBreadcrumbs}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white font-mono text-[10px] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 font-mono text-[11px]">
                {gpsBreadcrumbs.map((crumb) => (
                  <div
                    key={crumb.id}
                    className="p-1.5 bg-slate-900 rounded border border-slate-700 flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{crumb.plusCode}</span>
                      <span className="text-slate-400">{crumb.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span>ALT: {crumb.altitude}m</span>
                      <span>SPD: {crumb.speedKmh} km/h</span>
                      <span className="text-emerald-400">±{crumb.accuracyM}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-2">
              GPS track log renders as a 3D neon breadcrumb trail directly onto the Earth sphere and street level.
            </div>
          </div>
        </div>
      )}

      {/* 3. GOOGLE HOME AUTOMATION HOOKS */}
      {subTab === 'home_automation' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="font-semibold text-cyan-400 block mb-2 border-b border-slate-700/60 pb-1">
              Google Home Automation Proximity Hooks
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {homeRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-2 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between text-[11px]"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{rule.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {rule.triggerType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Target: {rule.targetDevice} | Action: {rule.actionPayload}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTriggerAutomation(rule)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-cyan-300 rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
                      title="Test Fire Automation Hook"
                    >
                      <Play className="w-3 h-3" />
                      <span>Test Fire</span>
                    </button>

                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => onToggleHomeRule(rule.id)}
                      className="rounded accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>

            {automationFeedback && (
              <div className="mt-2 p-1.5 bg-emerald-950 border border-emerald-500 rounded text-[11px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{automationFeedback}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-white block mb-2 border-b border-slate-700/60 pb-1">
                Google Home Hub Gateway
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Automated geofencing triggers local Matter / Thread smart home device protocols when entering GPS proximity or responding to environmental emergency alerts.
              </p>
            </div>

            <div className="p-2 bg-slate-900 rounded border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 mt-2">
              <Zap className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              <span>Matter 1.3 / Thread Local Mesh Bridge Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
