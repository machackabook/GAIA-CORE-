import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createProceduralEarthTexture,
  createProceduralEarthBumpMap,
  createProceduralEarthRoughnessMap,
  createProceduralCloudsTexture,
  createCompositeBuilding,
  createCompositeVehicle,
  createCompositeTree,
  createCompositeTrailCamTower,
  createCompositeImdfCampus,
  createCompositeEmergencyBeacon,
  create3DTrafficSegmentMesh,
  create3DDisasterZoneMesh,
  create3DNetworkMeshArc,
  createAuroraBorealisCurtains,
  createGpsBreadcrumbTrackMesh,
  createTriangulationWalkwayMesh,
  create3DVolumetricAudioHeatmapMesh,
  createRadioFrequencyWaterfallMesh,
  _vec3A,
  _vec3B,
  _vec3C,
} from '../utils/proceduralAssets';
import { latLngToVector3, vector3ToLatLng, GLOBE_RADIUS } from '../utils/geoMath';
import { encodePlusCode } from '../utils/plusCodes';
import { audioEngine } from '../utils/audioEngine';
import { interpolateGreatCirclePoint, getEarthTopographicElevation } from '../utils/elevationProfile';
import {
  ViewMode,
  MarkerItem,
  WeatherData,
  TrafficSegment,
  DisasterWarning,
  NetworkTelemetry,
  GpsBreadcrumb,
  FriendUser,
} from '../types';

interface GlobeStreetSceneProps {
  viewMode: ViewMode;
  activeMarker: MarkerItem | null;
  allMarkers: MarkerItem[];
  weather: WeatherData;
  trafficSegments: TrafficSegment[];
  disasterWarnings: DisasterWarning[];
  networkNodes: NetworkTelemetry[];
  gpsBreadcrumbs: GpsBreadcrumb[];
  friends: FriendUser[];
  userLat: number;
  userLng: number;
  activeImdfFloor: number;
  onSelectCoordinate: (lat: number, lng: number, altitude: number, plusCode: string) => void;
  onSelectMarker: (marker: MarkerItem) => void;
  sosActive: boolean;
  lightingHue: number;
  rfScanActive?: boolean;
  arModeActive?: boolean;
  elevationPointA?: { lat: number; lng: number; label: string };
  elevationPointB?: { lat: number; lng: number; label: string };
  isPickingElevationPoint?: 'A' | 'B' | null;
}

