import { OmniWebApplet, HttpDfsFileNode, GoogleCoFactTelemetry } from '../types';

const OMNI_APPS_STORAGE_KEY = 'terrasphere_omni_webapplets';
const OMNI_GOOGLE_ACCOUNT_KEY = 'terrasphere_google_auth_account';

export const SEED_OMNI_WEBAPPLETS: OmniWebApplet[] = [
  {
    id: 'app-garmin-connect',
    name: 'Garmin Connect',
    domain: 'connect.garmin.com',
    category: 'fitness',
    iconUrl: 'https://static.garmincdn.com/com.garmin.connect/ui/images/brand/garmin-triangle.svg',
    iconBg: '#007cc3',
    description: 'High-precision GNSS breadcrumb synchronization, biometric heart rate & satellite ephemeris telemetry.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['profile', 'email', 'fitness.location.read', 'gnss.ephemeris'],
    lastAccessed: '2 mins ago',
    appUrl: 'https://connect.garmin.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/garmin/gnss_logs',
    badge: 'GNSS Telemetry',
  },
  {
    id: 'app-google-drive',
    name: 'Google Drive & Earth KML',
    domain: 'drive.google.com',
    category: 'productivity',
    iconUrl: 'https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png',
    iconBg: '#0f9d58',
    description: 'Cloud spatial store for KML, GeoJSON tracks, IMDF floorplans and emergency dispatch logs.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['drive.file', 'drive.readonly', 'userinfo.email'],
    lastAccessed: 'Just now',
    appUrl: 'https://drive.google.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/gdrive/spatial_cache',
    badge: 'Cloud Sync',
  },
  {
    id: 'app-spotify-comms',
    name: 'Spotify Soundscape',
    domain: 'open.spotify.com',
    category: 'media',
    iconUrl: 'https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico',
    iconBg: '#1db954',
    description: 'Acoustic background field synthesis, emergency audio broadcasts, and binaural radio streaming.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['user-read-email', 'streaming', 'user-modify-playback-state'],
    lastAccessed: '14 mins ago',
    appUrl: 'https://open.spotify.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/spotify/audio_cache',
    badge: 'Spatial Audio',
  },
  {
    id: 'app-notion-intel',
    name: 'Notion Mission Fieldbook',
    domain: 'notion.so',
    category: 'productivity',
    iconUrl: 'https://www.notion.so/front-static/favicon.ico',
    iconBg: '#000000',
    description: 'Field reconnaissance logs, beacon relay topology documentation, and tactical incident postmortems.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['identity.basic', 'pages.read', 'databases.write'],
    lastAccessed: '1 hour ago',
    appUrl: 'https://notion.so',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/notion/field_notes',
    badge: 'Field Logs',
  },
  {
    id: 'app-figma-imdf',
    name: 'Figma IMDF Vector Studio',
    domain: 'figma.com',
    category: 'geospatial',
    iconUrl: 'https://static.figma.com/app/icon/1/favicon.svg',
    iconBg: '#f24e1e',
    description: 'Apple IMDF architectural blueprint designer, level-by-level zoning, and polygon mesh exporter.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['files:read', 'user:email'],
    lastAccessed: '3 hours ago',
    appUrl: 'https://figma.com',
    isInstalled: false,
    httpdfsMountedPath: '/mnt/httpdfs/figma/floorplan_svg',
    badge: 'Vector IMDF',
  },
  {
    id: 'app-github-mesh',
    name: 'GitHub Mesh Firmware',
    domain: 'github.com',
    category: 'productivity',
    iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
    iconBg: '#24292e',
    description: 'ESP32 & nRF52 BLE relay firmware source repos, Part 15 C15 beacon drivers and D3 mapping algorithms.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['repo:read', 'user:email'],
    lastAccessed: 'Yesterday',
    appUrl: 'https://github.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/github/firmware_bins',
    badge: 'Mesh Driver',
  },
  {
    id: 'app-strava-elevation',
    name: 'Strava Topo Segments',
    domain: 'strava.com',
    category: 'fitness',
    iconUrl: 'https://www.strava.com/favicon.ico',
    iconBg: '#fc4c02',
    description: 'High-gradient mountainous terrain elevation profiles, route heatmaps, and rugged walkway paths.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['activity:read_all', 'profile:read_all'],
    lastAccessed: '5 hours ago',
    appUrl: 'https://strava.com',
    isInstalled: false,
    httpdfsMountedPath: '/mnt/httpdfs/strava/routes_gpx',
    badge: 'Elevation',
  },
  {
    id: 'app-discord-ops',
    name: 'Discord Mesh Comms',
    domain: 'discord.com',
    category: 'social',
    iconUrl: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    iconBg: '#5865f2',
    description: 'Low-latency VOIP channels, amateur HAM digital backflow bridge, and peer coordinate broadcast.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['identify', 'email', 'guilds'],
    lastAccessed: '30 mins ago',
    appUrl: 'https://discord.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/discord/voice_recordings',
    badge: 'VOIP Comms',
  },
  {
    id: 'app-slack-dispatch',
    name: 'Slack Incident Dispatch',
    domain: 'slack.com',
    category: 'social',
    iconUrl: 'https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png',
    iconBg: '#4a154b',
    description: 'Real-time emergency unit alerts, automated webhook dispatches, and hazard remediation logs.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['channels:read', 'chat:write', 'users:read.email'],
    lastAccessed: '4 hours ago',
    appUrl: 'https://slack.com',
    isInstalled: false,
    httpdfsMountedPath: '/mnt/httpdfs/slack/dispatch_webhooks',
    badge: 'Dispatch',
  },
  {
    id: 'app-nest-smarthome',
    name: 'Google Home & Nest Ecosystem',
    domain: 'home.google.com',
    category: 'smarthome',
    iconUrl: 'https://ssl.gstatic.com/images/branding/product/2x/google_home_48dp.png',
    iconBg: '#4285f4',
    description: 'TPM BLE relay constraints, router proximity beacons, smart lock triggers, and CCTV cameras.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['sdm.service', 'pubsub', 'userinfo.email'],
    lastAccessed: '12 mins ago',
    appUrl: 'https://home.google.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/smarthome/event_telemetry',
    badge: 'IoT Hub',
  },
  {
    id: 'app-osm-vector',
    name: 'OpenStreetMap Overpass Geodata',
    domain: 'openstreetmap.org',
    category: 'geospatial',
    iconUrl: 'https://www.openstreetmap.org/assets/favicon-32x32-99b8833cb523684f9acda546a73b4787fa609a35b264e1a7213a84b077da059d.png',
    iconBg: '#7ebc6f',
    description: 'Global crowdsourced building footprints, transit railways, highway vectors, and natural waterway boundaries.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['read_prefs', 'userinfo.email'],
    lastAccessed: '6 hours ago',
    appUrl: 'https://www.openstreetmap.org',
    isInstalled: false,
    httpdfsMountedPath: '/mnt/httpdfs/osm/pbf_extracts',
    badge: 'Vector Map',
  },
  {
    id: 'app-windy-radar',
    name: 'Windy Meteorological Radar',
    domain: 'windy.com',
    category: 'geospatial',
    iconUrl: 'https://www.windy.com/favicon.ico',
    iconBg: '#ff4d4d',
    description: 'ECMWF & GFS atmospheric wind stream vectors, typhoon trajectory prediction, and cloud cover overlays.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['identity', 'email'],
    lastAccessed: '45 mins ago',
    appUrl: 'https://www.windy.com',
    isInstalled: true,
    httpdfsMountedPath: '/mnt/httpdfs/windy/doppler_radars',
    badge: 'Weather Radar',
  },
  {
    id: 'app-uber-transit',
    name: 'Uber Emergency Evacuation Fleet',
    domain: 'uber.com',
    category: 'geospatial',
    iconUrl: 'https://d1a3f4spazzrp4.cloudfront.net/uber-com/1.3.8/d1a3f4spazzrp4.cloudfront.net/images/uber-favicon-32x32.png',
    iconBg: '#000000',
    description: 'Automated evacuation transport dispatch, road closure rerouting, and rendezvous coordinates.',
    authorizedWithGoogle: true,
    userEmail: 'machackabook@gmail.com',
    scopes: ['rides.request', 'profile', 'email'],
    lastAccessed: 'Yesterday',
    appUrl: 'https://uber.com',
    isInstalled: false,
    httpdfsMountedPath: '/mnt/httpdfs/uber/fleet_telemetry',
    badge: 'Evac Fleet',
  },
];

