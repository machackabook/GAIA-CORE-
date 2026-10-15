import * as THREE from 'three';

/**
 * Pre-allocated math objects to ensure zero GC during animation loop
 */
export const _vec3A = new THREE.Vector3();
export const _vec3B = new THREE.Vector3();
export const _vec3C = new THREE.Vector3();
export const _mat4 = new THREE.Matrix4();
export const _quat = new THREE.Quaternion();

/**
 * Generates procedural high-detail Earth texture on an HTML5 canvas.
 * Continents, oceans, lat/lng grid lines, biome shading.
 */
export function createProceduralEarthTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Abyssal Deep Ocean & Continental Shelf Bathymetry (NASA GEBCO Bathymetric standard)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#040d1a');
  oceanGrad.addColorStop(0.25, '#071d38');
  oceanGrad.addColorStop(0.5, '#0b2e59');
  oceanGrad.addColorStop(0.75, '#071d38');
  oceanGrad.addColorStop(1, '#040d1a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subsea Mid-Atlantic Ridge & Mariana Trench Bathymetric Rift Lines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(width * 0.38, 0);
  ctx.bezierCurveTo(width * 0.35, height * 0.3, width * 0.42, height * 0.6, width * 0.39, height);
  ctx.stroke();

  const drawContinent = (
    points: [number, number][],
    fill: string,
    strokeColor = '#1c4029',
    hasShelf = true
  ) => {
    ctx.beginPath();
    points.forEach(([xPct, yPct], idx) => {
      const px = (xPct / 100) * width;
      const py = (yPct / 100) * height;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    if (hasShelf) {
      // Shallow Turquoise Continental Shelf Gradient (NASA Blue Marble style)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.45)';
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 32;
      ctx.stroke();
    }

    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.8;
    ctx.stroke();
  };

  // Helper for drawing mountain ranges with elevation shading & snow caps
  const drawMountainRidge = (coords: [number, number][], color = 'rgba(255,255,255,0.75)', widthPx = 5) => {
    ctx.beginPath();
    coords.forEach(([xPct, yPct], i) => {
      const px = (xPct / 100) * width;
      const py = (yPct / 100) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = widthPx;
    ctx.stroke();
  };

  // Helper for drawing river veins
  const drawRiverVein = (coords: [number, number][]) => {
    ctx.beginPath();
    coords.forEach(([xPct, yPct], i) => {
      const px = (xPct / 100) * width;
      const py = (yPct / 100) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  };

  // North America (Rocky Mountains, Canadian Shield, Great Plains, Florida & Baja)
  drawContinent(
    [
      [14, 18], [18, 14], [24, 13], [30, 16], [34, 26], [32, 38], [29, 41],
      [27, 44], [25, 48], [24, 52], [22, 54], [18, 56], [16, 52], [14, 46],
      [12, 38], [10, 32], [11, 22]
    ],
    '#254f35',
    '#1c4029'
  );

  // Florida Peninsula
  drawContinent([[28, 41], [29.5, 43.5], [29, 45], [28, 43]], '#2d5a3d', '#1c4029', false);
  // Baja California Peninsula
  drawContinent([[15, 40], [17, 46], [18, 49], [17, 47], [15, 42]], '#6e5f38', '#4b4325', false);
  // Cuba & Caribbean
  drawContinent([[27, 47], [30, 48], [29, 49], [26.5, 48]], '#2d5a3d', '#1c4029', true);

  // South America (Amazon Basin, Andes Mountains, Patagonia)
  drawContinent(
    [
      [24, 54], [28, 55], [33, 58], [37, 66], [36, 75], [34, 82], [30, 93],
      [27, 95], [25, 90], [24, 82], [22, 74], [21, 64], [22, 56]
    ],
    '#1e472a',
    '#163720'
  );

  // Europe & Scandinavia & Mediterranean
  drawContinent(
    [
      [45, 20], [53, 16], [58, 22], [57, 30], [52, 38], [47, 40], [44, 38],
      [41, 30], [42, 22]
    ],
    '#366243',
    '#274b32'
  );
  // British Isles & Ireland
  drawContinent([[44, 24], [47, 22], [46, 28], [43, 27]], '#2d5a3d', '#1c4029', true);
  // Italian Boot & Sicily
  drawContinent([[49, 36], [51, 41], [50, 42], [48, 38]], '#4a673c', '#274b32', false);
  // Iberian Peninsula (Spain / Portugal)
  drawContinent([[41, 34], [45, 34], [44, 40], [40, 39]], '#5b6138', '#383b1f', false);

  // Africa (Sahara Desert sands, Congo Basin rainforest, Madagascar)
  drawContinent(
    [
      [43, 41], [58, 39], [64, 48], [63, 62], [58, 80], [52, 86], [48, 85],
      [44, 68], [42, 52]
    ],
    '#685f39',
    '#4b4325'
  );
  // Madagascar Island
  drawContinent([[64, 72], [66, 75], [65, 82], [63, 79]], '#2d5a3d', '#1c4029', true);

  // Asia (Siberian Taiga, Himalayan Ridge, Gobi Desert, Indian Subcontinent)
  drawContinent(
    [
      [58, 18], [80, 14], [92, 22], [90, 40], [86, 50], [78, 60], [74, 58],
      [71, 64], [67, 56], [62, 42], [58, 30]
    ],
    '#3b5a3e',
    '#2c442e'
  );
  // Indian Peninsula
  drawContinent([[66, 48], [72, 49], [70, 62], [67, 58]], '#4e6b41', '#2c442e', true);
  // Japanese Archipelago
  drawContinent([[87, 34], [90, 36], [89, 42], [86, 40]], '#356345', '#1c4029', true);
  // Indonesian Archipelago (Sumatra, Java, Borneo, Papua)
  drawContinent([[76, 62], [82, 63], [85, 68], [78, 67]], '#1e472a', '#163720', true);
  drawContinent([[86, 64], [92, 65], [91, 70], [86, 68]], '#1e472a', '#163720', true);

  // Australia & New Zealand (Outback Red & Great Barrier Reef)
  drawContinent(
    [
      [77, 68], [88, 66], [91, 78], [84, 86], [75, 80]
    ],
    '#7c5635',
    '#583b22'
  );
  // New Zealand
  drawContinent([[93, 82], [95, 85], [94, 91], [92, 88]], '#2d5a3d', '#1c4029', true);

  // Antarctica & Greenland (Glacial Ice Caps - Polar White/Blue)
  drawContinent([[2, 92], [98, 92], [98, 100], [2, 100]], '#e2e8f0', '#cbd5e1', false);
  drawContinent([[34, 8], [42, 8], [40, 20], [33, 19]], '#f1f5f9', '#e2e8f0', false);

  // 2. High-Altitude Mountain Ranges & Snow Caps (NASA Shaded Relief)
  // Rocky Mountains & Cascades
  drawMountainRidge([[16, 24], [18, 32], [20, 38], [22, 44]], '#e2e8f0', 5.5);
  // Andes Mountain Spine
  drawMountainRidge([[23, 56], [22, 66], [24, 76], [27, 88]], '#e2e8f0', 6);
  // Alps & Pyrenees (Europe)
  drawMountainRidge([[46, 32], [50, 31], [53, 33]], '#f8fafc', 4.5);
  // Himalayas & Tibetan Plateau (Mount Everest)
  drawMountainRidge([[68, 44], [74, 43], [80, 44], [84, 46]], '#ffffff', 8);
  // Urals
  drawMountainRidge([[60, 18], [61, 26], [61, 34]], '#e2e8f0', 3.5);

  // 3. Continental River Arteries (Amazon, Nile, Mississippi, Yangtze)
  drawRiverVein([[25, 62], [28, 60], [34, 59]]); // Amazon
  drawRiverVein([[53, 44], [52, 54], [51, 62]]); // Nile
  drawRiverVein([[24, 34], [25, 40], [26, 44]]); // Mississippi
  drawRiverVein([[74, 46], [80, 47], [84, 48]]); // Yangtze

  // 4. Google Maps Global Maritime Shipping Corridors & Submarine Cables
  // Transoceanic Fiber Optic Cables (Cyan Dashed)
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 8]);
  // Transatlantic Cable (NY to London)
  ctx.beginPath();
  ctx.moveTo((28 / 100) * width, (36 / 100) * height);
  ctx.bezierCurveTo((38 / 100) * width, (30 / 100) * height, (42 / 100) * width, (28 / 100) * height, (50 / 100) * width, (31 / 100) * height);
  ctx.stroke();
  // Transpacific Cable (SF to Tokyo)
  ctx.beginPath();
  ctx.moveTo((22 / 100) * width, (38 / 100) * height);
  ctx.bezierCurveTo((10 / 100) * width, (36 / 100) * height, (95 / 100) * width, (36 / 100) * height, (84 / 100) * width, (38 / 100) * height);
  ctx.stroke();
  // Mediterranean to Indian Ocean Cable (London -> Suez -> Mumbai)
  ctx.beginPath();
  ctx.moveTo((50 / 100) * width, (31 / 100) * height);
  ctx.lineTo((54 / 100) * width, (42 / 100) * height);
  ctx.lineTo((68 / 100) * width, (47 / 100) * height);
  ctx.stroke();

  // Major Maritime Shipping Corridors (Amber Dashed)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  // Panama Canal transit route
  ctx.beginPath();
  ctx.moveTo((20 / 100) * width, (52 / 100) * height);
  ctx.lineTo((26 / 100) * width, (50 / 100) * height);
  ctx.stroke();
  // Malacca Strait to Pacific
  ctx.beginPath();
  ctx.moveTo((72 / 100) * width, (56 / 100) * height);
  ctx.lineTo((84 / 100) * width, (42 / 100) * height);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Geodetic Global Coordinate Grid (Google Earth / NASA Standard)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 1;

  // Parallels (every 15 degrees)
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  for (let lat = 1; lat < 12; lat++) {
    const y = (lat / 12) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    const deg = 90 - lat * 15;
    ctx.fillText(`${deg > 0 ? deg + '°N' : deg < 0 ? Math.abs(deg) + '°S' : '0°'}`, 12, y - 3);
  }

  // Meridians (every 15 degrees)
  for (let lng = 1; lng < 24; lng++) {
    const x = (lng / 24) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    const deg = lng * 15 - 180;
    ctx.fillText(`${deg > 0 ? deg + '°E' : deg < 0 ? Math.abs(deg) + '°W' : '0°'}`, x + 4, 18);
  }

  // Tropic of Cancer (23.5° N) & Tropic of Capricorn (23.5° S)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 1.6;
  const cancerY = ((90 - 23.5) / 180) * height;
  const capricornY = ((90 + 23.5) / 180) * height;
  ctx.beginPath();
  ctx.moveTo(0, cancerY);
  ctx.lineTo(width, cancerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, capricornY);
  ctx.lineTo(width, capricornY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Equator (0°) Bold Amber-Gold Line with Glow
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Prime Meridian (0°) Cyan Line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // 6. Metropolitan Nocturnal City Lights (NASA Earth at Night clusters)
  const majorCitiesPct: [number, number, number][] = [
    [22, 38, 16],  // SF Bay Area
    [23, 40, 15],  // Los Angeles
    [28, 36, 18],  // New York Metro
    [26, 35, 14],  // Chicago
    [25, 42, 13],  // Texas Triangle (Houston/Dallas)
    [20, 48, 12],  // Mexico City
    [50, 31, 17],  // London
    [51, 33, 15],  // Paris
    [53, 31, 13],  // Berlin
    [45, 38, 12],  // Madrid
    [49, 36, 12],  // Rome
    [64, 28, 15],  // Moscow
    [84, 38, 20],  // Tokyo
    [82, 42, 15],  // Seoul
    [78, 44, 18],  // Shanghai
    [76, 49, 16],  // Hong Kong / Shenzhen
    [75, 40, 15],  // Beijing
    [73, 56, 13],  // Singapore
    [68, 47, 15],  // Mumbai
    [69, 42, 14],  // New Delhi
    [61, 46, 14],  // Dubai
    [54, 43, 13],  // Cairo
    [32, 72, 16],  // Sao Paulo
    [31, 75, 13],  // Buenos Aires
    [54, 76, 13],  // Johannesburg
    [86, 78, 15],  // Sydney
    [85, 80, 14],  // Melbourne
    [13, 22, 10],  // Anchorage Alaska
    [93, 86, 10],  // Auckland NZ
  ];

  for (const [cx, cy, radius] of majorCitiesPct) {
    const px = (cx / 100) * width;
    const py = (cy / 100) * height;
    const g = ctx.createRadialGradient(px, py, 1, px, py, radius * 1.8);
    g.addColorStop(0, 'rgba(255, 255, 210, 0.98)');
    g.addColorStop(0.25, 'rgba(251, 191, 36, 0.85)');
    g.addColorStop(0.6, 'rgba(245, 158, 11, 0.35)');
    g.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, radius * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

/**
 * Creates high-detail procedural elevation bump map for 3D Earth terrain
 */
export function createProceduralEarthBumpMap(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Oceans = 0 (black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const drawLandRelief = (points: [number, number][], heightLevel = '#404040') => {
    ctx.beginPath();
    points.forEach(([xPct, yPct], i) => {
      const px = (xPct / 100) * width;
      const py = (yPct / 100) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = heightLevel;
    ctx.fill();
  };

  // Base continents
  drawLandRelief([[14, 18], [24, 13], [30, 16], [34, 26], [32, 38], [28, 44], [22, 54], [18, 56], [14, 46], [10, 32]]);
  drawLandRelief([[24, 54], [33, 58], [37, 66], [34, 82], [30, 93], [25, 90], [21, 64]]);
  drawLandRelief([[45, 20], [58, 22], [57, 30], [52, 38], [44, 38], [41, 30]]);
  drawLandRelief([[43, 41], [58, 39], [64, 48], [63, 62], [58, 80], [50, 85], [44, 68]]);
  drawLandRelief([[58, 18], [80, 14], [92, 22], [86, 50], [78, 60], [70, 54], [62, 42]]);
  drawLandRelief([[77, 68], [88, 66], [91, 78], [84, 86], [75, 80]]);

  // Elevated Mountain Ridges (White/Light Gray for maximum bump relief)
  const drawRidge = (coords: [number, number][], level = '#ffffff', lw = 6) => {
    ctx.beginPath();
    coords.forEach(([x, y], i) => {
      const px = (x / 100) * width;
      const py = (y / 100) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = level;
    ctx.lineWidth = lw;
    ctx.stroke();
  };

  drawRidge([[16, 24], [18, 32], [20, 38], [22, 44]], '#e0e0e0', 7); // Rockies
  drawRidge([[23, 56], [22, 66], [24, 76], [27, 88]], '#ffffff', 8); // Andes
  drawRidge([[46, 32], [50, 31], [53, 33]], '#d0d0d0', 5); // Alps
  drawRidge([[68, 44], [74, 43], [80, 44], [84, 46]], '#ffffff', 10); // Himalayas

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates procedural roughness / specularity map for NASA Google Earth PBR
 * Oceans = 0.05 (Glossy / Specular), Land = 0.85 (Matte)
 */
export function createProceduralEarthRoughnessMap(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Oceans = deep black (highly glossy & reflective)
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, width, height);

  const drawMatteContinent = (points: [number, number][]) => {
    ctx.beginPath();
    points.forEach(([xPct, yPct], i) => {
      const px = (xPct / 100) * width;
      const py = (yPct / 100) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = '#d9d9d9'; // Land = matte
    ctx.fill();
  };

  drawMatteContinent([[14, 18], [24, 13], [30, 16], [34, 26], [32, 38], [28, 44], [22, 54], [18, 56], [14, 46], [10, 32]]);
  drawMatteContinent([[24, 54], [33, 58], [37, 66], [34, 82], [30, 93], [25, 90], [21, 64]]);
  drawMatteContinent([[45, 20], [58, 22], [57, 30], [52, 38], [44, 38], [41, 30]]);
  drawMatteContinent([[43, 41], [58, 39], [64, 48], [63, 62], [58, 80], [50, 85], [44, 68]]);
  drawMatteContinent([[58, 18], [80, 14], [92, 22], [86, 50], [78, 60], [70, 54], [62, 42]]);
  drawMatteContinent([[77, 68], [88, 66], [91, 78], [84, 86], [75, 80]]);
  drawMatteContinent([[2, 92], [98, 92], [98, 100], [2, 100]]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates procedural atmosphere clouds texture
 */
export function createProceduralCloudsTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

  // Cloud bands
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const rx = 40 + Math.random() * 120;
    const ry = 15 + Math.random() * 45;
    const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, rx);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    radGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates soft radial contact shadow texture
 */
export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Composite 3–12 Part Procedural Model: 5-Part Architectural High-Rise Tower
 */
export function createCompositeBuilding(
  height = 14,
  width = 6,
  themeColor = '#3b82f6',
  id = 'bld'
): THREE.Group {
  const group = new THREE.Group();
  group.name = `building_${id}`;

  // 1. Base Foundation Podium (dark concrete & bronze trim)
  const podiumH = 2.5;
  const podiumGeo = new THREE.BoxGeometry(width * 1.25, podiumH, width * 1.25);
  const podiumMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.85,
    metalness: 0.15,
  });
  const podium = new THREE.Mesh(podiumGeo, podiumMat);
  podium.position.y = podiumH / 2;
  podium.castShadow = true;
  podium.receiveShadow = true;
  group.add(podium);

  // 2. Main Glass & Metal Tower Shaft
  const towerH = height - podiumH - 2.5;
  const towerGeo = new THREE.BoxGeometry(width, towerH, width);
  const towerMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(themeColor),
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = podiumH + towerH / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // 3. Recessed Window Bands / Balconies
  const bandGeo = new THREE.BoxGeometry(width * 1.05, 0.35, width * 1.05);
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.4,
    metalness: 0.6,
  });
  const levels = 4;
  for (let l = 1; l <= levels; l++) {
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = podiumH + (towerH * l) / (levels + 1);
    group.add(band);
  }

  // 4. Rooftop Penthouse & Mechanical Tier
  const roofH = 1.8;
  const roofGeo = new THREE.BoxGeometry(width * 0.75, roofH, width * 0.75);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.3,
  });
  const roofTier = new THREE.Mesh(roofGeo, roofMat);
  roofTier.position.y = podiumH + towerH + roofH / 2;
  roofTier.castShadow = true;
  group.add(roofTier);

  // 5. Telecom Antenna Spire with Top Beacon
  const antennaGeo = new THREE.CylinderGeometry(0.08, 0.2, 3.5, 8);
  const antennaMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.1,
  });
  const antenna = new THREE.Mesh(antennaGeo, antennaMat);
  antenna.position.y = podiumH + towerH + roofH + 1.75;
  group.add(antenna);

  // Beacon sphere
  const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = podiumH + towerH + roofH + 3.5;
  group.add(beacon);

  // Contact shadow at ground level
  const shadowGeo = new THREE.PlaneGeometry(width * 1.8, width * 1.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createRadialShadowTexture(),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  group.add(shadowMesh);

  return group;
}

/**
 * Composite 3–12 Part Procedural Model: 6-Part Autonomous Ground Vehicle
 */
export function createCompositeVehicle(color = 0x2563eb): THREE.Group {
  const group = new THREE.Group();

  // 1. Lower Chassis
  const chassisGeo = new THREE.BoxGeometry(2.4, 0.45, 1.2);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.7,
    metalness: 0.3,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.4;
  chassis.castShadow = true;
  group.add(chassis);

  // 2. Cabin Shell with Gloss Finish
  const cabinGeo = new THREE.BoxGeometry(1.6, 0.55, 1.1);
  const cabinMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 1.0,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(-0.1, 0.8, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // 3. Tinted Windshield & Glass
  const glassGeo = new THREE.BoxGeometry(1.2, 0.4, 1.12);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    transmission: 0.75,
    roughness: 0.1,
    ior: 1.5,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(-0.05, 0.85, 0);
  group.add(glass);

  // 4. Wheels with Rims (4 wheels)
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16);
  wheelGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
  const wheelPositions = [
    [0.75, 0.3, 0.65],
    [0.75, 0.3, -0.65],
    [-0.75, 0.3, 0.65],
    [-0.75, 0.3, -0.65],
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  }

  // 5. LED Headlights (warm white)
  const lightGeo = new THREE.BoxGeometry(0.1, 0.12, 0.25);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const headL = new THREE.Mesh(lightGeo, lightMat);
  headL.position.set(1.18, 0.5, 0.35);
  const headR = new THREE.Mesh(lightGeo, lightMat);
  headR.position.set(1.18, 0.5, -0.35);
  group.add(headL, headR);

  // 6. Rooftop Sensor LiDAR / GPS Beacon
  const sensorGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12);
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 });
  const sensor = new THREE.Mesh(sensorGeo, sensorMat);
  sensor.position.set(0, 1.18, 0);
  group.add(sensor);

  return group;
}

/**
 * Composite 3–12 Part Procedural Model: 4-Part Foliage Tree
 */
export function createCompositeTree(height = 4.5, tint = 0x22c55e): THREE.Group {
  const group = new THREE.Group();

  // 1. Tapered Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.45, 1.6, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9, metalness: 0.05 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  group.add(trunk);

  // 2. Lower Canopy Cone
  const cone1Geo = new THREE.ConeGeometry(1.8, 1.8, 8);
  const folMat1 = new THREE.MeshStandardMaterial({ color: tint, roughness: 0.8, metalness: 0.05 });
  const cone1 = new THREE.Mesh(cone1Geo, folMat1);
  cone1.position.y = 2.0;
  cone1.castShadow = true;
  group.add(cone1);

  // 3. Middle Canopy Cone
  const cone2Geo = new THREE.ConeGeometry(1.4, 1.6, 8);
  const folMat2 = new THREE.MeshStandardMaterial({
    color: new THREE.Color(tint).multiplyScalar(1.15),
    roughness: 0.75,
  });
  const cone2 = new THREE.Mesh(cone2Geo, folMat2);
  cone2.position.y = 2.9;
  cone2.castShadow = true;
  group.add(cone2);

  // 4. Top Canopy Cone
  const cone3Geo = new THREE.ConeGeometry(0.9, 1.3, 8);
  const folMat3 = new THREE.MeshStandardMaterial({
    color: new THREE.Color(tint).multiplyScalar(1.25),
    roughness: 0.7,
  });
  const cone3 = new THREE.Mesh(cone3Geo, folMat3);
  cone3.position.y = 3.7;
  cone3.castShadow = true;
  group.add(cone3);

  return group;
}

/**
 * Composite 3–12 Part Procedural Model: 7-Part Trail Cam Wildfire Sentinel
 */
export function createCompositeTrailCamTower(): THREE.Group {
  const group = new THREE.Group();

  // 1. Concrete Anchor Base
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.4, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.2;
  base.castShadow = true;
  group.add(base);

  // 2. Telescopic Weather Mast
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.2, 6.0, 10);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.y = 3.2;
  mast.castShadow = true;
  group.add(mast);

  // 3. Solar Photovoltaic Panel
  const solarGeo = new THREE.BoxGeometry(1.6, 0.08, 1.1);
  const solarMat = new THREE.MeshPhysicalMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.15, clearcoat: 0.9 });
  const solar = new THREE.Mesh(solarGeo, solarMat);
  solar.position.set(0.6, 4.8, 0);
  solar.rotation.z = -Math.PI / 6;
  group.add(solar);

  // 4. Dual-Lens Optical + Thermal Cam Pod
  const podGeo = new THREE.BoxGeometry(0.6, 0.45, 0.5);
  const podMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });
  const pod = new THREE.Mesh(podGeo, podMat);
  pod.position.set(-0.4, 5.2, 0);
  pod.castShadow = true;
  group.add(pod);

  // 5. Dual Optical Lenses (Infrared + RGB)
  const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12);
  lensGeo.rotateX(Math.PI / 2);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.1 });
  const lens1 = new THREE.Mesh(lensGeo, lensMat);
  lens1.position.set(-0.55, 5.2, 0.12);
  const lens2 = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  lens2.position.set(-0.55, 5.2, -0.12);
  group.add(lens1, lens2);

  // 6. Anemometer Wind Cups on Top
  const cupGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6 });
  const anemometerGroup = new THREE.Group();
  anemometerGroup.position.set(0, 6.3, 0);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4);
    anemometerGroup.add(cup);
  }
  anemometerGroup.name = 'anemometer_cups';
  group.add(anemometerGroup);

  // 7. Wildfire Early-Warning Beacon (flashing red/amber)
  const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const alertBeacon = new THREE.Mesh(beaconGeo, beaconMat);
  alertBeacon.position.set(0, 5.8, 0);
  group.add(alertBeacon);

  return group;
}