export const GlobeStreetScene: React.FC<GlobeStreetSceneProps> = ({
  viewMode,
  activeMarker,
  allMarkers,
  weather,
  trafficSegments,
  disasterWarnings,
  networkNodes,
  gpsBreadcrumbs,
  friends,
  userLat,
  userLng,
  activeImdfFloor,
  onSelectCoordinate,
  onSelectMarker,
  sosActive,
  lightingHue,
  rfScanActive = false,
  arModeActive = false,
  elevationPointA,
  elevationPointB,
  isPickingElevationPoint = null,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Groups
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const streetGroupRef = useRef<THREE.Group | null>(null);
  const imdfCampusGroupRef = useRef<THREE.Group | null>(null);
  const vehiclesRef = useRef<THREE.Group[]>([]);
  const weatherParticlesRef = useRef<THREE.Points | null>(null);
  const markerMeshesRef = useRef<THREE.Group[]>([]);
  const trafficMeshesRef = useRef<THREE.Group[]>([]);
  const disasterMeshesRef = useRef<THREE.Group[]>([]);
  const networkArcMeshesRef = useRef<THREE.Object3D[]>([]);
  const auroraCurtainsRef = useRef<THREE.Group | null>(null);
  const breadcrumbsMeshRef = useRef<THREE.Group | null>(null);
  const triangulationMeshesRef = useRef<THREE.Object3D[]>([]);
  const audioHeatmapMeshRef = useRef<THREE.Group | null>(null);
  const rfWaterfallMeshRef = useRef<THREE.Group | null>(null);
  const elevationTransectMeshRef = useRef<THREE.Group | null>(null);

  // Camera glide targets
  const targetCamPos = useRef(new THREE.Vector3(0, 20, 80));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Store latest props in refs to avoid re-initializing WebGL on state updates
  const propsRef = useRef({
    viewMode,
    activeMarker,
    allMarkers,
    weather,
    trafficSegments,
    disasterWarnings,
    networkNodes,
    gpsBreadcrumbs,
    friends,
    userLat,
    userLng,
    activeImdfFloor,
    onSelectCoordinate,
    onSelectMarker,
    sosActive,
    lightingHue,
  });

  useEffect(() => {
    propsRef.current = {
      viewMode,
      activeMarker,
      allMarkers,
      weather,
      trafficSegments,
      disasterWarnings,
      networkNodes,
      gpsBreadcrumbs,
      friends,
      userLat,
      userLng,
      activeImdfFloor,
      onSelectCoordinate,
      onSelectMarker,
      sosActive,
      lightingHue,
    };
  }, [
    viewMode,
    activeMarker,
    allMarkers,
    weather,
    trafficSegments,
    disasterWarnings,
    networkNodes,
    gpsBreadcrumbs,
    friends,
    userLat,
    userLng,
    activeImdfFloor,
    onSelectCoordinate,
    onSelectMarker,
    sosActive,
    lightingHue,
  ]);

  // Main WebGL Scene Initialization (once on mount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050a14);
    scene.fog = new THREE.FogExp2(0x050a14, 0.0035);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(0, 25, 85);
    cameraRef.current = camera;

    // 2. Renderer Setup with PBR & ACES Filmic Tone Mapping
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (RoomEnvironment + PMREMGenerator)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Lighting Rig (3-Point Studio Rig with Warm Key & Cool Hemisphere)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(50, 80, 40);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 250;
    const shadowD = 60;
    keyLight.shadow.camera.left = -shadowD;
    keyLight.shadow.camera.right = shadowD;
    keyLight.shadow.camera.top = shadowD;
    keyLight.shadow.camera.bottom = -shadowD;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-60, 30, -50);
    scene.add(fillLight);

    // 5. OrbitControls with smooth exponential damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 350;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;

    // 6. BUILD GLOBE GROUP
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Earth Sphere with High-Detail Procedural Google Earth Canvas Textures & PBR
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 64);
    const earthTex = createProceduralEarthTexture(renderer);
    const earthBumpTex = createProceduralEarthBumpMap();
    const earthRoughnessTex = createProceduralEarthRoughnessMap();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      bumpMap: earthBumpTex,
      bumpScale: 0.2,
      roughnessMap: earthRoughnessTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.name = 'earth_sphere';
    earthMesh.receiveShadow = true;
    globeGroup.add(earthMesh);

    // Atmosphere Glow Layer (Fresnel Glow Rim)
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 36);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Cloud Layer
    const cloudsGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 48, 36);
    const cloudsTex = createProceduralCloudsTexture();
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.45,
      roughness: 1.0,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    cloudsMeshRef.current = cloudsMesh;
    globeGroup.add(cloudsMesh);

    // Orbital Satellite Tracking Ring
    const orbitRingGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.35, GLOBE_RADIUS * 1.355, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 3;
    globeGroup.add(orbitRing);

    // Aurora Pretrained Model Curtains (North & South Poles)
    const auroraCurtains = createAuroraBorealisCurtains(GLOBE_RADIUS);
    globeGroup.add(auroraCurtains);
    auroraCurtainsRef.current = auroraCurtains;

    // 7. BUILD PROCEDURAL 3D STREET VIEW DISTRICT (Offset at (0, 0, 0))
    const streetGroup = new THREE.Group();
    streetGroupRef.current = streetGroup;
    streetGroup.position.set(0, 0, 0);
    scene.add(streetGroup);

    // Ground Plane with Grid Markings
    const groundGeo = new THREE.PlaneGeometry(260, 260);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    streetGroup.add(groundMesh);

    // Procedural Road Network (Crossed Dual Avenues)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
    });
    const roadX = new THREE.Mesh(new THREE.PlaneGeometry(260, 14), roadMat);
    roadX.rotation.x = -Math.PI / 2;
    roadX.position.y = 0.02;
    roadX.receiveShadow = true;
    const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(14, 260), roadMat);
    roadZ.rotation.x = -Math.PI / 2;
    roadZ.position.y = 0.02;
    roadZ.receiveShadow = true;
    streetGroup.add(roadX, roadZ);

    // Procedural Road Markings (Dashed Center Lines)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let d = -110; d <= 110; d += 10) {
      if (Math.abs(d) < 10) continue;
      const dashX = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.4), dashMat);
      dashX.rotation.x = -Math.PI / 2;
      dashX.position.set(d, 0.03, 0);
      const dashZ = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 5), dashMat);
      dashZ.rotation.x = -Math.PI / 2;
      dashZ.position.set(0, 0.03, d);
      streetGroup.add(dashX, dashZ);
    }

    // Procedural City Buildings (Composite 5-Part Architectural Models)
    const buildingThemes = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];
    const buildingCoords: [number, number, number, number][] = [
      // [x, z, width, height]
      [25, 25, 12, 38],
      [50, 25, 10, 24],
      [25, 55, 14, 46],
      [55, 55, 12, 32],
      [-25, 25, 14, 42],
      [-55, 25, 10, 28],
      [-25, 55, 12, 36],
      [-55, 55, 16, 52],
      [25, -25, 12, 34],
      [55, -25, 10, 26],
      [25, -55, 14, 48],
      [55, -55, 12, 30],
      [-25, -25, 14, 32],
      [-55, -25, 12, 40],
      [-25, -55, 10, 22],
      [-55, -55, 14, 44],
    ];

    buildingCoords.forEach(([bx, bz, bw, bh], idx) => {
      const theme = buildingThemes[idx % buildingThemes.length];
      const building = createCompositeBuilding(bh, bw, theme, `grid_${idx}`);
      building.position.set(bx, 0, bz);
      streetGroup.add(building);
    });

    // Procedural Foliage Trees
    const treePositions = [
      [10, 10], [10, -10], [-10, 10], [-10, -10],
      [10, 35], [10, -35], [-10, 35], [-10, -35],
      [35, 10], [-35, 10], [35, -10], [-35, -10],
    ];
    treePositions.forEach(([tx, tz], i) => {
      const tree = createCompositeTree(3.8 + (i % 3) * 0.4, 0x16a34a);
      tree.position.set(tx, 0, tz);
      streetGroup.add(tree);
    });

    // Procedural Moving Autonomous Vehicles (6-Part Composite Models)
    const vehicles: THREE.Group[] = [];
    const carColors = [0x2563eb, 0xdc2626, 0x16a34a, 0x9333ea, 0xeab308];
    for (let v = 0; v < 6; v++) {
      const car = createCompositeVehicle(carColors[v % carColors.length]);
      car.position.set((v - 2.5) * 25, 0, v % 2 === 0 ? 3.5 : -3.5);
      if (v % 2 !== 0) car.rotation.y = Math.PI;
      streetGroup.add(car);
      vehicles.push(car);
    }
    vehiclesRef.current = vehicles;

    // Apple IMDF Multi-Floor Indoor Campus (Positioned at x: -85, z: 0)
    const imdfCampus = createCompositeImdfCampus(0);
    imdfCampus.position.set(-85, 0, 0);
    streetGroup.add(imdfCampus);
    imdfCampusGroupRef.current = imdfCampus;

    // Trail Cam Wildfire Sentinel Tower (Positioned at x: 85, z: 85, wilderness hill)
    const trailCamTower = createCompositeTrailCamTower();
    trailCamTower.position.set(85, 0, 85);
    streetGroup.add(trailCamTower);

    // Emergency Response SOS Beacon (Positioned at x: 18, z: 18)
    const sosBeacon = createCompositeEmergencyBeacon();
    sosBeacon.position.set(18, 0, 18);
    sosBeacon.name = 'sos_beacon_model';
    streetGroup.add(sosBeacon);

    // 8. PROCEDURAL WEATHER PARTICLE SYSTEM (Rain / Snow / Mist)
    const particleCount = 1800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      particlePos[p] = (Math.random() - 0.5) * 160;
      particlePos[p + 1] = Math.random() * 80;
      particlePos[p + 2] = (Math.random() - 0.5) * 160;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.45,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const weatherParticles = new THREE.Points(particleGeo, particleMat);
    weatherParticles.position.set(0, 0, 0);
    streetGroup.add(weatherParticles);
    weatherParticlesRef.current = weatherParticles;

    // 9. RAYCASTING INTERACTION FOR GLOBE & STREET
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const currentProps = propsRef.current;
      if (currentProps.viewMode === 'globe') {
        // Raycast against Earth mesh
        const hits = raycaster.intersectObject(earthMesh, false);
        if (hits.length > 0) {
          const hit = hits[0];
          // Convert hit point to lat/lng
          const localPoint = earthMesh.worldToLocal(hit.point.clone());
          const { lat, lng } = vector3ToLatLng(localPoint);
          const plusCode = encodePlusCode(lat, lng);
          currentProps.onSelectCoordinate(lat, lng, 12, plusCode);

          // Play spatial audio note at hit position
          audioEngine.playNote(60 + Math.floor((lat + 90) / 15), 0.7, hit.point.x, hit.point.y, hit.point.z);
        }
      } else {
        // Raycast against markers or ground
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          const firstHit = intersects[0];
          let obj: THREE.Object3D | null = firstHit.object;
          while (obj && !obj.userData?.markerId && obj.parent) {
            obj = obj.parent;
          }
          if (obj && obj.userData?.markerId) {
            const found = currentProps.allMarkers.find((m) => m.id === obj?.userData.markerId);
            if (found) {
              currentProps.onSelectMarker(found);
              audioEngine.playNote(72, 0.9, firstHit.point.x, firstHit.point.y, firstHit.point.z);
              return;
            }
          }
          // Ground click in street view
          const groundHits = raycaster.intersectObject(groundMesh, false);
          if (groundHits.length > 0) {
            const gHit = groundHits[0];
            const approxLat = 37.7749 + gHit.point.z * 0.0001;
            const approxLng = -122.4194 + gHit.point.x * 0.0001;
            const code = encodePlusCode(approxLat, approxLng);
            currentProps.onSelectCoordinate(approxLat, approxLng, 5, code);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 10. RESIZE LISTENER
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // 11. MAIN ANIMATION LOOP (Damped 60fps)
    let animationFrameId: number;
    let prevTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min((time - prevTime) / 1000, 0.1);
      prevTime = time;

      const currentProps = propsRef.current;

      // Update audio listener position in 3D
      audioEngine.updateListenerPosition(camera.position.x, camera.position.y, camera.position.z);

      // Rotate Earth slowly when in Globe mode
      if (currentProps.viewMode === 'globe') {
        earthMesh.rotation.y += dt * 0.04;
        if (cloudsMeshRef.current) {
          cloudsMeshRef.current.rotation.y += dt * 0.055;
        }
        orbitRing.rotation.z += dt * 0.08;
        if (auroraCurtainsRef.current) {
          auroraCurtainsRef.current.rotation.y += dt * 0.025;
        }
      }

      // Animate Autonomous Vehicles along roads
      vehicles.forEach((car, idx) => {
        const speed = 14 + (idx % 3) * 4;
        const dir = idx % 2 === 0 ? 1 : -1;
        car.position.x += dir * speed * dt;
        if (car.position.x > 110) car.position.x = -110;
        if (car.position.x < -110) car.position.x = 110;
      });

      // Animate Anemometer cups on Trail Cam
      const cups = trailCamTower.getObjectByName('anemometer_cups');
      if (cups) {
        cups.rotation.y += dt * (3 + currentProps.weather.windSpeed * 0.3);
      }

      // Animate Emergency SOS Beacon pulse
      if (sosBeacon) {
        const strobe = sosBeacon.children[2] as THREE.Mesh;
        if (strobe && strobe.material) {
          const mat = strobe.material as THREE.MeshPhysicalMaterial;
          mat.color.set(currentProps.sosActive ? (Math.sin(time * 0.01) > 0 ? 0xff0000 : 0xffeeee) : 0xef4444);
        }
      }

      // Animate Weather Particles
      if (weatherParticlesRef.current) {
        const isRaining = currentProps.weather.condition === 'Rain' || currentProps.weather.condition === 'Storm';
        const isSnowing = currentProps.weather.condition === 'Snow';
        weatherParticlesRef.current.visible = (isRaining || isSnowing) && currentProps.viewMode !== 'globe';

        if (weatherParticlesRef.current.visible) {
          const posAttr = weatherParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          const fallSpeed = isRaining ? 55 : 12;
          for (let i = 1; i < posArray.length; i += 3) {
            posArray[i] -= fallSpeed * dt;
            if (posArray[i] < 0) {
              posArray[i] = 75;
            }
          }
          posAttr.needsUpdate = true;
        }
      }

      // Smooth Exponential Camera Damping (1 - Math.exp(-k * dt))
      const dampFactor = 1 - Math.exp(-4.5 * dt);
      camera.position.lerp(targetCamPos.current, dampFactor);
      controls.target.lerp(targetLookAt.current, dampFactor);
      controls.update();

      // Dynamic NASA-style terrain elevation shader scaling based on camera altitude
      const camDist = camera.position.length();
      if (camDist < 25) {
        earthMat.bumpScale = 0.5;
        earthMat.roughness = 0.7;
      } else if (camDist < 100) {
        earthMat.bumpScale = 0.3;
        earthMat.roughness = 0.8;
      } else {
        earthMat.bumpScale = 0.15;
        earthMat.roughness = 0.85;
      }

      if (audioHeatmapMeshRef.current) {
        audioHeatmapMeshRef.current.rotation.y += dt * 0.75;
      }

      // Render
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Dynamic Overlays in 3D (Markers, Traffic Segments, Disaster Hazards, Network Links)
  useEffect(() => {
    const scene = sceneRef.current;
    const globeGroup = globeGroupRef.current;
    const streetGroup = streetGroupRef.current;
    if (!scene || !globeGroup || !streetGroup) return;

    // 1. Clear previous markers & overlays
    markerMeshesRef.current.forEach((m) => m.parent?.remove(m));
    markerMeshesRef.current = [];

    trafficMeshesRef.current.forEach((t) => t.parent?.remove(t));
    trafficMeshesRef.current = [];

    disasterMeshesRef.current.forEach((d) => d.parent?.remove(d));
    disasterMeshesRef.current = [];

    networkArcMeshesRef.current.forEach((a) => a.parent?.remove(a));
    networkArcMeshesRef.current = [];

    // 2. Render Markers
    allMarkers.forEach((marker) => {
      const markerGroup = new THREE.Group();
      markerGroup.userData = { markerId: marker.id };

      // Pin Shape: 3-part pin (stem, glowing head, pulse ring)
      const pinColor = marker.color || (marker.category === 'emergency' ? '#ef4444' : marker.category === 'trailcam' ? '#f97316' : '#38bdf8');
      const stemGeo = new THREE.CylinderGeometry(0.12, 0.02, 2.5, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 1.25;
      markerGroup.add(stem);

      const headGeo = new THREE.SphereGeometry(0.65, 12, 12);
      const headMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pinColor),
        roughness: 0.2,
        metalness: 0.6,
        emissive: new THREE.Color(pinColor).multiplyScalar(0.4),
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.8;
      markerGroup.add(head);

      const ringGeo = new THREE.RingGeometry(0.8, 1.1, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(pinColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      markerGroup.add(ring);

      if (viewMode === 'globe') {
        // Position pin on spherical surface
        const pos = latLngToVector3(marker.lat, marker.lng, GLOBE_RADIUS + 0.2);
        markerGroup.position.copy(pos);
        markerGroup.quaternion.setFromUnitVectors(_vec3A.set(0, 1, 0), pos.clone().normalize());
        globeGroup.add(markerGroup);
      } else {
        // Map relative to center in street district
        const relX = (marker.lng - (-122.4194)) * 3000;
        const relZ = (marker.lat - 37.7749) * 3000;
        const clampedX = Math.max(-100, Math.min(100, relX));
        const clampedZ = Math.max(-100, Math.min(100, relZ));
        markerGroup.position.set(clampedX, 0, clampedZ);
        markerGroup.scale.set(1.5, 1.5, 1.5);
        streetGroup.add(markerGroup);
      }

      markerMeshesRef.current.push(markerGroup);
    });

    // 3. Render 3D Traffic Flow Ribbons (in Street View)
    if (viewMode !== 'globe') {
      trafficSegments.forEach((seg, sIdx) => {
        const x1 = (seg.startCoord[1] - (-122.4194)) * 3000;
        const z1 = (seg.startCoord[0] - 37.7749) * 3000;
        const x2 = (seg.endCoord[1] - (-122.4194)) * 3000;
        const z2 = (seg.endCoord[0] - 37.7749) * 3000;

        // Offset across district avenues
        const offX1 = Math.max(-95, Math.min(95, x1 + (sIdx % 2 === 0 ? 15 : -15)));
        const offZ1 = Math.max(-95, Math.min(95, z1 + (sIdx * 10 - 20)));
        const offX2 = Math.max(-95, Math.min(95, x2 + (sIdx % 2 === 0 ? 15 : -15)));
        const offZ2 = Math.max(-95, Math.min(95, z2 + (sIdx * 10 - 20)));

        const mesh = create3DTrafficSegmentMesh(offX1, offZ1, offX2, offZ2, seg.congestionLevel);
        streetGroup.add(mesh);
        trafficMeshesRef.current.push(mesh);
      });
    }

    // 4. Render 3D Disaster Hazard Zones
    disasterWarnings.forEach((disaster) => {
      if (viewMode === 'globe') {
        const pos = latLngToVector3(disaster.center[0], disaster.center[1], GLOBE_RADIUS + 0.1);
        const zoneGroup = create3DDisasterZoneMesh(disaster.radiusKm * 0.18, disaster.severity);
        zoneGroup.position.copy(pos);
        zoneGroup.quaternion.setFromUnitVectors(_vec3A.set(0, 1, 0), pos.clone().normalize());
        globeGroup.add(zoneGroup);
        disasterMeshesRef.current.push(zoneGroup);
      } else {
        const relX = (disaster.center[1] - (-122.4194)) * 3000;
        const relZ = (disaster.center[0] - 37.7749) * 3000;
        const clampedX = Math.max(-90, Math.min(90, relX));
        const clampedZ = Math.max(-90, Math.min(90, relZ));
        const zoneGroup = create3DDisasterZoneMesh(disaster.radiusKm * 1.5, disaster.severity);
        zoneGroup.position.set(clampedX, 0, clampedZ);
        streetGroup.add(zoneGroup);
        disasterMeshesRef.current.push(zoneGroup);
      }
    });

    // 5. Render 3D Network Mesh Arcs between Nodes
    if (viewMode === 'globe') {
      for (let i = 0; i < networkNodes.length; i++) {
        for (let j = i + 1; j < networkNodes.length; j++) {
          const n1 = networkNodes[i];
          const n2 = networkNodes[j];
          const p1 = latLngToVector3(n1.lat, n1.lng, GLOBE_RADIUS + 0.3);
          const p2 = latLngToVector3(n2.lat, n2.lng, GLOBE_RADIUS + 0.3);
          const arc = create3DNetworkMeshArc(p1, p2, n1.status === 'degraded' || n2.status === 'degraded');
          globeGroup.add(arc);
          networkArcMeshesRef.current.push(arc);
        }
      }
    }

    // 6. Render 3D GPS Traversed Breadcrumb Trail
    if (breadcrumbsMeshRef.current) {
      breadcrumbsMeshRef.current.parent?.remove(breadcrumbsMeshRef.current);
      breadcrumbsMeshRef.current = null;
    }

    if (gpsBreadcrumbs.length > 1) {
      const pts: THREE.Vector3[] = [];
      if (viewMode === 'globe') {
        gpsBreadcrumbs.forEach((b) => {
          pts.push(latLngToVector3(b.lat, b.lng, GLOBE_RADIUS + 0.15));
        });
        const trackMesh = createGpsBreadcrumbTrackMesh(pts, 0x38bdf8);
        globeGroup.add(trackMesh);
        breadcrumbsMeshRef.current = trackMesh;
      } else {
        gpsBreadcrumbs.forEach((b) => {
          const relX = (b.lng - (-122.4194)) * 3000;
          const relZ = (b.lat - 37.7749) * 3000;
          pts.push(new THREE.Vector3(Math.max(-100, Math.min(100, relX)), 0.1, Math.max(-100, Math.min(100, relZ))));
        });
        const trackMesh = createGpsBreadcrumbTrackMesh(pts, 0x06b6d4);
        streetGroup.add(trackMesh);
        breadcrumbsMeshRef.current = trackMesh;
      }
    }

    // 7. Render Snapchat Friends Location Topography & Triangulation Walkways
    triangulationMeshesRef.current.forEach((w) => w.parent?.remove(w));
    triangulationMeshesRef.current = [];

    friends
      .filter((f) => f.isSharing && f.privacyLevel !== 'hidden')
      .forEach((f) => {
        if (viewMode === 'globe') {
          const userPos = latLngToVector3(userLat, userLng, GLOBE_RADIUS + 0.2);
          const friendPos = latLngToVector3(f.lat, f.lng, GLOBE_RADIUS + 0.2);
          const walkway = createTriangulationWalkwayMesh(userPos, friendPos, 0x10b981);
          globeGroup.add(walkway);
          triangulationMeshesRef.current.push(walkway);
        } else {
          const uX = Math.max(-100, Math.min(100, (userLng - (-122.4194)) * 3000));
          const uZ = Math.max(-100, Math.min(100, (userLat - 37.7749) * 3000));
          const fX = Math.max(-100, Math.min(100, (f.lng - (-122.4194)) * 3000));
          const fZ = Math.max(-100, Math.min(100, (f.lat - 37.7749) * 3000));
          const uPos = new THREE.Vector3(uX, 0.2, uZ);
          const fPos = new THREE.Vector3(fX, (f.currentFloor || 1) * 3.6 + 0.2, fZ);
          const walkway = createTriangulationWalkwayMesh(uPos, fPos, 0x34d399);
          streetGroup.add(walkway);
          triangulationMeshesRef.current.push(walkway);
        }
      });

    // 8. Render 3D Volumetric Audio Heatmap & Beacon Proximity Field Mesh
    if (audioHeatmapMeshRef.current) {
      audioHeatmapMeshRef.current.parent?.remove(audioHeatmapMeshRef.current);
      audioHeatmapMeshRef.current = null;
    }

    const audioHeatmap = create3DVolumetricAudioHeatmapMesh(0.85);
    if (viewMode === 'globe') {
      const userPos = latLngToVector3(userLat, userLng, GLOBE_RADIUS + 0.4);
      audioHeatmap.position.copy(userPos);
      audioHeatmap.quaternion.setFromUnitVectors(_vec3A.set(0, 1, 0), userPos.clone().normalize());
      audioHeatmap.scale.set(3, 3, 3);
      globeGroup.add(audioHeatmap);
      audioHeatmapMeshRef.current = audioHeatmap;
    } else {
      const uX = Math.max(-100, Math.min(100, (userLng - (-122.4194)) * 3000));
      const uZ = Math.max(-100, Math.min(100, (userLat - 37.7749) * 3000));
      audioHeatmap.position.set(uX, 0.2, uZ);
      audioHeatmap.scale.set(1.5, 1.5, 1.5);
      streetGroup.add(audioHeatmap);
      audioHeatmapMeshRef.current = audioHeatmap;
    }

    // 9. Render 3D Radio Frequency Waterfall Mesh (FM/AM/HAM)
    if (rfWaterfallMeshRef.current) {
      rfWaterfallMeshRef.current.parent?.remove(rfWaterfallMeshRef.current);
      rfWaterfallMeshRef.current = null;
    }

    if (rfScanActive) {
      const rfMesh = createRadioFrequencyWaterfallMesh();
      if (viewMode === 'globe') {
        const userPos = latLngToVector3(userLat, userLng, GLOBE_RADIUS + 0.7);
        rfMesh.position.copy(userPos);
        rfMesh.quaternion.setFromUnitVectors(_vec3A.set(0, 1, 0), userPos.clone().normalize());
        rfMesh.scale.set(3.5, 3.5, 3.5);
        globeGroup.add(rfMesh);
        rfWaterfallMeshRef.current = rfMesh;
      } else {
        const uX = Math.max(-100, Math.min(100, (userLng - (-122.4194)) * 3000));
        const uZ = Math.max(-100, Math.min(100, (userLat - 37.7749) * 3000));
        rfMesh.position.set(uX, 10, uZ);
        rfMesh.scale.set(2, 2, 2);
        streetGroup.add(rfMesh);
        rfWaterfallMeshRef.current = rfMesh;
      }
    }

    // 10. Render 3D Elevation Cross-Section Transect (Arc, Terrain Curtain, Peak & Endpoint Pins)
    if (elevationTransectMeshRef.current) {
      elevationTransectMeshRef.current.parent?.remove(elevationTransectMeshRef.current);
      elevationTransectMeshRef.current = null;
    }

    if (elevationPointA && elevationPointB && viewMode === 'globe') {
      const transectGroup = new THREE.Group();
      transectGroup.name = 'elevation_cross_section_transect';

      const sampleCount = 60;
      const arcPoints: THREE.Vector3[] = [];
      const curtainPositions: number[] = [];

      let peakElev = -Infinity;
      let peakCoord = { lat: elevationPointA.lat, lng: elevationPointA.lng };

      for (let i = 0; i <= sampleCount; i++) {
        const t = i / sampleCount;
        const coord = interpolateGreatCirclePoint(
          elevationPointA.lat,
          elevationPointA.lng,
          elevationPointB.lat,
          elevationPointB.lng,
          t
        );
        const elevM = getEarthTopographicElevation(coord.lat, coord.lng);
        if (elevM > peakElev) {
          peakElev = elevM;
          peakCoord = coord;
        }

        const elevOffset = 0.35 + (elevM / 8848) * 2.0;
        const surfP = latLngToVector3(coord.lat, coord.lng, GLOBE_RADIUS + 0.05);
        const topP = latLngToVector3(coord.lat, coord.lng, GLOBE_RADIUS + elevOffset);

        arcPoints.push(topP);

        if (i < sampleCount) {
          const nextCoord = interpolateGreatCirclePoint(
            elevationPointA.lat,
            elevationPointA.lng,
            elevationPointB.lat,
            elevationPointB.lng,
            (i + 1) / sampleCount
          );
          const nextElevM = getEarthTopographicElevation(nextCoord.lat, nextCoord.lng);
          const nextSurfP = latLngToVector3(nextCoord.lat, nextCoord.lng, GLOBE_RADIUS + 0.05);
          const nextTopP = latLngToVector3(nextCoord.lat, nextCoord.lng, GLOBE_RADIUS + 0.35 + (nextElevM / 8848) * 2.0);

          // Triangle 1
          curtainPositions.push(surfP.x, surfP.y, surfP.z);
          curtainPositions.push(topP.x, topP.y, topP.z);
          curtainPositions.push(nextTopP.x, nextTopP.y, nextTopP.z);

          // Triangle 2
          curtainPositions.push(surfP.x, surfP.y, surfP.z);
          curtainPositions.push(nextTopP.x, nextTopP.y, nextTopP.z);
          curtainPositions.push(nextSurfP.x, nextSurfP.y, nextSurfP.z);
        }
      }

      // 1. Cross-section terrain curtain mesh
      const curtainGeometry = new THREE.BufferGeometry();
      curtainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(curtainPositions, 3));
      curtainGeometry.computeVertexNormals();
      const curtainMaterial = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const curtainMesh = new THREE.Mesh(curtainGeometry, curtainMaterial);
      transectGroup.add(curtainMesh);

      // 2. Ridge Line on top of the cross-section
      const lineGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.95,
      });
      const ridgeLine = new THREE.Line(lineGeo, lineMat);
      transectGroup.add(ridgeLine);

      // 3. Point A Marker Pin (Emerald)
      const posA = latLngToVector3(elevationPointA.lat, elevationPointA.lng, GLOBE_RADIUS + 0.5);
      const pinAGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const pinAMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const pinAMesh = new THREE.Mesh(pinAGeo, pinAMat);
      pinAMesh.position.copy(posA);
      transectGroup.add(pinAMesh);

      // 4. Point B Marker Pin (Amber)
      const posB = latLngToVector3(elevationPointB.lat, elevationPointB.lng, GLOBE_RADIUS + 0.5);
      const pinBGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const pinBMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const pinBMesh = new THREE.Mesh(pinBGeo, pinBMat);
      pinBMesh.position.copy(posB);
      transectGroup.add(pinBMesh);

      // 5. Peak Elevation Marker Pin (Gold Pyramid)
      const peakPos = latLngToVector3(peakCoord.lat, peakCoord.lng, GLOBE_RADIUS + 0.35 + (peakElev / 8848) * 2.0 + 0.4);
      const peakGeo = new THREE.ConeGeometry(0.7, 1.4, 4);
      const peakMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const peakMesh = new THREE.Mesh(peakGeo, peakMat);
      peakMesh.position.copy(peakPos);
      peakMesh.quaternion.setFromUnitVectors(_vec3A.set(0, 1, 0), peakPos.clone().normalize());
      transectGroup.add(peakMesh);

      globeGroup.add(transectGroup);
      elevationTransectMeshRef.current = transectGroup;
    }
  }, [
    allMarkers,
    trafficSegments,
    disasterWarnings,
    networkNodes,
    gpsBreadcrumbs,
    friends,
    userLat,
    userLng,
    viewMode,
    rfScanActive,
    elevationPointA,
    elevationPointB,
  ]);

  // Handle View Mode transitions & Camera Target Glide
  useEffect(() => {
    if (viewMode === 'globe') {
      if (globeGroupRef.current) globeGroupRef.current.visible = true;
      if (streetGroupRef.current) streetGroupRef.current.visible = false;

      if (activeMarker) {
        // Point camera towards active marker on globe
        const pos = latLngToVector3(activeMarker.lat, activeMarker.lng, GLOBE_RADIUS + 25);
        targetCamPos.current.copy(pos);
        targetLookAt.current.set(0, 0, 0);
      } else {
        targetCamPos.current.set(0, 20, 85);
        targetLookAt.current.set(0, 0, 0);
      }
    } else if (viewMode === 'street') {
      if (globeGroupRef.current) globeGroupRef.current.visible = false;
      if (streetGroupRef.current) streetGroupRef.current.visible = true;

      if (activeMarker) {
        const relX = (activeMarker.lng - (-122.4194)) * 3000;
        const relZ = (activeMarker.lat - 37.7749) * 3000;
        const targetX = Math.max(-90, Math.min(90, relX));
        const targetZ = Math.max(-90, Math.min(90, relZ));
        targetCamPos.current.set(targetX + 15, 12, targetZ + 18);
        targetLookAt.current.set(targetX, 4, targetZ);
      } else {
        targetCamPos.current.set(22, 14, 34);
        targetLookAt.current.set(0, 4, 0);
      }
    } else if (viewMode === 'indoor') {
      if (globeGroupRef.current) globeGroupRef.current.visible = false;
      if (streetGroupRef.current) streetGroupRef.current.visible = true;

      // Focus on Apple IMDF campus (x: -85, z: 0)
      const floorY = (activeImdfFloor || 1) * 3.6;
      targetCamPos.current.set(-85 + 18, floorY + 8, 20);
      targetLookAt.current.set(-85, floorY, 0);
    } else if (viewMode === 'orbit') {
      if (globeGroupRef.current) globeGroupRef.current.visible = true;
      if (streetGroupRef.current) streetGroupRef.current.visible = false;
      targetCamPos.current.set(0, 60, 120);
      targetLookAt.current.set(0, 0, 0);
    }
  }, [viewMode, activeMarker, activeImdfFloor]);

  // Slicing / highlighting active IMDF Floor
  useEffect(() => {
    if (!imdfCampusGroupRef.current) return;
    for (let l = 1; l <= 3; l++) {
      const fl = imdfCampusGroupRef.current.getObjectByName(`imdf_floor_${l}`);
      if (fl) {
        if (activeImdfFloor === 0 || activeImdfFloor === l) {
          fl.visible = true;
        } else {
          fl.visible = false;
        }
      }
    }
  }, [activeImdfFloor]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (arModeActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          // Fallback if camera unavailable
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [arModeActive]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* AR Camera Background Stream */}
      {arModeActive && (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
        />
      )}

      {/* Isolated WebGL Canvas container */}
      <div ref={mountRef} className={`w-full h-full cursor-grab active:cursor-grabbing relative z-10 ${arModeActive ? 'bg-transparent opacity-90' : ''}`} />

      {/* AR HUD Telemetry Overlay when AR mode is active */}
      {arModeActive && (
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
          {/* Top AR Header */}
          <div className="flex justify-between items-start">
            <div className="bg-slate-950/80 border border-cyan-500/50 p-3 rounded-xl backdrop-blur-md text-cyan-300 font-mono text-xs space-y-1 shadow-2xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>AR CAMERA OVERLAY ACTIVE</span>
              </div>
              <div>Plus Code: <span className="text-white font-semibold">{encodePlusCode(userLat, userLng)}</span></div>
              <div>Coords: {userLat.toFixed(4)}°, {userLng.toFixed(4)}°</div>
              <div>Weather: {weather.condition} ({weather.temperature.toFixed(1)}°C)</div>
            </div>

            <div className="bg-slate-950/80 border border-cyan-500/50 px-3 py-2 rounded-xl backdrop-blur-md text-cyan-300 font-mono text-xs shadow-2xl">
              <div>COMPASS: 318° NW</div>
              <div>ELEVATION: 16m MSL</div>
            </div>
          </div>

          {/* Center AR Reticle */}
          <div className="self-center my-auto flex flex-col items-center justify-center opacity-70">
            <div className="w-24 h-24 border-2 border-dashed border-cyan-400 rounded-full animate-spin duration-1000 flex items-center justify-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
            <span className="text-cyan-400 font-mono text-[10px] mt-2 tracking-widest">LOCKED // AR TARGETING</span>
          </div>

          {/* Bottom AR Footer */}
          <div className="self-center bg-slate-950/80 border border-cyan-500/50 px-4 py-1.5 rounded-full backdrop-blur-md text-cyan-300 font-mono text-[11px]">
            GPS Precision: Exact (RTK Fixed) • Satellites: 24/24 Locked
          </div>
        </div>
      )}
    </div>
  );
};