export function getStoredWebApplets(): OmniWebApplet[] {
  const saved = localStorage.getItem(OMNI_APPS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(OMNI_APPS_STORAGE_KEY, JSON.stringify(SEED_OMNI_WEBAPPLETS));
  return SEED_OMNI_WEBAPPLETS;
}

export function saveStoredWebApplets(apps: OmniWebApplet[]): void {
  localStorage.setItem(OMNI_APPS_STORAGE_KEY, JSON.stringify(apps));
}

export function getActiveGoogleAccount(): string {
  const saved = localStorage.getItem(OMNI_GOOGLE_ACCOUNT_KEY);
  return saved || 'machackabook@gmail.com';
}

export function setActiveGoogleAccount(email: string): void {
  localStorage.setItem(OMNI_GOOGLE_ACCOUNT_KEY, email);
}

export function createNewWebAppletFromDomain(domain: string, name?: string): OmniWebApplet {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const title = name || cleanDomain.split('.')[0].toUpperCase();
  const id = `app-custom-${cleanDomain.replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
  
  const newApp: OmniWebApplet = {
    id,
    name: title,
    domain: cleanDomain,
    category: 'productivity',
    iconUrl: `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
    iconBg: '#1e293b',
    description: `Google OAuth certified webapplet for ${cleanDomain}. Sandboxed with HTML5 window container and HTTPDFS mounting.`,
    authorizedWithGoogle: true,
    userEmail: getActiveGoogleAccount(),
    scopes: ['openid', 'email', 'profile'],
    lastAccessed: 'Just now',
    appUrl: `https://${cleanDomain}`,
    isInstalled: true,
    httpdfsMountedPath: `/mnt/httpdfs/${cleanDomain.replace(/[^a-z0-9]/g, '_')}/store`,
    badge: 'Single-Click Added',
  };

  const current = getStoredWebApplets();
  const updated = [newApp, ...current];
  saveStoredWebApplets(updated);
  return newApp;
}