/**
 * Composite 3–12 Part Procedural Model: Apple IMDF Multi-Floor Indoor Campus
 */
export function createCompositeImdfCampus(activeFloor = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'imdf_campus';

  // Floor heights: 3m per floor
  const floorHeight = 3.6;
  const campusRadius = 14;

  // 1. Exterior Curved Glass Facade
  const facadeGeo = new THREE.CylinderGeometry(campusRadius, campusRadius, floorHeight * 3, 32, 1, true);
  const facadeMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transmission: 0.88,
    roughness: 0.1,
    ior: 1.52,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const facade = new THREE.Mesh(facadeGeo, facadeMat);
  facade.position.y = (floorHeight * 3) / 2;
  group.add(facade);

  // 2. Interior Floors (Level 1, Level 2, Level 3)
  const floorColors = [0x1e293b, 0x0f766e, 0x1e1b4b];
  const floorNames = ['Level 1 - Concourse & Transit', 'Level 2 - Skybridge Innovation Lab', 'Level 3 - Panoramic Flight Deck'];

  for (let lvl = 0; lvl < 3; lvl++) {
    const floorGroup = new THREE.Group();
    floorGroup.name = `imdf_floor_${lvl + 1}`;
    const floorY = (lvl + 0.5) * floorHeight;

    // Floor slab
    const slabGeo = new THREE.CylinderGeometry(campusRadius * 0.95, campusRadius * 0.95, 0.3, 32);
    const slabMat = new THREE.MeshStandardMaterial({
      color: floorColors[lvl],
      roughness: 0.6,
      metalness: 0.3,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = lvl * floorHeight + 0.15;
    slab.receiveShadow = true;
    floorGroup.add(slab);

    // Interior Structural Columns (6 around center)
    const colGeo = new THREE.CylinderGeometry(0.25, 0.25, floorHeight - 0.3, 12);
    const colMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.5, roughness: 0.3 });
    for (let c = 0; c < 6; c++) {
      const angle = (c * Math.PI * 2) / 6;
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(Math.cos(angle) * (campusRadius * 0.6), floorY, Math.sin(angle) * (campusRadius * 0.6));
      col.castShadow = true;
      floorGroup.add(col);
    }

    // Interior Meeting Pod / Lab partition
    const podGeo = new THREE.BoxGeometry(5.0, floorHeight * 0.7, 4.0);
    const podMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.2,
      wireframe: false,
    });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.set(0, floorY, 0);
    floorGroup.add(pod);

    // Apple iBeacon / UWB Localization Pylon (Glowing LED ring)
    const beaconGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.8, 12);
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2, metalness: 0.9 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(3, floorY, 3);
    floorGroup.add(beacon);

    const beaconRingGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(beaconRingGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(3, floorY + 0.9, 3);
    floorGroup.add(ring);

    group.add(floorGroup);
  }

  // 3. Central Glass Atrium Skylight Dome
  const domeGeo = new THREE.SphereGeometry(campusRadius * 0.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transmission: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = floorHeight * 3;
  group.add(dome);

  return group;
}

