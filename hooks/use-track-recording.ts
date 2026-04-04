import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { RouteCoord } from '@/constants/run-data';
import { accumulatedDistanceKm, distanceMeters } from '@/lib/route-geo';

const MIN_MOVE_M = 6;

export function useTrackRecording() {
  const [coords, setCoords] = useState<RouteCoord[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [gpsKm, setGpsKm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const clear = useCallback(() => {
    setCoords([]);
    setGpsKm(null);
    setError(null);
  }, []);

  const stop = useCallback(async () => {
    if (subRef.current) {
      await subRef.current.remove();
      subRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission is needed to record a GPS track.');
      return;
    }
    await stop();
    setCoords([]);
    setGpsKm(null);
    setIsRecording(true);

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2500,
        distanceInterval: 5,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        setCoords((prev) => {
          const last = prev[prev.length - 1];
          if (
            last &&
            distanceMeters(last, { latitude, longitude }) < MIN_MOVE_M &&
            prev.length > 0
          ) {
            return prev;
          }
          const next = [...prev, { latitude, longitude }];
          setGpsKm(accumulatedDistanceKm(next));
          return next;
        });
      },
    );
    subRef.current = sub;
  }, [stop]);

  useEffect(() => {
    return () => {
      void subRef.current?.remove();
    };
  }, []);

  return { coords, isRecording, gpsKm, error, start, stop, clear };
}
