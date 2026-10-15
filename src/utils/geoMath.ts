import * as THREE from 'three';

export const GLOBE_RADIUS = 30;

/**
 * Converts latitude and longitude to 3D Cartesian coordinates on a sphere of radius R.
 * Lat: -90 to +90, Lng: -180 to +180
 */
export function latLngToVector3(lat: number, lng: number, radius: number = GLOBE_RADIUS, target = new THREE.Vector3()): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  target.x = -radius * Math.sin(phi) * Math.cos(theta);
  target.z = radius * Math.sin(phi) * Math.sin(theta);
  target.y = radius * Math.cos(phi);

  return target;
}

/**
 * Converts 3D Cartesian point on a sphere back to Latitude and Longitude.
 */
export function vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
  const r = point.length();
  if (r === 0) return { lat: 0, lng: 0 };

  const phi = Math.acos(Math.min(1, Math.max(-1, point.y / r)));
  const lat = 90 - phi * (180 / Math.PI);

  const theta = Math.atan2(point.z, -point.x);
  let lng = theta * (180 / Math.PI) - 180;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;

  return { lat, lng };
}

/**
 * Great-circle distance between two lat/lng coordinates in kilometers.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Compass bearing between two lat/lng coordinates in degrees (0 = North).
 */
export function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
  const b = Math.atan2(y, x) * (180 / Math.PI);
  return (b + 360) % 360;
}
