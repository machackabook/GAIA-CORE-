import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  CloudSun,
  AlertTriangle,
  Users,
  Camera,
  Network,
  Music,
  Brain,
  UserCheck,
  Satellite,
  Tv,
  Store,
  Headphones,
  Mountain,
} from 'lucide-react';
import { NavigationPanel } from './panels/NavigationPanel';
import { WeatherPanel } from './panels/WeatherPanel';
import { EmergencyPanel } from './panels/EmergencyPanel';
import { SocialImdfPanel } from './panels/SocialImdfPanel';
import { TrailCamsPanel } from './panels/TrailCamsPanel';
import { NetworkDiagnosticsPanel } from './panels/NetworkDiagnosticsPanel';
import { MidiSpatialPanel } from './panels/MidiSpatialPanel';
import { AiRoutingPanel } from './panels/AiRoutingPanel';
import { UserProfilePanel } from './panels/UserProfilePanel';
import { FindMyHubPanel } from './panels/FindMyHubPanel';
import { AWATCHNewsPanel } from './panels/AWATCHNewsPanel';
import { OmniAppStorePanel } from './panels/OmniAppStorePanel';
import { SpatialAudioSettingsPanel } from './panels/SpatialAudioSettingsPanel';
import { ElevationProfilePanel } from './panels/ElevationProfilePanel';
import {
  MarkerItem,
  WeatherData,
  EmergencyIncident,
  DisasterWarning,
  TrafficSegment,
  FriendUser,
  TrailCam,
  NetworkTelemetry,
  NetworkPacket,
  HeatmapAlertRule,
  AutomatedRemedyLog,
  UserProfile,
  GpsBreadcrumb,
  GoogleHomeAutomationRule,
} from '../types';

export type DockTab =
  | 'network'
  | 'elevation'
  | 'findmy'
  | 'emergency'
  | 'profile'
  | 'social'
  | 'nav'
  | 'weather'
  | 'trailcams'
  | 'midi'
  | 'ai'
  | 'awatch'
  | 'omniappstore'
  | 'spatial_audio';

interface BottomDockProps {
  markers: MarkerItem[];
  activeMarker: MarkerItem | null;
  onSelectMarker: (marker: MarkerItem) => void;
  onAddMarker: (marker: MarkerItem) => void;
  currentLat: number;
  currentLng: number;
  currentAltitude: number;
  plusCode: string;
  weather: WeatherData;
  onUpdateWeather: (w: WeatherData) => void;
  emergencies: EmergencyIncident[];
  disasters: DisasterWarning[];
  trafficSegments: TrafficSegment[];
  sosActive: boolean;
  onToggleSos: () => void;
  onSelectEmergency: (e: EmergencyIncident) => void;
  onSelectDisaster: (d: DisasterWarning) => void;
  onSelectTraffic: (t: TrafficSegment) => void;
  onReportIncident: (i: EmergencyIncident) => void;
  friends: FriendUser[];
  activeImdfFloor: number;
  onSelectFloor: (f: number) => void;
  onLocateFriend: (f: FriendUser) => void;
  onAddFriend: (f: FriendUser) => void;
  onUpdateFriendPrivacy: (friendId: string, level: 'exact' | 'approx' | 'hidden') => void;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  trailCams: TrailCam[];
  onFlyToCam: (c: TrailCam) => void;
  networkNodes: NetworkTelemetry[];
  networkPackets: NetworkPacket[];
  alertRules: HeatmapAlertRule[];
  remedyLogs: AutomatedRemedyLog[];
  onTriggerRemedy: (nodeId: string, remedy: string) => void;
  onUpdateAlertRule: (ruleId: string, enabled: boolean, threshold: number) => void;
  gpsBreadcrumbs: GpsBreadcrumb[];
  onClearBreadcrumbs: () => void;
  homeRules: GoogleHomeAutomationRule[];
  onToggleHomeRule: (ruleId: string) => void;
  onFireHomeRule: (ruleId: string) => void;
  rfScanActive: boolean;
  onToggleRfScan: () => void;
  elevationPointA: { lat: number; lng: number; label: string };
  elevationPointB: { lat: number; lng: number; label: string };
  onChangeElevationPointA: (pt: { lat: number; lng: number; label: string }) => void;
  onChangeElevationPointB: (pt: { lat: number; lng: number; label: string }) => void;
  isPickingElevationPoint: 'A' | 'B' | null;
  onSetPickingElevationPoint: (target: 'A' | 'B' | null) => void;
  onFlyToCoordinate?: (lat: number, lng: number) => void;
  externalActiveTab?: DockTab;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  markers,
  activeMarker,
  onSelectMarker,
  onAddMarker,
  currentLat,
  currentLng,
  currentAltitude,
  plusCode,
  weather,
  onUpdateWeather,
  emergencies,
  disasters,
  trafficSegments,
  sosActive,
  onToggleSos,
  onSelectEmergency,
  onSelectDisaster,
  onSelectTraffic,
  onReportIncident,
  friends,
  activeImdfFloor,
  onSelectFloor,
  onLocateFriend,
  onAddFriend,
  onUpdateFriendPrivacy,
  profile,
  onUpdateProfile,
  trailCams,
  onFlyToCam,
  networkNodes,
  networkPackets,
  alertRules,
  remedyLogs,
  onTriggerRemedy,
  onUpdateAlertRule,
  gpsBreadcrumbs,
  onClearBreadcrumbs,
  homeRules,
  onToggleHomeRule,
  onFireHomeRule,
  rfScanActive,
  onToggleRfScan,
  elevationPointA,
  elevationPointB,
  onChangeElevationPointA,
  onChangeElevationPointB,
  isPickingElevationPoint,
  onSetPickingElevationPoint,
  onFlyToCoordinate,
  externalActiveTab,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<DockTab>('network');

