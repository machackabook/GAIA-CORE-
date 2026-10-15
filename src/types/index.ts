export type ViewMode = 'globe' | 'street' | 'indoor' | 'orbit';

export interface GeoCoordinate {
  lat: number;
  lng: number;
  altitude: number; // in meters
}

export interface MarkerItem {
  id: string;
  name: string;
  category: 'friend' | 'emergency' | 'trailcam' | 'network' | 'poi' | 'custom' | 'traffic';
  lat: number;
  lng: number;
  altitude: number;
  plusCode: string;
  details?: string;
  status?: string;
  icon?: string;
  color?: string;
}

export interface WeatherData {
  city: string;
  lat: number;
  lng: number;
  temperature: number; // Celsius
  condition: 'Sunny' | 'Partly Cloudy' | 'Rain' | 'Snow' | 'Storm' | 'Fog';
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: string;
  pressure: number; // hPa
  uvIndex: number;
  aqi: number; // Air quality index
  precipitationProbability: number;
}

export interface EmergencyIncident {
  id: string;
  title: string;
  type: 'traffic_accident' | 'wildfire' | 'seismic' | 'flood' | 'medical';
  severity: 'critical' | 'high' | 'moderate' | 'low';
  lat: number;
  lng: number;
  plusCode: string;
  reportedTime: string;
  status: 'active' | 'responding' | 'contained' | 'resolved';
  etaMinutes: number;
  description: string;
  unitsDispatched: string[];
  trafficImpact: 'none' | 'lane_closed' | 'road_blocked' | 'full_detour';
  evacuationZoneRadiusKm?: number;
}

export interface DisasterWarning {
  id: string;
  title: string;
  type: 'wildfire' | 'earthquake' | 'flash_flood' | 'severe_storm' | 'tsunami';
  severity: 'advisory' | 'warning' | 'emergency';
  radiusKm: number;
  center: [number, number]; // lat, lng
  evacuationRoute: string;
  issuedAt: string;
  instructions: string;
  shelterLocations: { name: string; plusCode: string; capacity: number }[];
}

export interface TrafficSegment {
  id: string;
  roadName: string;
  congestionLevel: 'free_flow' | 'moderate' | 'heavy' | 'closed';
  avgSpeedKmh: number;
  speedLimitKmh: number;
  startCoord: [number, number];
  endCoord: [number, number];
  closureReason?: string;
  incidentId?: string;
}

export interface UserProfile {
  uuid: string;
  plusCode: string;
  callsign: string;
  displayName: string;
  role: string;
  avatarColor: string;
  bio: string;
  joinedDate: string;
  privacySetting: 'public_mesh' | 'friends_only' | 'stealth_ghost' | 'sos_only';
  stealthExpiresAt: number | null; // epoch ms for temporary ghost mode
  shareAltitude: boolean;
  sharePrecision: 'exact' | 'grid_approx' | 'none';
  friendPermissions: Record<string, 'exact' | 'approx' | 'hidden'>;
}

export interface FriendUser {
  id: string;
  name: string;
  callsign: string;
  role: string;
  avatarColor: string;
  lat: number;
  lng: number;
  altitude: number;
  plusCode: string;
  currentFloor?: number;
  roomName?: string;
  isSharing: boolean;
  lastPing: string;
  status: 'active' | 'exploring' | 'stationary' | 'sos';
  batteryPct: number;
  privacyLevel: 'exact' | 'approx' | 'hidden';
}

export interface ImdfFloor {
  level: number;
  name: string;
  description: string;
  rooms: {
    id: string;
    name: string;
    type: 'concourse' | 'lab' | 'office' | 'server' | 'rest' | 'security';
    occupancy: number;
    beaconUuid: string;
  }[];
}

export interface TrailCam {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  plusCode: string;
  status: 'online' | 'warning' | 'alert';
  temperature: number;
  humidity: number;
  smokeLevelPpm: number;
  windSpeed: number;
  fireRiskScore: number; // 0 - 100
  feedMode: 'visible' | 'thermal_ir' | 'motion_track';
  detections: string[];
}

export interface NetworkPacket {
  id: string;
  timestamp: string;
  sourceNode: string;
  destNode: string;
  protocol: 'DNS' | 'MQTT' | 'CoAP' | 'TCP' | 'UDP' | 'ICMP';
  lengthBytes: number;
  latencyMs: number;
  checksumValid: boolean;
  payloadSnippet: string;
  flag: 'NORMAL' | 'RETRY' | 'CORRUPTED' | 'CONGESTION';
}

