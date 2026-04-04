import type { RouteCoord } from '@/constants/run-data';

import { thinCoords } from '@/lib/route-geo';

/** Sum of positive grade along a 1D elevation profile (meters). */
export function elevationGainMeters(elevationsM: number[]): number {
  if (elevationsM.length < 2) return 0;
  let gain = 0;
  for (let i = 1; i < elevationsM.length; i++) {
    const d = elevationsM[i] - elevationsM[i - 1];
    if (d > 0) gain += d;
  }
  return Math.round(gain);
}

/**
 * Fetches elevation samples (Open-Elevation public API). May fail on web (CORS) or offline.
 * Samples at most ~80 points along the path.
 */
export async function fetchElevationGainForRoute(coords: RouteCoord[]): Promise<number | null> {
  if (coords.length < 2) return 0;
  const sampled = thinCoords(coords, 80);
  try {
    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: sampled.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { elevation: number }[] };
    const results = data.results;
    if (!results?.length) return null;
    const elev = results.map((r) => r.elevation);
    return elevationGainMeters(elev);
  } catch {
    return null;
  }
}