/**
 * Composite 3–12 Part Procedural Model: 5-Part Emergency SOS Dispatch Beacon
 */
export function createCompositeEmergencyBeacon(): THREE.Group {
  const group = new THREE.Group();

  // 1. Heavy Tripod Stabilizer Base
  const baseGeo = new THREE.CylinderGeometry(1.0, 1.3, 0.35, 6);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.18;
  group.add(base);

  // 2. Beacon Mast
  const mastGeo = new THREE.CylinderGeometry(0.1, 0.15, 3.5, 8);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.3 });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.y = 1.9;
  group.add(mast);

  // 3. Strobe Light Housing
  const strobeGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
  const strobeMat = new THREE.MeshPhysicalMaterial({
    color: 0xef4444,
    transmission: 0.6,
    roughness: 0.1,
    clearcoat: 1.0,
  });
  const strobe = new THREE.Mesh(strobeGeo, strobeMat);
  strobe.position.y = 3.8;
  group.add(strobe);

  // 4. Emissive Lamp Core
  const lampGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.y = 3.8;
  group.add(lamp);

  // 5. High-Gain Directional Acoustic Siren Horn
  const hornGeo = new THREE.ConeGeometry(0.35, 0.7, 12);
  hornGeo.rotateZ(Math.PI / 2);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
  const horn = new THREE.Mesh(hornGeo, hornMat);
  horn.position.set(0.4, 3.3, 0);
  group.add(horn);

  return group;
}

