import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoutePlanner } from '@/components/run/route-planner';
import { STRAVA_ROUTE_ORANGE } from '@/constants/route-brand';
import type { RouteCoord } from '@/constants/run-data';
import { fetchElevationGainForRoute } from '@/lib/elevation';
import { accumulatedDistanceKm } from '@/lib/route-geo';

type Props = {
  visible: boolean;
  initialCoords: RouteCoord[];
  onClose: () => void;
  /** Called when user taps Done with current path (may be empty). */
  onSave: (coords: RouteCoord[]) => void;
};

export function StravaRouteBuilderModal({ visible, initialCoords, onClose, onSave }: Props) {
  const [coords, setCoords] = useState<RouteCoord[]>(initialCoords);
  const [elevM, setElevM] = useState<number | null | 'loading'>('loading');
  const distanceKm = useMemo(() => accumulatedDistanceKm(coords), [coords]);

  const wasVisible = useRef(false);
  useEffect(() => {
    if (visible && !wasVisible.current) {
      setCoords(initialCoords);
    }
    wasVisible.current = visible;
  }, [visible, initialCoords]);

  useEffect(() => {
    if (!visible || coords.length < 2) {
      setElevM(null);
      return;
    }
    setElevM('loading');
    const t = setTimeout(() => {
      void fetchElevationGainForRoute(coords).then((g) => setElevM(g));
    }, 450);
    return () => clearTimeout(t);
  }, [coords, visible]);

  const undo = useCallback(() => {
    void Haptics.selectionAsync();
    setCoords((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCoords([]);
  }, []);

  const done = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(coords);
    onClose();
  }, [coords, onSave, onClose]);

  const handleClose = useCallback(() => {
    void Haptics.selectionAsync();
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={12} style={styles.headerBtn} accessibilityLabel="Close">
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerTitle}>Route</Text>
              <Text style={styles.headerSub}>Tap map to drop points · travel order</Text>
            </View>
            <Pressable onPress={done} style={styles.doneBtn} accessibilityLabel="Save route">
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.mapShell}>
          <RoutePlanner
            coords={coords}
            onChange={setCoords}
            fillContainer
            routeColor={STRAVA_ROUTE_ORANGE}
            mapStyle="muted"
          />
        </View>

        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>DISTANCE</Text>
              <Text style={styles.metricValue}>{distanceKm.toFixed(2)} km</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>ELEV GAIN</Text>
              {elevM === 'loading' ? (
                <ActivityIndicator size="small" color={STRAVA_ROUTE_ORANGE} style={{ marginTop: 4 }} />
              ) : (
                <Text style={styles.metricValue}>{elevM == null ? '—' : `${elevM} m`}</Text>
              )}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={undo}
              disabled={coords.length === 0}
              style={[styles.actionBtn, coords.length === 0 && styles.actionBtnOff]}>
              <Ionicons name="arrow-undo" size={22} color="#fff" />
              <Text style={styles.actionLabel}>Undo</Text>
            </Pressable>
            <Pressable
              onPress={clear}
              disabled={coords.length === 0}
              style={[styles.actionBtn, coords.length === 0 && styles.actionBtnOff]}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
              <Text style={styles.actionLabel}>Clear</Text>
            </Pressable>
          </View>
          {Platform.OS === 'web' ? (
            <Text style={styles.webNote}>
              Web uses a demo grid — use the mobile app for real streets and GPS.
            </Text>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  safe: {
    backgroundColor: '#0d0d0d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 8,
  },
  headerBtn: {
    padding: 8,
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: STRAVA_ROUTE_ORANGE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  doneBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  mapShell: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#111',
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#333',
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionBtnOff: {
    opacity: 0.35,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  webNote: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
});