  // Synchronize when externalActiveTab changes (e.g., from TopHud)
  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab);
      setIsCollapsed(false);
    }
  }, [externalActiveTab]);

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tabs: { id: DockTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'elevation',
      label: 'Elevation Cross-Section',
      icon: <Mountain className="w-3.5 h-3.5 text-emerald-400" />,
      badge: 'Profile & Slope',
    },
    {
      id: 'network',
      label: 'Offline Network Analysis',
      icon: <Network className="w-3.5 h-3.5" />,
      badge: networkNodes.some((n) => n.status === 'degraded') ? 'Alert' : undefined,
    },
    {
      id: 'findmy',
      label: 'Find My & Garmin Hub',
      icon: <Satellite className="w-3.5 h-3.5" />,
      badge: `${friends.length} Peers`,
    },
    {
      id: 'omniappstore',
      label: 'Omni AppStore & Co-Facts',
      icon: <Store className="w-3.5 h-3.5 text-amber-400" />,
      badge: 'Google Auth',
    },
    {
      id: 'profile',
      label: 'Profile & Privacy',
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'emergency',
      label: 'Emergency & Traffic Alerts',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      badge: (emergencies.length + disasters.length).toString(),
    },
    { id: 'social', label: 'Friends & Apple IMDF', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'nav', label: 'Navigation & Plus Codes', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'weather', label: 'Weather & Climate', icon: <CloudSun className="w-3.5 h-3.5" /> },
    { id: 'trailcams', label: 'Trail Cams & Wildfires', icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'midi', label: 'BLE MIDI & Audio Synth', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'spatial_audio', label: 'Spatial Audio Settings', icon: <Headphones className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'ai', label: 'Multimodal AI Routing', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'awatch', label: 'AWATCH News & Live Video', icon: <Tv className="w-3.5 h-3.5 text-cyan-400" /> },
  ];

  return (
    <div
      className="fixed z-30 transition-transform duration-300 ease-out"
      style={{
        bottom: '16px',
        left: '50%',
        transform: isCollapsed ? 'translate(-50%, calc(100% - 38px))' : 'translate(-50%, 0)',
        width: 'min(980px, 96vw)',
      }}
    >
      {/* Dock Container */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Dock Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800">
          {/* Tab Navigation Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    if (isCollapsed) setIsCollapsed(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-600 text-white font-bold leading-none">
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors flex-shrink-0 ml-2"
            title="Press H to toggle controls"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hide (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className={`p-4 max-h-[350px] overflow-y-auto ${isCollapsed ? 'hidden' : 'block'}`}>
          {activeTab === 'elevation' && (
            <ElevationProfilePanel
              currentLat={currentLat}
              currentLng={currentLng}
              pointA={elevationPointA}
              pointB={elevationPointB}
              onChangePointA={onChangeElevationPointA}
              onChangePointB={onChangeElevationPointB}
              isPickingPoint={isPickingElevationPoint}
              onSetPickingPoint={onSetPickingElevationPoint}
              onFlyToCoordinate={onFlyToCoordinate}
            />
          )}

          {activeTab === 'network' && (
            <NetworkDiagnosticsPanel
              nodes={networkNodes}
              packets={networkPackets}
              alertRules={alertRules}
              remedyLogs={remedyLogs}
              onTriggerRemedy={onTriggerRemedy}
              onUpdateAlertRule={onUpdateAlertRule}
              rfScanActive={rfScanActive}
              onToggleRfScan={onToggleRfScan}
            />
          )}

          {activeTab === 'findmy' && (
            <FindMyHubPanel
              friends={friends}
              onLocateFriend={onLocateFriend}
              gpsBreadcrumbs={gpsBreadcrumbs}
              onClearBreadcrumbs={onClearBreadcrumbs}
              homeRules={homeRules}
              onToggleHomeRule={onToggleHomeRule}
              onFireHomeRule={onFireHomeRule}
              userLat={currentLat}
              userLng={currentLng}
              userAltitude={currentAltitude}
              userPlusCode={plusCode}
            />
          )}

          {activeTab === 'profile' && (
            <UserProfilePanel
              profile={profile}
              friends={friends}
              onUpdateProfile={onUpdateProfile}
              onAddFriend={onAddFriend}
              onUpdateFriendPrivacy={onUpdateFriendPrivacy}
              currentLat={currentLat}
              currentLng={currentLng}
              currentAltitude={currentAltitude}
              currentPlusCode={plusCode}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyPanel
              emergencies={emergencies}
              disasters={disasters}
              trafficSegments={trafficSegments}
              sosActive={sosActive}
              onToggleSos={onToggleSos}
              onSelectEmergency={onSelectEmergency}
              onSelectDisaster={onSelectDisaster}
              onSelectTraffic={onSelectTraffic}
              onReportIncident={onReportIncident}
              currentLat={currentLat}
              currentLng={currentLng}
              currentPlusCode={plusCode}
            />
          )}

          {activeTab === 'social' && (
            <SocialImdfPanel
              friends={friends}
              activeImdfFloor={activeImdfFloor}
              onSelectFloor={onSelectFloor}
              onLocateFriend={onLocateFriend}
              userLat={currentLat}
              userLng={currentLng}
            />
          )}

          {activeTab === 'nav' && (
            <NavigationPanel
              markers={markers}
              activeMarker={activeMarker}
              onSelectMarker={onSelectMarker}
              onAddMarker={onAddMarker}
              currentLat={currentLat}
              currentLng={currentLng}
              currentAltitude={currentAltitude}
              plusCode={plusCode}
            />
          )}

          {activeTab === 'weather' && <WeatherPanel weather={weather} onUpdateWeather={onUpdateWeather} />}

          {activeTab === 'trailcams' && <TrailCamsPanel cams={trailCams} onFlyToCam={onFlyToCam} />}

          {activeTab === 'midi' && <MidiSpatialPanel />}

          {activeTab === 'ai' && <AiRoutingPanel weather={weather} emergencies={emergencies} />}

          {activeTab === 'awatch' && <AWATCHNewsPanel currentLat={currentLat} currentLng={currentLng} />}

          {activeTab === 'omniappstore' && (
            <OmniAppStorePanel
              userLat={currentLat}
              userLng={currentLng}
              userAltitude={currentAltitude}
              userPlusCode={plusCode}
              friendsCount={friends.length}
            />
          )}

          {activeTab === 'spatial_audio' && <SpatialAudioSettingsPanel />}
        </div>
      </div>
    </div>
  );
};