/**
 * 3D Traffic Segment Overlay: Colored road flow ribbon with speed markers
 */
export function create3DTrafficSegmentMesh(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  congestion: 'free_flow' | 'moderate' | 'heavy' | 'closed'
): THREE.Group {
  const group = new THREE.Group();

  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const colors = {
    free_flow: 0x10b981,
    moderate: 0xf59e0b,
    heavy: 0xef4444,
    closed: 0x7f1d1d,
  };

  // Flow ribbon
  const ribbonGeo = new THREE.PlaneGeometry(length, 2.2);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: colors[congestion],
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: congestion === 'closed' ? 0.9 : 0.75,
  });

  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.rotation.z = -angle;
  ribbon.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2);
  group.add(ribbon);

  // If closed, add construction barricade blocks
  if (congestion === 'closed') {
    const barGeo = new THREE.BoxGeometry(2.4, 0.6, 0.4);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    const bar1 = new THREE.Mesh(barGeo, barMat);
    bar1.position.set(x1, 0.3, z1);
    const bar2 = new THREE.Mesh(barGeo, barMat);
    bar2.position.set(x2, 0.3, z2);
    group.add(bar1, bar2);
  }

  return group;
}

/**
 * 3D Disaster Hazard Zone Overlay (Pulsing semi-transparent perimeter)
 */
