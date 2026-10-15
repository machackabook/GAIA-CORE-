/**
 * Open Location Code (Plus Codes) standard implementation
 * Base20 character set: '23456789CFGHJMPQRVWX'
 */

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = CODE_ALPHABET.length;
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const MAX_DIGIT_COUNT = 10;
const SEPARATOR = '+';
const SEPARATOR_POSITION = 8;

export function clipLatitude(latitude: number): number {
  return Math.min(90, Math.max(-90, latitude));
}

export function normalizeLongitude(longitude: number): number {
  while (longitude < -180) longitude += 360;
  while (longitude >= 180) longitude -= 360;
  return longitude;
}

/**
 * Encodes a latitude/longitude pair into a Plus Code (Open Location Code).
 */
export function encodePlusCode(latitude: number, longitude: number, codeLength: number = 10): string {
  if (codeLength < 2 || (codeLength < 10 && codeLength % 2 === 1)) {
    codeLength = 10;
  }
  let lat = clipLatitude(latitude);
  let lng = normalizeLongitude(longitude);

  if (lat === 90) {
    lat = lat - 0.0000000000001;
  }

  lat += LATITUDE_MAX;
  lng += LONGITUDE_MAX;

  let code = '';

  // First pair resolution: 20 degrees
  let latVal = lat;
  let lngVal = lng;

  let latResolution = 20.0;
  let lngResolution = 20.0;

  for (let i = 0; i < Math.min(codeLength, 10); i += 2) {
    if (i === SEPARATOR_POSITION) {
      code += SEPARATOR;
    }

    const latDigit = Math.floor(latVal / latResolution);
    const lngDigit = Math.floor(lngVal / lngResolution);

    latVal -= latDigit * latResolution;
    lngVal -= lngDigit * lngResolution;

    code += CODE_ALPHABET[Math.min(ENCODING_BASE - 1, Math.max(0, latDigit))];
    code += CODE_ALPHABET[Math.min(ENCODING_BASE - 1, Math.max(0, lngDigit))];

    latResolution /= ENCODING_BASE;
    lngResolution /= ENCODING_BASE;
  }

  if (code.length === SEPARATOR_POSITION) {
    code += SEPARATOR;
  }

  return code;
}

export interface DecodedPlusCode {
  latitudeCenter: number;
  longitudeCenter: number;
  latitudeLo: number;
  latitudeHi: number;
  longitudeLo: number;
  longitudeHi: number;
  codeLength: number;
}

/**
 * Decodes a Plus Code into bounding box and center coordinate.
 */
export function decodePlusCode(code: string): DecodedPlusCode | null {
  const cleanCode = code.toUpperCase().replace(/\s+/g, '');
  if (!cleanCode.includes(SEPARATOR)) {
    return null;
  }

  const parts = cleanCode.split(SEPARATOR);
  if (parts.length !== 2) return null;

  const sequence = parts[0] + parts[1];
  let latVal = 0;
  let lngVal = 0;

  let latResolution = 20.0;
  let lngResolution = 20.0;

  let count = 0;
  for (let i = 0; i < sequence.length; i += 2) {
    const charLat = sequence[i];
    const charLng = sequence[i + 1];
    if (!charLat || !charLng) break;

    const latIdx = CODE_ALPHABET.indexOf(charLat);
    const lngIdx = CODE_ALPHABET.indexOf(charLng);
    if (latIdx === -1 || lngIdx === -1) return null;

    latVal += latIdx * latResolution;
    lngVal += lngIdx * lngResolution;

    latResolution /= ENCODING_BASE;
    lngResolution /= ENCODING_BASE;
    count += 2;
  }

  const latLo = latVal - LATITUDE_MAX;
  const lngLo = lngVal - LONGITUDE_MAX;
  const latSpan = latResolution * ENCODING_BASE;
  const lngSpan = lngResolution * ENCODING_BASE;

  return {
    latitudeLo: latLo,
    latitudeHi: latLo + latSpan,
    longitudeLo: lngLo,
    longitudeHi: lngLo + lngSpan,
    latitudeCenter: latLo + latSpan / 2,
    longitudeCenter: lngLo + lngSpan / 2,
    codeLength: count,
  };
}

/**
 * Checks if a string looks like a valid Plus Code
 */
export function isValidPlusCode(code: string): boolean {
  if (!code || !code.includes(SEPARATOR)) return false;
  const chars = code.toUpperCase().replace(SEPARATOR, '').trim();
  for (let i = 0; i < chars.length; i++) {
    if (!CODE_ALPHABET.includes(chars[i])) return false;
  }
  return chars.length >= 4;
}
