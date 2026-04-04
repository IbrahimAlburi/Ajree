import type { RouteCoord } from '@/constants/run-data';

const EARTH_M = 6371000;

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Haversine distance between two WGS84 points in meters. */
export function distanceMeters(a: RouteCoord, b: RouteCoord): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Sum of segment lengths along the path (km). */
export function accumulatedDistanceKm(coords: RouteCoord[]): number {
  if (coords.length < 2) return 0;
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    m += distanceMeters(coords[i - 1], coords[i]);
  }
  return m / 1000;
}

/** Region for react-native-maps `region` prop. */
export function regionForCoords(coords: RouteCoord[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null {
  if (coords.length === 0) return null;
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.0005);
  const lngSpan = Math.max(maxLng - minLng, 0.0005);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan * 1.35,
    longitudeDelta: lngSpan * 1.35,
  };
}

/** Downsample to at most `max` points (keeps first and last). */
export function thinCoords(coords: RouteCoord[], max: number): RouteCoord[] {
  if (coords.length <= max) return coords;
  if (max < 2) return coords.slice(0, 1);
  const out: RouteCoord[] = [coords[0]];
  const step = (coords.length - 1) / (max - 1);
  for (let i = 1; i < max - 1; i++) {
    const idx = Math.round(i * step);
    out.push(coords[Math.min(idx, coords.length - 1)]);
  }
  out.push(coords[coords.length - 1]);
  return out;
}