export function create3DDisasterZoneMesh(radius = 12, severity: 'advisory' | 'warning' | 'emergency' = 'warning'): THREE.Group {
  const group = new THREE.Group();

  const color = severity === 'emergency' ? 0xef4444 : severity === 'warning' ? 0xf97316 : 0xfbbf24;

  // Hazard disk
  const discGeo = new THREE.CircleGeometry(radius, 32);
  const discMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.04;
  group.add(disc);

  // Hazard perimeter fence ring
  const ringGeo = new THREE.RingGeometry(radius * 0.98, radius * 1.02, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  group.add(ring);

  return group;
}

/**
 * 3D Network Link Arc between two 3D vector points
 */
export function create3DNetworkMeshArc(p1: THREE.Vector3, p2: THREE.Vector3, isDegraded = false): THREE.Line {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const dist = p1.distanceTo(p2);
  // Arch outward from center
  const normal = mid.clone().normalize();
  mid.add(normal.multiplyScalar(dist * 0.25));

  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const points = curve.getPoints(24);
  const geo = new THREE.BufferGeometry().setFromPoints(points);

  const mat = new THREE.LineBasicMaterial({
    color: isDegraded ? 0xf97316 : 0x06b6d4,
    transparent: true,
    opacity: 0.65,
    linewidth: 2,
  });

  return new THREE.Line(geo, mat);
}

/**
 * Aurora Pretrained Model: Undulating Polar Auroral Curtain (North & South Poles)
 */
export function createAuroraBorealisCurtains(globeRadius = 30): THREE.Group {
  const auroraGroup = new THREE.Group();
  auroraGroup.name = 'aurora_curtains';

  // North Polar Aurora Ribbon
  const northSegments = 64;
  const northPoints: THREE.Vector3[] = [];
  const northLat = 68 * (Math.PI / 180);
  const northRadius = globeRadius * Math.cos(northLat) * 1.05;
  const northY = globeRadius * Math.sin(northLat) * 1.05;

  for (let i = 0; i <= northSegments; i++) {
    const theta = (i / northSegments) * Math.PI * 2;
    // Harmonic wave perturbations
    const wave = Math.sin(theta * 5) * 1.2 + Math.cos(theta * 3) * 0.8;
    const r = northRadius + wave;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = northY + Math.sin(theta * 4) * 0.9;
    northPoints.push(new THREE.Vector3(x, y, z));
  }

  const northCurve = new THREE.CatmullRomCurve3(northPoints, true);
  const northGeo = new THREE.TubeGeometry(northCurve, 96, 0.45, 8, true);
  const northMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const northRibbon = new THREE.Mesh(northGeo, northMat);
  auroraGroup.add(northRibbon);

  // Secondary North Outer Magenta/Cyan Flare Ring
  const northGeo2 = new THREE.TubeGeometry(northCurve, 96, 0.25, 8, true);
  const northMat2 = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const northRibbon2 = new THREE.Mesh(northGeo2, northMat2);
  northRibbon2.position.y += 0.8;
  auroraGroup.add(northRibbon2);

  // South Polar Aurora Ribbon (Aurora Australis)
  const southSegments = 64;
  const southPoints: THREE.Vector3[] = [];
  const southLat = -70 * (Math.PI / 180);
  const southRadius = globeRadius * Math.cos(southLat) * 1.05;
  const southY = globeRadius * Math.sin(southLat) * 1.05;

  for (let i = 0; i <= southSegments; i++) {
    const theta = (i / southSegments) * Math.PI * 2;
    const wave = Math.cos(theta * 4) * 1.1;
    const r = southRadius + wave;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = southY + Math.sin(theta * 3) * 0.7;
    southPoints.push(new THREE.Vector3(x, y, z));
  }

  const southCurve = new THREE.CatmullRomCurve3(southPoints, true);
  const southGeo = new THREE.TubeGeometry(southCurve, 96, 0.4, 8, true);
  const southMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const southRibbon = new THREE.Mesh(southGeo, southMat);
  auroraGroup.add(southRibbon);

  return auroraGroup;
}

/**
 * 3D GPS Traversed Breadcrumb Track Line
 */
export function createGpsBreadcrumbTrackMesh(points: THREE.Vector3[], color = 0x38bdf8): THREE.Group {
  const group = new THREE.Group();
  if (points.length < 2) return group;

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    linewidth: 3,
  });
  const line = new THREE.Line(geo, mat);
  group.add(line);

  // Add small glowing node markers on recent 5 breadcrumb vertices
  const dotGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color });
  const startIdx = Math.max(0, points.length - 8);
  for (let i = startIdx; i < points.length; i++) {
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(points[i]);
    group.add(dot);
  }

  return group;
}

