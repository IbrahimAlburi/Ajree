import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutRectangle,
} from 'react-native';
import Svg, { Circle, Polyline as SvgPolyline } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import type { RouteCoord } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export type RoutePlannerProps = {
  coords: RouteCoord[];
  onChange: (next: RouteCoord[]) => void;
  /** Fixed height (embedded). Omit with `fillContainer` for flex layout. */
  height?: number;
  /** Fill parent (e.g. full-screen modal). */
  fillContainer?: boolean;
  /** Polyline / waypoint color (Strava orange in builder). */
  routeColor?: string;
  /** iOS: quieter map style in full-screen builder. */
  mapStyle?: 'standard' | 'muted';
};

const DEFAULT_HEIGHT = 220;

/** Web: fixed “neighborhood” box so taps map to lat/lng without a map SDK. */
const WEB_BBOX = {
  minLat: 37.74,
  maxLat: 37.82,
  minLng: -122.52,
  maxLng: -122.38,
};

function pixelToCoord(
  x: number,
  y: number,
  layout: LayoutRectangle,
  bbox: typeof WEB_BBOX,
): RouteCoord {
  const w = Math.max(layout.width, 1);
  const h = Math.max(layout.height, 1);
  const lat = bbox.maxLat - (y / h) * (bbox.maxLat - bbox.minLat);
  const lng = bbox.minLng + (x / w) * (bbox.maxLng - bbox.minLng);
  return { latitude: lat, longitude: lng };
}

function RoutePlannerWeb({
  coords,
  onChange,
  height,
  fillContainer,
  routeColor,
}: RoutePlannerProps) {
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const mutedBg = useThemeColor({}, 'muted');
  const lineColor = routeColor ?? tint;
  const fixedH = height ?? DEFAULT_HEIGHT;
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);

  const pad = 10;
  const innerW = layout ? Math.max(layout.width - pad * 2, 1) : 1;
  const innerH = layout ? Math.max(layout.height - pad * 2, 1) : 1;

  const points =
    coords.length > 0 && layout
      ? coords
          .map((c) => {
            const x =
              pad + ((c.longitude - WEB_BBOX.minLng) / (WEB_BBOX.maxLng - WEB_BBOX.minLng)) * innerW;
            const y =
              pad +
              (1 - (c.latitude - WEB_BBOX.minLat) / (WEB_BBOX.maxLat - WEB_BBOX.minLat)) * innerH;
            return `${x},${y}`;
          })
          .join(' ')
      : '';

  const onTap = useCallback(
    (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!layout) return;
      const { locationX, locationY } = e.nativeEvent;
      const c = pixelToCoord(locationX, locationY, layout, WEB_BBOX);
      onChange([...coords, c]);
    },
    [coords, layout, onChange],
  );

  const containerStyle = fillContainer
    ? [styles.webWrap, styles.fill, { backgroundColor: mutedBg }]
    : [styles.webWrap, { height: fixedH, backgroundColor: mutedBg }];

  return (
    <View style={containerStyle}>
      <Pressable
        style={fillContainer ? styles.fill : { height: fixedH }}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
        onPress={onTap}>
        {layout ? (
          <Svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            preserveAspectRatio="none">
            {coords.length >= 2 ? (
              <SvgPolyline
                points={points}
                fill="none"
                stroke={lineColor}
                strokeWidth={4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {coords.map((c, i) => {
              const x =
                pad + ((c.longitude - WEB_BBOX.minLng) / (WEB_BBOX.maxLng - WEB_BBOX.minLng)) * innerW;
              const y =
                pad +
                (1 - (c.latitude - WEB_BBOX.minLat) / (WEB_BBOX.maxLat - WEB_BBOX.minLat)) * innerH;
              return (
                <Circle key={`${i}-${c.latitude}-${c.longitude}`} cx={x} cy={y} r={6} fill={lineColor} />
              );
            })}
          </Svg>
        ) : null}
      </Pressable>
      <ThemedText style={[styles.webCaption, { color: muted }]}>
        Tap to add waypoints · order is direction of travel
      </ThemedText>
    </View>
  );
}

function RoutePlannerNative({
  coords,
  onChange,
  height,
  fillContainer,
  routeColor,
  mapStyle = 'standard',
}: RoutePlannerProps) {
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const lineColor = routeColor ?? tint;
  const h = fillContainer ? undefined : (height ?? DEFAULT_HEIGHT);
  const mapRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  });

  const mapType =
    Platform.OS === 'ios' && mapStyle === 'muted' ? ('mutedStandard' as const) : ('standard' as const);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) {
        setReady(true);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        if (cancelled) return;
        setInitialRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        });
      } catch {
        /* keep default SF */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || coords.length < 2 || !mapRef.current) return;
    const mv = mapRef.current as {
      fitToCoordinates: (c: RouteCoord[], o: { edgePadding: object; animated: boolean }) => void;
    };
    const id = requestAnimationFrame(() => {
      mv.fitToCoordinates(coords, {
        edgePadding: { top: 56, right: 24, bottom: 120, left: 24 },
        animated: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [coords, mapReady]);

  const onMapPress = useCallback(
    (e: { nativeEvent: { coordinate: RouteCoord } }) => {
      const c = e.nativeEvent.coordinate;
      onChange([...coords, { latitude: c.latitude, longitude: c.longitude }]);
    },
    [coords, onChange],
  );

  if (!ready) {
    return (
      <View
        style={[
          styles.loading,
          fillContainer ? styles.fill : { height: h ?? DEFAULT_HEIGHT },
          { backgroundColor: mutedBg },
        ]}>
        <ActivityIndicator color={lineColor} />
        <ThemedText style={[styles.loadingText, { color: muted }]}>Loading map…</ThemedText>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: MapView, Marker, Polyline } = require('react-native-maps') as typeof import('react-native-maps');

  const wrapStyle = fillContainer
    ? [styles.nativeWrap, styles.fill, styles.nativeNoRadius]
    : [styles.nativeWrap, { height: h ?? DEFAULT_HEIGHT }];

  return (
    <View style={wrapStyle}>
      <MapView
        ref={mapRef as never}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        onPress={onMapPress}
        mapType={mapType}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation
        showsCompass={false}>
        {coords.length >= 2 ? (
          <Polyline coordinates={coords} strokeColor={lineColor} strokeWidth={5} />
        ) : null}
        {coords.map((c, i) => (
          <Marker key={`m-${i}-${c.latitude.toFixed(5)}-${c.longitude.toFixed(5)}`} coordinate={c} />
        ))}
      </MapView>
      <ThemedText style={[styles.nativeHint, { color: '#ffffff' }]}>
        Tap map to add · pinch to zoom
      </ThemedText>
    </View>
  );
}

export function RoutePlanner(props: RoutePlannerProps) {
  return Platform.OS === 'web' ? <RoutePlannerWeb {...props} /> : <RoutePlannerNative {...props} />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    minHeight: 0,
  },
  webInner: {
    flex: 1,
  },
  webWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  webCaption: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    fontSize: 11,
    lineHeight: 14,
  },
  nativeWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nativeNoRadius: {
    borderRadius: 0,
  },
  nativeHint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
});
