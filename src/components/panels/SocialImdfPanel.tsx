import React, { useState } from 'react';
import { Users, Building, ShieldCheck, MapPin, Compass, BatteryCharging, Radio, Eye } from 'lucide-react';
import { FriendUser, ImdfFloor } from '../../types';
import { haversineDistanceKm, calculateBearingDegrees } from '../../utils/geoMath';
import { getOrCreateLocalUuid, getLocalCallsign, setLocalCallsign } from '../../utils/storage';
import { audioEngine } from '../../utils/audioEngine';

interface SocialImdfPanelProps {
  friends: FriendUser[];
  activeImdfFloor: number;
  onSelectFloor: (floor: number) => void;
  onLocateFriend: (friend: FriendUser) => void;
  userLat: number;
  userLng: number;
}

export const SocialImdfPanel: React.FC<SocialImdfPanelProps> = ({
  friends,
  activeImdfFloor,
  onSelectFloor,
  onLocateFriend,
  userLat,
  userLng,
}) => {
  const [localCallsign, setCallsignState] = useState(getLocalCallsign());
  const [localUuid] = useState(getOrCreateLocalUuid());
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);

  const handleSaveCallsign = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalCallsign(localCallsign);
    setIsEditingCallsign(false);
  };

  const handleLocate = (friend: FriendUser) => {
    onLocateFriend(friend);
    // Audio chirp for proximity ping
    audioEngine.playNote(72, 0.7);
    audioEngine.triggerBeaconProximity(friend.id, 5);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-200 text-xs">
      {/* 1. Local Device Sovereignty & Friends Roster */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-700/60 pb-1">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Users className="w-3.5 h-3.5" />
            Social Mesh & Friend Locators ({friends.length})
          </span>
        </div>

        {/* Local Sovereign Identity Card */}
        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">{localCallsign} (You)</span>
            </div>
            <button
              onClick={() => setIsEditingCallsign(!isEditingCallsign)}
              className="text-[10px] text-cyan-400 hover:underline"
            >
              {isEditingCallsign ? 'Cancel' : 'Edit Callsign'}
            </button>
          </div>

          {isEditingCallsign ? (
            <form onSubmit={handleSaveCallsign} className="mt-2 flex gap-1">
              <input
                type="text"
                value={localCallsign}
                onChange={(e) => setCallsignState(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-white flex-1"
              />
              <button type="submit" className="bg-cyan-600 px-2 py-0.5 rounded text-white text-[11px]">
                Save
              </button>
            </form>
          ) : (
            <div className="mt-1 font-mono text-[10px] text-slate-400 truncate">
              Local UUID: <span className="text-slate-300">{localUuid}</span>
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {friends.map((friend) => {
            const distKm = haversineDistanceKm(userLat, userLng, friend.lat, friend.lng);
            const distMeters = Math.round(distKm * 1000);
            const bearing = Math.round(calculateBearingDegrees(userLat, userLng, friend.lat, friend.lng));

            return (
              <div
                key={friend.id}
                className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: friend.avatarColor }} />
                    <span className="font-semibold text-white">{friend.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">[{friend.callsign}]</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>
                      {distMeters < 1000 ? `${distMeters}m away` : `${distKm.toFixed(1)}km`} ({bearing}°)
                    </span>
                    <span className="text-cyan-400">ALT {friend.altitude}m</span>
                  </div>
                  {friend.roomName && (
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{friend.roomName}</div>
                  )}
                </div>

                <button
                  onClick={() => handleLocate(friend)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  Locate
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Apple IMDF Indoor Floor Switcher */}
      <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              Apple IMDF Campus Levels
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Floor Slice Mode</span>
          </div>

          <p className="text-[11px] text-slate-300 mb-3">
            Interactive Indoor Mapping Data Format (IMDF) visualization. Slice through architectural floors to view interior beacon anchors.
          </p>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { lvl: 0, label: 'All Levels' },
              { lvl: 1, label: 'L1 Concourse' },
              { lvl: 2, label: 'L2 Skybridge' },
              { lvl: 3, label: 'L3 Flight Deck' },
            ].map(({ lvl, label }) => (
              <button
                key={lvl}
                onClick={() => onSelectFloor(lvl)}
                className={`py-2 px-1 rounded-lg text-center font-medium text-[11px] transition-colors border ${
                  activeImdfFloor === lvl
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 p-2 bg-slate-900/90 rounded border border-slate-700 text-[11px] font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Level:</span>
              <span className="text-white font-semibold">
                {activeImdfFloor === 0 ? 'Full Building' : `Level ${activeImdfFloor}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Indoor Format:</span>
              <span className="text-cyan-400">Apple IMDF v1.0.0</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400">
          UWB precision micro-localization renders interior coordinates down to centimeters.
        </div>
      </div>

      {/* 3. Apple iBeacon & UWB Anchor Array */}
      <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              iBeacon / UWB Anchor Telemetry
            </span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <div className="text-white font-semibold">BCN-ATRIUM-01</div>
                <div className="text-[10px] text-slate-400">Major: 100, Minor: 14</div>
              </div>
              <span className="text-emerald-400 font-bold">-48 dBm</span>
            </div>

            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <div className="text-white font-semibold">BCN-LAB-SKYBRIDGE</div>
                <div className="text-[10px] text-slate-400">Major: 200, Minor: 82</div>
              </div>
              <span className="text-cyan-400 font-bold">-61 dBm</span>
            </div>

            <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <div className="text-white font-semibold">BCN-FLIGHT-DECK</div>
                <div className="text-[10px] text-slate-400">Major: 300, Minor: 05</div>
              </div>
              <span className="text-amber-400 font-bold">-74 dBm</span>
            </div>
          </div>
        </div>

        <div className="p-2 bg-slate-900/90 rounded border border-emerald-500/30 flex items-center gap-2 text-[10px] text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Local UUID Encryption Active — Zero external telemetry transmission.</span>
        </div>
      </div>
    </div>
  );
};