/**
 * Triangulation Walkway to Friends
 */
export function createTriangulationWalkwayMesh(p1: THREE.Vector3, p2: THREE.Vector3, color = 0x10b981): THREE.Group {
  const group = new THREE.Group();
  const points = [p1, p2];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 1.5,
    gapSize: 0.8,
    transparent: true,
    opacity: 0.75,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  group.add(line);
  return group;
}

/**
 * 3D Volumetric Audio Heatmap & Beacon Proximity Field Mesh
 */
export function create3DVolumetricAudioHeatmapMesh(intensity = 0.75): THREE.Group {
  const group = new THREE.Group();
  group.name = 'audio_volumetric_heatmap';

  // 1. Central acoustic core sphere
  const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.4 + intensity * 0.4,
    blending: THREE.AdditiveBlending,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // 2. Concentric acoustic wave rings (volumetric intensity field)
  for (let i = 1; i <= 3; i++) {
    const ringGeo = new THREE.RingGeometry(i * 2.5, i * 2.5 + 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x38bdf8 : 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: (0.6 - i * 0.15) * intensity,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1 * i;
    group.add(ring);
  }

  // 3. Vertical acoustic spectrum pillars
  const pillarCount = 8;
  for (let p = 0; p < pillarCount; p++) {
    const angle = (p / pillarCount) * Math.PI * 2;
    const radius = 4.5;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;
    const pHeight = 2 + Math.random() * 3 * intensity;

    const pillarGeo = new THREE.CylinderGeometry(0.15, 0.3, pHeight, 8);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(px, pHeight / 2, pz);
    group.add(pillar);
  }

  return group;
}

/**
 * Generates a high-resolution placeholder terrain texture with topographic elevation relief,
 * contour lines, and biome gradients for areas where high-fidelity satellite data is unavailable.
 */
export function createHighResTerrainPlaceholderTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base terrain elevation gradient (NASA Shuttle Radar Topography Mission style)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#111827'); // Arctic / Tundra
  bgGrad.addColorStop(0.3, '#1e293b'); // Highlands
  bgGrad.addColorStop(0.5, '#0f172a'); // Valleys
  bgGrad.addColorStop(0.8, '#14532d'); // Lush Lowlands
  bgGrad.addColorStop(1, '#1e1b4b'); // Deep Basins
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Procedural topographical contour rings & elevation bands
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * height;
    ctx.beginPath();
    for (let x = 0; x < width; x += 20) {
      const noise = Math.sin(x * 0.01 + i * 0.5) * 35 + Math.cos(x * 0.005) * 20;
      if (x === 0) ctx.moveTo(x, y + noise);
      else ctx.lineTo(x, y + noise);
    }
    ctx.stroke();
  }

  // Elevation grid & coordinate marker overlay for fallback intelligence
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Watermarking badge for placeholder terrain status
  ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('NASA / USGS TOPOGRAPHIC ELEVATION FALLBACK - HIGH-RES MESH', 40, 60);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generates a 3D Radio Frequency Waterfall Mesh visualizing FM/AM/HAM spectrum signals.
 */
export function createRadioFrequencyWaterfallMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'rf_waterfall_mesh';

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Waterfall background gradient (dark cyber blue / green)
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, width, height);

  // Frequency spectrum waterfall grid
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw simulated RF signal peaks (FM, AM, HAM)
  const drawSpectrumCurve = (color: string, yBase: number, frequency: number, amplitude: number) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    for (let x = 0; x < width; x++) {
      const val = Math.sin(x * 0.02 * frequency) * amplitude + Math.cos(x * 0.005) * (amplitude * 0.5);
      const y = yBase - Math.abs(val);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawSpectrumCurve('rgba(56, 189, 248, 0.85)', 150, 1.2, 80); // FM Band 88-108 MHz
  drawSpectrumCurve('rgba(168, 85, 247, 0.85)', 300, 2.5, 60); // HAM Band 144 MHz
  drawSpectrumCurve('rgba(16, 185, 129, 0.85)', 420, 0.8, 45); // AM Band 540-1600 kHz

  // Labels
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('FM SPECTRUM (88-108 MHz)', 30, 40);
  ctx.fillText('HAM BAND (144.200 MHz)', 30, 190);
  ctx.fillText('AM / EMERGENCY BEACONS', 30, 330);

  const texture = new THREE.CanvasTexture(canvas);
  const planeGeo = new THREE.PlaneGeometry(16, 8);
  const planeMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Mesh(planeGeo, planeMat);
  group.add(mesh);
  return group;
}





