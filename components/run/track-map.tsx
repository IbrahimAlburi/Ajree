import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import type { RouteCoord } from '@/constants/run-data';
import { regionForCoords } from '@/lib/route-geo';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  coords: RouteCoord[];
  height: number;
  /** Defaults to theme tint — use Strava orange for planned routes. */
  strokeColor?: string;
};

function TrackMapWeb({ coords, height, strokeColor }: Props) {
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const lineColor = strokeColor ?? tint;
  const mutedBg = useThemeColor({}, 'muted');

  if (coords.length === 0) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: mutedBg }]}>
        <ThemedText style={[styles.hint, { color: muted }]}>No GPS path</ThemedText>
      </View>
    );
  }

  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 1e-6);
  const lngSpan = Math.max(maxLng - minLng, 1e-6);

  const pad = 8;
  const w = 320;
  const h = Math.max(height, 120);
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const points = coords
    .map((c) => {
      const x = pad + ((c.longitude - minLng) / lngSpan) * innerW;
      const y = pad + (1 - (c.latitude - minLat) / latSpan) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={[styles.wrap, { height, backgroundColor: mutedBg }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        <SvgPolyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <ThemedText style={[styles.caption, { color: muted }]}>Route preview (web)</ThemedText>
    </View>
  );
}

function TrackMapNative({ coords, height, strokeColor }: Props) {
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const lineColor = strokeColor ?? tint;
  const mutedBg = useThemeColor({}, 'muted');

  const region = regionForCoords(coords);

  if (!region || coords.length === 0) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: mutedBg }]}>
        <ThemedText style={[styles.hint, { color: muted }]}>No GPS path</ThemedText>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only; avoids web bundling `react-native-maps`
  const { default: MapView, Polyline } = require('react-native-maps') as typeof import('react-native-maps');

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        mapType="standard">
        <Polyline coordinates={coords} strokeColor={lineColor} strokeWidth={5} />
      </MapView>
    </View>
  );
}

export function TrackMap(props: Props) {
  return Platform.OS === 'web' ? <TrackMapWeb {...props} /> : <TrackMapNative {...props} />;
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  hint: {
    fontSize: 13,
  },
  caption: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontSize: 10,
  },
});
