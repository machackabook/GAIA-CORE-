import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobeStreetScene } from './components/GlobeStreetScene';
import { TopHud } from './components/TopHud';
import { BottomDock, DockTab } from './components/BottomDock';
import { NewsAlertTicker } from './components/NewsAlertTicker';
import {
  SEED_MARKERS,
  SEED_FRIENDS,
  SEED_EMERGENCIES,
  SEED_DISASTER_WARNINGS,
  SEED_TRAFFIC_SEGMENTS,
  SEED_TRAIL_CAMS,
  SEED_NETWORK_NODES,
  SEED_NETWORK_PACKETS,
  SEED_ALERT_RULES,
  SEED_REMEDY_LOG,
  SEED_NEWS_BULLETINS,
  SEED_GPS_BREADCRUMBS,
  SEED_HOME_RULES,
  INITIAL_WEATHER,
  getOrCreateUserProfile,
  saveUserProfile,
} from './utils/storage';
import { encodePlusCode, decodePlusCode, isValidPlusCode } from './utils/plusCodes';
import { audioEngine } from './utils/audioEngine';
import {
  ViewMode,
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
  NewsBulletin,
} from './types';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('globe');
  const [currentLat, setCurrentLat] = useState<number>(37.7749);
  const [currentLng, setCurrentLng] = useState<number>(-122.4194);
  const [currentAltitude, setCurrentAltitude] = useState<number>(18);
  const [plusCode, setPlusCode] = useState<string>(encodePlusCode(37.7749, -122.4194));

  const [profile, setProfile] = useState<UserProfile>(getOrCreateUserProfile);
  const [markers, setMarkers] = useState<MarkerItem[]>(SEED_MARKERS);
  const [activeMarker, setActiveMarker] = useState<MarkerItem | null>(SEED_MARKERS[0]);
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [emergencies, setEmergencies] = useState<EmergencyIncident[]>(SEED_EMERGENCIES);
  const [disasters, setDisasters] = useState<DisasterWarning[]>(SEED_DISASTER_WARNINGS);
  const [trafficSegments, setTrafficSegments] = useState<TrafficSegment[]>(SEED_TRAFFIC_SEGMENTS);
  const [friends, setFriends] = useState<FriendUser[]>(SEED_FRIENDS);
  const [trailCams, setTrailCams] = useState<TrailCam[]>(SEED_TRAIL_CAMS);
  const [networkNodes, setNetworkNodes] = useState<NetworkTelemetry[]>(SEED_NETWORK_NODES);
  const [networkPackets, setNetworkPackets] = useState<NetworkPacket[]>(SEED_NETWORK_PACKETS);
  const [alertRules, setAlertRules] = useState<HeatmapAlertRule[]>(SEED_ALERT_RULES);
  const [remedyLogs, setRemedyLogs] = useState<AutomatedRemedyLog[]>(SEED_REMEDY_LOG);
  const [newsBulletins, setNewsBulletins] = useState<NewsBulletin[]>(SEED_NEWS_BULLETINS);
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState<GpsBreadcrumb[]>(SEED_GPS_BREADCRUMBS);
  const [homeRules, setHomeRules] = useState<GoogleHomeAutomationRule[]>(SEED_HOME_RULES);

  const [sosActive, setSosActive] = useState<boolean>(false);
  const [activeImdfFloor, setActiveImdfFloor] = useState<number>(0);
  const [lightingHue, setLightingHue] = useState<number>(180);
  const [rfScanActive, setRfScanActive] = useState<boolean>(false);
  const [arModeActive, setArModeActive] = useState<boolean>(false);

  // Elevation Profile & Topographic Cross-Section State
  const [elevationPointA, setElevationPointA] = useState<{ lat: number; lng: number; label: string }>({
    lat: 36.2135,
    lng: -112.0581,
    label: 'North Kaibab Trailhead (2,510m)',
  });
  const [elevationPointB, setElevationPointB] = useState<{ lat: number; lng: number; label: string }>({
    lat: 36.0544,
    lng: -112.1401,
    label: 'Bright Angel Trailhead (2,090m)',
  });
  const [isPickingElevationPoint, setIsPickingElevationPoint] = useState<'A' | 'B' | null>(null);
  const [dockActiveTab, setDockActiveTab] = useState<DockTab | undefined>(undefined);

  const handleToggleRfScan = useCallback(() => {
    setRfScanActive((prev) => !prev);
  }, []);

  const handleToggleArMode = useCallback(() => {
    setArModeActive((prev) => !prev);
  }, []);

  const handleOpenElevationProfile = useCallback(() => {
    setDockActiveTab('elevation');
    audioEngine.playNote(74, 0.6);
  }, []);

  const handleFlyToCoordinate = useCallback((lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setViewMode('globe');
    audioEngine.playNote(68, 0.5);
  }, []);

  // Generate dynamic markers combined with friend markers respecting privacy settings
  const allDisplayMarkers = useMemo(() => {
    const friendMarkers: MarkerItem[] = friends
      .filter((f) => {
        const perm = profile.friendPermissions[f.id] || f.privacyLevel;
        return perm !== 'hidden';
      })
      .map((f) => {
        const perm = profile.friendPermissions[f.id] || f.privacyLevel;
        const isApprox = perm === 'approx';
        return {
          id: f.id,
          name: `${f.name} [${f.callsign}]`,
          category: 'friend' as const,
          lat: f.lat + (isApprox ? 0.003 : 0),
          lng: f.lng + (isApprox ? -0.003 : 0),
          altitude: isApprox ? 0 : f.altitude,
          plusCode: f.plusCode,
          color: f.avatarColor,
          status: f.status,
          details: `${f.role} | Battery: ${f.batteryPct}% | Floor: ${f.currentFloor || 1} | Privacy: ${perm.toUpperCase()}`,
        };
      });

    const disasterMarkers: MarkerItem[] = disasters.map((d) => ({
      id: d.id,
      name: `WARNING: ${d.title}`,
      category: 'emergency' as const,
      lat: d.center[0],
      lng: d.center[1],
      altitude: 10,
      plusCode: encodePlusCode(d.center[0], d.center[1]),
      color: '#ef4444',
      details: d.instructions,
    }));

    return [...markers, ...friendMarkers, ...disasterMarkers];
  }, [markers, friends, disasters, profile.friendPermissions]);

  // Periodic offline packet trace stream simulator
  useEffect(() => {
    const protocols: NetworkPacket['protocol'][] = ['MQTT', 'CoAP', 'TCP', 'UDP', 'DNS', 'ICMP'];
    const nodes = ['mesh-node-01', 'mesh-node-02', 'mesh-node-03', 'mesh-node-04'];

    const interval = setInterval(() => {
      const src = nodes[Math.floor(Math.random() * nodes.length)];
      let dst = nodes[Math.floor(Math.random() * nodes.length)];
      while (dst === src) {
        dst = nodes[Math.floor(Math.random() * nodes.length)];
      }

      const proto = protocols[Math.floor(Math.random() * protocols.length)];
      const latMs = src === 'mesh-node-02' ? 70 + Math.floor(Math.random() * 25) : 8 + Math.floor(Math.random() * 15);
      const isCorrupt = Math.random() < 0.08;

      const newPkt: NetworkPacket = {
        id: 'pkt-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toTimeString().split(' ')[0] + '.' + Math.floor(100 + Math.random() * 899),
        sourceNode: src,
        destNode: dst,
        protocol: proto,
        lengthBytes: Math.floor(64 + Math.random() * 1200),
        latencyMs: latMs,
        checksumValid: !isCorrupt,
        payloadSnippet: isCorrupt
          ? '[FRAME_DROPPED: CRC32_MISMATCH 0x' + Math.random().toString(16).substring(2, 6).toUpperCase() + ']'
          : proto === 'MQTT'
          ? '{"sensor":"env_grid","aqi":' + Math.floor(20 + Math.random() * 40) + ',"uv":3}'
          : 'SYNC_BEACON frame=' + Math.floor(Math.random() * 500),
        flag: isCorrupt ? 'CORRUPTED' : latMs > 60 ? 'RETRY' : 'NORMAL',
      };

      setNetworkPackets((prev) => [newPkt, ...prev.slice(0, 49)]);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  // Coordinate selection callback from 3D scene (Globe click or Street click)
  const handleSelectCoordinate = useCallback((lat: number, lng: number, altitude: number, code: string) => {
    // If user is interactive picking Point A or Point B for elevation profile
    if (isPickingElevationPoint === 'A') {
      setElevationPointA({
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        label: `Selected Point A (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
      });
      setIsPickingElevationPoint(null);
      audioEngine.playNote(76, 0.6);
      return;
    }
    if (isPickingElevationPoint === 'B') {
      setElevationPointB({
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        label: `Selected Point B (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
      });
      setIsPickingElevationPoint(null);
      audioEngine.playNote(79, 0.6);
      return;
    }

    setCurrentLat(lat);
    setCurrentLng(lng);
    setCurrentAltitude(altitude);
    setPlusCode(code);

    // Record high-precision Garmin GNSS breadcrumb memory
    const newCrumb: GpsBreadcrumb = {
      id: 'crumb-' + Date.now().toString(36),
      lat,
      lng,
      altitude,
      timestamp: new Date().toTimeString().split(' ')[0],
      speedKmh: Math.round((3.8 + Math.random() * 1.5) * 10) / 10,
      plusCode: code,
      accuracyM: 0.42,
    };
    setGpsBreadcrumbs((prev) => [...prev.slice(-39), newCrumb]);
  }, [isPickingElevationPoint]);

  // Clear GPS breadcrumbs memory
  const handleClearBreadcrumbs = useCallback(() => {
    setGpsBreadcrumbs([]);
    audioEngine.playNote(60, 0.5);
  }, []);

  // Toggle Google Home automation rule
  const handleToggleHomeRule = useCallback((ruleId: string) => {
    setHomeRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  // Test fire Google Home automation rule
  const handleFireHomeRule = useCallback((ruleId: string) => {
    setHomeRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, lastTriggered: new Date().toTimeString().split(' ')[0] }
          : r
      )
    );
  }, []);

  // Handle incoming news bulletin selection from Awatch ticker
  const handleSelectBulletin = useCallback((bulletin: NewsBulletin) => {
    if (bulletin.category === 'wildfire') {
      setCurrentLat(37.8651);
      setCurrentLng(-119.5383);
      setPlusCode(encodePlusCode(37.8651, -119.5383));
      setViewMode('globe');
    } else if (bulletin.category === 'seismic') {
      setCurrentLat(37.7749);
      setCurrentLng(-122.4194);
      setPlusCode(encodePlusCode(37.7749, -122.4194));
      setViewMode('street');
    } else if (bulletin.category === 'geonav') {
      setViewMode('globe');
    }
  }, []);

  // Marker selection callback
  const handleSelectMarker = useCallback((marker: MarkerItem) => {
    setActiveMarker(marker);
    setCurrentLat(marker.lat);
    setCurrentLng(marker.lng);
    setCurrentAltitude(marker.altitude);
    setPlusCode(marker.plusCode);
    audioEngine.playNote(68, 0.7);
  }, []);

  // Add new user marker
  const handleAddMarker = useCallback((marker: MarkerItem) => {
    setMarkers((prev) => [marker, ...prev]);
    setActiveMarker(marker);
    audioEngine.playNote(76, 0.8);
  }, []);

  // Fly to emergency incident
  const handleSelectEmergency = useCallback((incident: EmergencyIncident) => {
    setCurrentLat(incident.lat);
    setCurrentLng(incident.lng);
    setPlusCode(incident.plusCode);
    const matched = markers.find((m) => m.lat === incident.lat);
    if (matched) setActiveMarker(matched);
  }, [markers]);

  // Select disaster warning
  const handleSelectDisaster = useCallback((disaster: DisasterWarning) => {
    setCurrentLat(disaster.center[0]);
    setCurrentLng(disaster.center[1]);
    setPlusCode(encodePlusCode(disaster.center[0], disaster.center[1]));
  }, []);

  // Select traffic segment
  const handleSelectTraffic = useCallback((segment: TrafficSegment) => {
    setCurrentLat(segment.startCoord[0]);
    setCurrentLng(segment.startCoord[1]);
    setPlusCode(encodePlusCode(segment.startCoord[0], segment.startCoord[1]));
    setViewMode('street');
  }, []);

  // Report new incident
  const handleReportIncident = useCallback((incident: EmergencyIncident) => {
    setEmergencies((prev) => [incident, ...prev]);
    const incidentMarker: MarkerItem = {
      id: incident.id,
      name: incident.title,
      category: 'emergency',
      lat: incident.lat,
      lng: incident.lng,
      altitude: 12,
      plusCode: incident.plusCode,
      color: '#ef4444',
      details: incident.description,
    };
    setMarkers((prev) => [incidentMarker, ...prev]);
    setActiveMarker(incidentMarker);
  }, []);

  // Add new friend to roster
  const handleAddFriend = useCallback((newFriend: FriendUser) => {
    setFriends((prev) => [newFriend, ...prev]);
  }, []);

  // Update friend privacy permission
  const handleUpdateFriendPrivacy = useCallback((friendId: string, level: 'exact' | 'approx' | 'hidden') => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        friendPermissions: {
          ...prev.friendPermissions,
          [friendId]: level,
        },
      };
      saveUserProfile(updated);
      return updated;
    });
  }, []);

  // Update profile
  const handleUpdateProfile = useCallback((updated: UserProfile) => {
    setProfile(updated);
    saveUserProfile(updated);
  }, []);

  // Locate friend in 3D
  const handleLocateFriend = useCallback((friend: FriendUser) => {
    setCurrentLat(friend.lat);
    setCurrentLng(friend.lng);
    setCurrentAltitude(friend.altitude);
    setPlusCode(friend.plusCode);

    if (friend.currentFloor) {
      setActiveImdfFloor(friend.currentFloor);
      setViewMode('indoor');
    } else {
      setViewMode('street');
    }
  }, []);

  // Fly camera to Trail Cam Sentinel
  const handleFlyToCam = useCallback((cam: TrailCam) => {
    setCurrentLat(cam.lat);
    setCurrentLng(cam.lng);
    setPlusCode(cam.plusCode);
    setViewMode('street');
  }, []);

  // Network remedy trigger
  const handleTriggerRemedy = useCallback((nodeId: string, remedy: string) => {
    setNetworkNodes((prev) =>
      prev.map((node) => {
        if (node.nodeId === nodeId) {
          return {
            ...node,
            latencyMs: Math.max(5, Math.round(node.latencyMs * 0.45)),
            packetLossPct: 0.0,
            status: 'healthy',
            activeRemedy: remedy,
          };
        }
        return node;
      })
    );

    const logEntry: AutomatedRemedyLog = {
      id: 'rem-' + Date.now().toString(36),
      timestamp: new Date().toTimeString().split(' ')[0],
      triggerCondition: `Manual / Automated Trigger on ${nodeId}`,
      actionTaken: remedy,
      result: 'resolved',
      nodeId,
    };
    setRemedyLogs((prev) => [logEntry, ...prev]);
  }, []);

  // Update alert rule threshold / toggle
  const handleUpdateAlertRule = useCallback((ruleId: string, enabled: boolean, threshold: number) => {
    setAlertRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, autoRemedyEnabled: enabled, threshold } : r))
    );
  }, []);

  // Global search handler (supports Plus Codes, city names, or coordinates)
  const handleSearchQuery = useCallback((query: string) => {
    const clean = query.trim();

    // 1. Check if Plus Code
    if (isValidPlusCode(clean)) {
      const decoded = decodePlusCode(clean);
      if (decoded) {
        setCurrentLat(decoded.latitudeCenter);
        setCurrentLng(decoded.longitudeCenter);
        setPlusCode(clean.toUpperCase());
        setViewMode('globe');
        audioEngine.playNote(80, 0.85);
        return;
      }
    }

    // 2. Check if comma-separated lat, lng
    if (clean.includes(',')) {
      const [latStr, lngStr] = clean.split(',');
      const latNum = parseFloat(latStr.trim());
      const lngNum = parseFloat(lngStr.trim());
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        setCurrentLat(latNum);
        setCurrentLng(lngNum);
        setPlusCode(encodePlusCode(latNum, lngNum));
        setViewMode('globe');
        audioEngine.playNote(80, 0.85);
        return;
      }
    }

    // 3. Check predefined cities / markers
    const lower = clean.toLowerCase();
    const found = allDisplayMarkers.find((m) => m.name.toLowerCase().includes(lower));
    if (found) {
      handleSelectMarker(found);
      return;
    }

    if (lower.includes('tokyo')) {
      setCurrentLat(35.658);
      setCurrentLng(139.7016);
      setPlusCode(encodePlusCode(35.658, 139.7016));
    } else if (lower.includes('geneva') || lower.includes('cern')) {
      setCurrentLat(46.233);
      setCurrentLng(6.0557);
      setPlusCode(encodePlusCode(46.233, 6.0557));
    } else if (lower.includes('yosemite') || lower.includes('sierra')) {
      setCurrentLat(37.8651);
      setCurrentLng(-119.5383);
      setPlusCode(encodePlusCode(37.8651, -119.5383));
    } else if (lower.includes('francisco') || lower.includes('sf')) {
      setCurrentLat(37.7749);
      setCurrentLng(-122.4194);
      setPlusCode(encodePlusCode(37.7749, -122.4194));
    }
  }, [allDisplayMarkers, handleSelectMarker]);

  // SOS Toggle
  const handleToggleSos = useCallback(() => {
    setSosActive((prev) => !prev);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Scene (100vw x 100vh unobstructed) with live overlays */}
      <GlobeStreetScene
        viewMode={viewMode}
        activeMarker={activeMarker}
        allMarkers={allDisplayMarkers}
        weather={weather}
        trafficSegments={trafficSegments}
        disasterWarnings={disasters}
        networkNodes={networkNodes}
        gpsBreadcrumbs={gpsBreadcrumbs}
        friends={friends}
        userLat={currentLat}
        userLng={currentLng}
        activeImdfFloor={activeImdfFloor}
        onSelectCoordinate={handleSelectCoordinate}
        onSelectMarker={handleSelectMarker}
        sosActive={sosActive}
        lightingHue={lightingHue}
        rfScanActive={rfScanActive}
        arModeActive={arModeActive}
        elevationPointA={elevationPointA}
        elevationPointB={elevationPointB}
        isPickingElevationPoint={isPickingElevationPoint}
      />

      {/* Minimal Top Telemetry & View Controls */}
      <TopHud
        currentLat={currentLat}
        currentLng={currentLng}
        currentAltitude={currentAltitude}
        plusCode={plusCode}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onSearchQuery={handleSearchQuery}
        sosActive={sosActive}
        onToggleSos={handleToggleSos}
        arModeActive={arModeActive}
        onToggleArMode={handleToggleArMode}
        elevationProfileActive={dockActiveTab === 'elevation'}
        onOpenElevationProfile={handleOpenElevationProfile}
      />

      {/* Awatch Live News & Emergency Alert Ticker */}
      <NewsAlertTicker
        bulletins={newsBulletins}
        onSelectBulletin={handleSelectBulletin}
      />

      {/* Unified Bottom Control Dock (Zero Viewport Occlusion) */}
      <BottomDock
        markers={markers}
        activeMarker={activeMarker}
        onSelectMarker={handleSelectMarker}
        onAddMarker={handleAddMarker}
        currentLat={currentLat}
        currentLng={currentLng}
        currentAltitude={currentAltitude}
        plusCode={plusCode}
        weather={weather}
        onUpdateWeather={setWeather}
        emergencies={emergencies}
        disasters={disasters}
        trafficSegments={trafficSegments}
        sosActive={sosActive}
        onToggleSos={handleToggleSos}
        onSelectEmergency={handleSelectEmergency}
        onSelectDisaster={handleSelectDisaster}
        onSelectTraffic={handleSelectTraffic}
        onReportIncident={handleReportIncident}
        friends={friends}
        activeImdfFloor={activeImdfFloor}
        onSelectFloor={setActiveImdfFloor}
        onLocateFriend={handleLocateFriend}
        onAddFriend={handleAddFriend}
        onUpdateFriendPrivacy={handleUpdateFriendPrivacy}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        trailCams={trailCams}
        onFlyToCam={handleFlyToCam}
        networkNodes={networkNodes}
        networkPackets={networkPackets}
        alertRules={alertRules}
        remedyLogs={remedyLogs}
        onTriggerRemedy={handleTriggerRemedy}
        onUpdateAlertRule={handleUpdateAlertRule}
        gpsBreadcrumbs={gpsBreadcrumbs}
        onClearBreadcrumbs={handleClearBreadcrumbs}
        homeRules={homeRules}
        onToggleHomeRule={handleToggleHomeRule}
        onFireHomeRule={handleFireHomeRule}
        rfScanActive={rfScanActive}
        onToggleRfScan={handleToggleRfScan}
        elevationPointA={elevationPointA}
        elevationPointB={elevationPointB}
        onChangeElevationPointA={setElevationPointA}
        onChangeElevationPointB={setElevationPointB}
        isPickingElevationPoint={isPickingElevationPoint}
        onSetPickingElevationPoint={setIsPickingElevationPoint}
        onFlyToCoordinate={handleFlyToCoordinate}
        externalActiveTab={dockActiveTab}
      />
    </div>
  );
}