export interface HardwareSensorDiagnostics {
  batteryHealthPct: number;
  txPowerDbm: number;
  freqDriftPpm: number;
  vswr: number; // Voltage Standing Wave Ratio (< 1.5 optimal)
  voltageV: number;
  ambientNoiseFloorDbm: number;
  uptimeHours: number;
}

export interface AutomatedRemedyLog {
  id: string;
  timestamp: string;
  triggerCondition: string;
  actionTaken: string;
  result: 'resolved' | 'monitoring' | 'escalated';
  nodeId: string;
}

export interface NetworkTelemetry {
  nodeId: string;
  region: string;
  lat: number;
  lng: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  throughputMbps: number;
  rssiDb: number;
  hardwareTempC: number;
  status: 'healthy' | 'degraded' | 'critical';
  activeRemedy: string | null;
  hardware: HardwareSensorDiagnostics;
}

export interface HeatmapAlertRule {
  id: string;
  name: string;
  metric: 'latency' | 'packetLoss' | 'hardwareTemp' | 'vswr';
  threshold: number;
  severity: 'warning' | 'critical';
  autoRemedyEnabled: boolean;
  remedyAction: string;
}

export interface MidiNoteEvent {
  note: number;
  velocity: number;
  channel: number;
}

export interface GpsBreadcrumb {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  timestamp: string;
  speedKmh: number;
  plusCode: string;
  accuracyM: number;
}

export interface GnssStatus {
  constellations: string[];
  satellitesLocked: number;
  hdop: number;
  precisionM: number;
  elevationAngle: number;
  lockType: '3D_RTK_FIX' | 'DGPS' | '3D_FIX';
}

export interface NewsBulletin {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  category: 'seismic' | 'wildfire' | 'severe_weather' | 'network' | 'humanitarian' | 'geonav';
  severity: 'flash' | 'urgent' | 'advisory';
  geoTag: string;
  content: string;
}

export interface FriendTopography {
  speed: number;
  motionState: 'walking' | 'biking' | 'driving' | 'stationary';
  walkwayDistanceMeters: number;
  nearestWalkway: string;
  triangulationStatus: 'locked' | 'triangulating' | 'low_rssi';
  snapStatus: string;
  googleVoiceContactId?: string;
}

export interface GoogleHomeAutomationRule {
  id: string;
  name: string;
  triggerType: 'proximity_arrival' | 'proximity_departure' | 'hazard_alert';
  targetDevice: string;
  actionPayload: string;
  enabled: boolean;
  lastTriggered: string | null;
}

export interface OmniWebApplet {
  id: string;
  name: string;
  domain: string;
  category: 'productivity' | 'geospatial' | 'social' | 'smarthome' | 'fitness' | 'media';
  iconUrl: string;
  iconBg: string;
  description: string;
  authorizedWithGoogle: boolean;
  userEmail: string;
  scopes: string[];
  lastAccessed: string;
  appUrl: string;
  isInstalled: boolean;
  httpdfsMountedPath: string;
  badge?: string;
}

export interface HttpDfsFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  sizeBytes?: number;
  lastModified: string;
  contentSnippet?: string;
  children?: HttpDfsFileNode[];
}

export interface GoogleCoFactTelemetry {
  accountEmail: string;
  verifiedIdentity: boolean;
  coFactsCount: number;
  lastSyncTimestamp: string;
  syncedFriendsCount: number;
  activeGnssBeacons: number;
  geodeticElevationM: number;
  sessionTokenHash: string;
  oauthScopes: string[];
}

export interface ElevationProfilePoint {
  distanceKm: number;
  distanceMiles: number;
  elevationM: number;
  elevationFt: number;
  lat: number;
  lng: number;
  slopePct: number;
  terrainType: string;
}

export interface ElevationProfileData {
  pointA: { lat: number; lng: number; altitude: number; label: string };
  pointB: { lat: number; lng: number; altitude: number; label: string };
  totalDistanceKm: number;
  totalDistanceMiles: number;
  bearingDeg: number;
  bearingCardinal: string;
  peakElevationM: number;
  peakElevationFt: number;
  peakDistanceKm: number;
  peakCoordinate: { lat: number; lng: number };
  minElevationM: number;
  minElevationFt: number;
  minDistanceKm: number;
  minCoordinate: { lat: number; lng: number };
  elevationGainM: number;
  elevationLossM: number;
  avgSlopePct: number;
  maxUphillSlopePct: number;
  maxDownhillSlopePct: number;
  ruggednessClass: string;
  estimatedHikeHours: number;
  points: ElevationProfilePoint[];
}