export function getGoogleCoFacts(userEmail: string, friendsCount: number, lat: number, lng: number): GoogleCoFactTelemetry {
  return {
    accountEmail: userEmail,
    verifiedIdentity: true,
    coFactsCount: 14,
    lastSyncTimestamp: new Date().toISOString(),
    syncedFriendsCount: friendsCount,
    activeGnssBeacons: 28,
    geodeticElevationM: 18.4,
    sessionTokenHash: 'SHA256:G_AUTH_' + Math.abs(Math.sin(lat + lng) * 10000000).toFixed(0),
    oauthScopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/fitness.location.read',
      'https://www.googleapis.com/auth/sdm.service',
    ],
  };
}

export function getInitialHttpDfsTree(): HttpDfsFileNode[] {
  return [
    {
      name: 'mnt',
      path: '/mnt',
      type: 'directory',
      lastModified: '2026-10-15 13:00',
      children: [
        {
          name: 'httpdfs',
          path: '/mnt/httpdfs',
          type: 'directory',
          lastModified: '2026-10-15 13:05',
          children: [
            {
              name: 'garmin',
              path: '/mnt/httpdfs/garmin',
              type: 'directory',
              lastModified: '2026-10-15 13:10',
              children: [
                {
                  name: 'gnss_telemetry_stream.bin',
                  path: '/mnt/httpdfs/garmin/gnss_telemetry_stream.bin',
                  type: 'file',
                  sizeBytes: 1048576,
                  lastModified: '2026-10-15 13:30',
                  contentSnippet: '[BINARY_RTK_EPOCH_DATA: L1=1575.42MHz L5=1176.45MHz HDOP=0.65 SATS=28 FIX=3D_RTK]',
                },
                {
                  name: 'garmin_breadcrumb_path.gpx',
                  path: '/mnt/httpdfs/garmin/garmin_breadcrumb_path.gpx',
                  type: 'file',
                  sizeBytes: 49152,
                  lastModified: '2026-10-15 13:28',
                  contentSnippet: '<?xml version="1.0"?><gpx version="1.1"><trk><name>Garmin Field Survey</name></trk></gpx>',
                },
              ],
            },
            {
              name: 'gdrive',
              path: '/mnt/httpdfs/gdrive',
              type: 'directory',
              lastModified: '2026-10-15 13:15',
              children: [
                {
                  name: 'co_facts_telemetry_report.json',
                  path: '/mnt/httpdfs/gdrive/co_facts_telemetry_report.json',
                  type: 'file',
                  sizeBytes: 16384,
                  lastModified: '2026-10-15 13:35',
                  contentSnippet: '{"coFacts": "Find My Hub & Garmin Geonav Telemetry", "verified": true, "author": "machackabook@gmail.com"}',
                },
                {
                  name: 'imdf_campus_level2.geojson',
                  path: '/mnt/httpdfs/gdrive/imdf_campus_level2.geojson',
                  type: 'file',
                  sizeBytes: 131072,
                  lastModified: '2026-10-15 12:45',
                  contentSnippet: '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon"}}]}',
                },
              ],
            },
            {
              name: 'smarthome',
              path: '/mnt/httpdfs/smarthome',
              type: 'directory',
              lastModified: '2026-10-15 13:20',
              children: [
                {
                  name: 'part15_ble_relay_rules.yaml',
                  path: '/mnt/httpdfs/smarthome/part15_ble_relay_rules.yaml',
                  type: 'file',
                  sizeBytes: 8192,
                  lastModified: '2026-10-15 13:18',
                  contentSnippet: 'mesh_mode: part_15_c15\ngatt_auto_rejoin: true\ntpm_rf_pin_relay: enabled',
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
