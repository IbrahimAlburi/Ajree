import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { StravaRouteBuilderModal } from '@/components/run/strava-route-builder-modal';
import { TrackMap } from '@/components/run/track-map';
import { DISTANCE_PRESETS_KM, ROUTE_MAP_IMAGES } from '@/constants/post-presets';
import { STRAVA_ROUTE_ORANGE } from '@/constants/route-brand';
import type { RouteCoord } from '@/constants/run-data';
import { useAppData } from '@/context/app-data';
import { useTrackRecording } from '@/hooks/use-track-recording';
import { navigateToLogin } from '@/lib/auth-navigation';
import { computePaceFromDuration } from '@/lib/run-math';
import { openRouteInMaps } from '@/lib/maps';
import { accumulatedDistanceKm } from '@/lib/route-geo';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PostScreen() {
  const router = useRouter();
  const { publishActivity, isLoggedIn, profile } = useAppData();
  const track = useTrackRecording();

  const [kind, setKind] = useState<'run' | 'race'>('run');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [distanceKm, setDistanceKm] = useState(5);
  const [duration, setDuration] = useState('32:00');
  const [paceOverride, setPaceOverride] = useState('');
  const [routeName, setRouteName] = useState('');
  const [mapIndex, setMapIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [plannedCoords, setPlannedCoords] = useState<RouteCoord[]>([]);
  const [routeBuilderOpen, setRouteBuilderOpen] = useState(false);

  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const inputBg = useThemeColor({}, 'inputBackground');
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const primaryText = useThemeColor({}, 'primaryButtonText');
  const success = useThemeColor({}, 'success');

  const autoPace = useMemo(
    () => computePaceFromDuration(distanceKm, duration),
    [distanceKm, duration],
  );
  const paceForPublish = paceOverride.trim() || autoPace || '5:00/km';

  const plannedKm = useMemo(() => accumulatedDistanceKm(plannedCoords), [plannedCoords]);

  const bumpDistance = useCallback((delta: number) => {
    void Haptics.selectionAsync();
    setDistanceKm((d) => Math.max(0.5, Math.round((d + delta) * 2) / 2));
  }, []);

  const pickPreset = useCallback((km: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDistanceKm(km);
  }, []);

  const onPreviewRoute = useCallback(() => {
    void Haptics.selectionAsync();
    const q = routeName.trim() || 'Running route';
    openRouteInMaps(q);
  }, [routeName]);

  const applyGpsDistance = useCallback(() => {
    if (track.gpsKm == null || track.gpsKm <= 0) return;
    void Haptics.selectionAsync();
    setDistanceKm(Math.round(track.gpsKm * 10) / 10);
  }, [track.gpsKm]);

  const applyPlannedDistance = useCallback(() => {
    if (plannedKm <= 0) return;
    void Haptics.selectionAsync();
    setDistanceKm(Math.round(plannedKm * 10) / 10);
  }, [plannedKm]);

  const clearPlanned = useCallback(() => {
    void Haptics.selectionAsync();
    setPlannedCoords([]);
  }, []);

  const onPublish = useCallback(async () => {
    if (!isLoggedIn) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigateToLogin(router);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    try {
      await track.stop();
      const routeCoords =
        plannedCoords.length >= 2
          ? plannedCoords
          : track.coords.length >= 2
            ? track.coords
            : undefined;
      const id = publishActivity({
        type: kind,
        title,
        notes,
        distanceKm,
        durationMmSs: duration,
        pace: paceForPublish,
        routeName,
        mapImage: ROUTE_MAP_IMAGES[mapIndex] ?? ROUTE_MAP_IMAGES[0],
        routeCoords,
      });
      if (id) {
        track.clear();
        setPlannedCoords([]);
        router.push({ pathname: '/activity/[id]', params: { id } });
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    isLoggedIn,
    router,
    publishActivity,
    kind,
    title,
    notes,
    distanceKm,
    duration,
    paceForPublish,
    routeName,
    mapIndex,
    track,
    plannedCoords,
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}>
        <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
          <View style={styles.headerTextCol}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Log activity
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: muted }]}>
              {isLoggedIn
                ? `Sharing as @${profile.user.username} · Home & profile`
                : 'Sign in to share a workout to your feed'}
            </ThemedText>
          </View>
          <Pressable
            style={[styles.previewMaps, { borderColor: tint }]}
            onPress={onPreviewRoute}
            hitSlop={8}>
            <Ionicons name="map-outline" size={18} color={tint} />
            <ThemedText style={{ color: tint, fontWeight: '600', fontSize: 13 }}>Maps</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {!isLoggedIn ? (
            <Pressable
              onPress={() => navigateToLogin(router)}
              style={[styles.guestBanner, { backgroundColor: mutedBg, borderColor: border }]}>
              <Ionicons name="person-circle-outline" size={28} color={tint} />
              <View style={styles.guestText}>
                <ThemedText type="defaultSemiBold">Share workouts with your network</ThemedText>
                <ThemedText style={[styles.guestHint, { color: muted }]}>
                  Sign in to log workouts with stats, route preview, and a short reflection. Demo
                  accounts work when Firebase is off.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </Pressable>
          ) : null}

          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <ThemedText style={[styles.label, { color: muted }]}>Activity type</ThemedText>
            <View style={styles.kindRow}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setKind('run');
                }}
                style={[
                  styles.kindChip,
                  { borderColor: border, backgroundColor: kind === 'run' ? mutedBg : 'transparent' },
                  kind === 'run' && { borderColor: tint },
                ]}>
                <Ionicons
                  name="walk-outline"
                  size={20}
                  color={kind === 'run' ? tint : muted}
                />
                <ThemedText style={{ color: kind === 'run' ? text : muted, fontWeight: '600' }}>
                  Run
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setKind('race');
                }}
                style={[
                  styles.kindChip,
                  { borderColor: border, backgroundColor: kind === 'race' ? mutedBg : 'transparent' },
                  kind === 'race' && { borderColor: success },
                ]}>
                <Ionicons
                  name="ribbon-outline"
                  size={20}
                  color={kind === 'race' ? success : muted}
                />
                <ThemedText style={{ color: kind === 'race' ? text : muted, fontWeight: '600' }}>
                  Race / PR
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <ThemedText style={[styles.label, { color: muted }]}>GPS track (optional)</ThemedText>
            <ThemedText style={[styles.gpsHint, { color: muted }]}>
              Start before your run, stop when you finish — we draw the path on the activity. Works on
              device; web shows a simple line preview.
            </ThemedText>
            {track.error ? (
              <ThemedText style={[styles.gpsError, { color: '#c62828' }]}>{track.error}</ThemedText>
            ) : null}
            <View style={styles.gpsActions}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  void track.start();
                }}
                disabled={track.isRecording}
                style={[
                  styles.gpsBtn,
                  { borderColor: border, backgroundColor: track.isRecording ? mutedBg : card },
                  track.isRecording && { opacity: 0.6 },
                ]}>
                <Ionicons name="radio-button-on" size={18} color={tint} />
                <ThemedText style={{ fontWeight: '600', color: text }}>Start</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  void track.stop();
                }}
                disabled={!track.isRecording}
                style={[
                  styles.gpsBtn,
                  { borderColor: border, backgroundColor: card },
                  !track.isRecording && { opacity: 0.5 },
                ]}>
                <Ionicons name="stop" size={18} color={text} />
                <ThemedText style={{ fontWeight: '600', color: text }}>Stop</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  track.clear();
                }}
                style={[styles.gpsBtn, { borderColor: border, backgroundColor: card }]}>
                <Ionicons name="trash-outline" size={18} color={muted} />
                <ThemedText style={{ fontWeight: '600', color: muted }}>Clear</ThemedText>
              </Pressable>
            </View>
            {track.isRecording ? (
              <ThemedText style={[styles.recordingLine, { color: success }]}>Recording GPS…</ThemedText>
            ) : null}
            {track.gpsKm != null && track.gpsKm > 0 ? (
              <View style={styles.gpsMeta}>
                <ThemedText style={{ color: muted, fontSize: 13 }}>
                  Track ~{track.gpsKm.toFixed(2)} km · {track.coords.length} points
                </ThemedText>
                <Pressable
                  onPress={applyGpsDistance}
                  style={[styles.gpsApply, { backgroundColor: mutedBg, borderColor: border }]}>
                  <ThemedText style={{ color: tint, fontWeight: '700', fontSize: 13 }}>
                    Use GPS distance
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
            {track.coords.length >= 2 ? (
              <View style={styles.gpsMap}>
                <TrackMap coords={track.coords} height={140} />
              </View>
            ) : null}
          </View>

          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <ThemedText style={[styles.label, { color: muted }]}>Route builder</ThemedText>
            <ThemedText style={[styles.gpsHint, { color: muted }]}>
              Full-screen map: tap to add points in order, see distance and elevation gain (Strava-style).
              With 2+ points, this path is saved on the activity instead of a GPS recording.
            </ThemedText>
            {plannedCoords.length >= 2 && track.coords.length >= 2 ? (
              <ThemedText style={[styles.routePriorityHint, { color: STRAVA_ROUTE_ORANGE }]}>
                Planned route will be used (not the GPS track).
              </ThemedText>
            ) : null}
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRouteBuilderOpen(true);
              }}
              style={[styles.stravaBuildBtn, { backgroundColor: STRAVA_ROUTE_ORANGE }]}>
              <Ionicons name="map-outline" size={22} color="#fff" />
              <ThemedText style={styles.stravaBuildBtnText}>
                {plannedCoords.length >= 2 ? 'Edit route' : 'Build route'}
              </ThemedText>
            </Pressable>
            {plannedCoords.length > 0 ? (
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  clearPlanned();
                }}
                style={styles.clearRouteLink}>
                <ThemedText style={{ color: muted, fontSize: 13, fontWeight: '600' }}>
                  Clear planned route
                </ThemedText>
              </Pressable>
            ) : null}
            {plannedKm > 0 ? (
              <View style={styles.gpsMeta}>
                <ThemedText style={{ color: muted, fontSize: 13 }}>
                  Route ~{plannedKm.toFixed(2)} km · {plannedCoords.length} points
                </ThemedText>
                <Pressable
                  onPress={applyPlannedDistance}
                  style={[styles.gpsApply, { backgroundColor: mutedBg, borderColor: border }]}>
                  <ThemedText style={{ color: STRAVA_ROUTE_ORANGE, fontWeight: '700', fontSize: 13 }}>
                    Use route distance
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
            {plannedCoords.length >= 2 ? (
              <View style={styles.gpsMap}>
                <TrackMap coords={plannedCoords} height={140} strokeColor={STRAVA_ROUTE_ORANGE} />
              </View>
            ) : null}
          </View>

          <StravaRouteBuilderModal
            visible={routeBuilderOpen}
            initialCoords={plannedCoords}
            onClose={() => setRouteBuilderOpen(false)}
            onSave={(c) => setPlannedCoords(c)}
          />

          <View style={[styles.mapSection, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.mapSectionHead}>
              <ThemedText style={[styles.label, { color: muted }]}>Route preview</ThemedText>
              <ThemedText style={[styles.mapHint, { color: muted }]}>
                Choose a cover image — the route field below opens in Maps (Strava-style recap).
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mapScroll}>
              {ROUTE_MAP_IMAGES.map((uri, i) => (
                <Pressable
                  key={uri}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setMapIndex(i);
                  }}
                  style={[
                    styles.mapPick,
                    mapIndex === i && styles.mapPickOn,
                    mapIndex === i && { borderColor: tint },
                  ]}>
                  <Image source={{ uri }} style={styles.mapThumb} contentFit="cover" />
                  {mapIndex === i ? (
                    <View style={[styles.mapCheck, { backgroundColor: tint }]}>
                      <Ionicons name="checkmark" size={16} color={primaryText} />
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <TextInput
            placeholder="Headline — e.g. Tempo Tuesday, first half marathon"
            placeholderTextColor={muted}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
          />

          <View style={[styles.routeRow, { backgroundColor: inputBg, borderColor: border }]}>
            <Ionicons name="location-outline" size={22} color={tint} style={styles.routeIcon} />
            <TextInput
              placeholder="Route or location — opens in Maps"
              placeholderTextColor={muted}
              value={routeName}
              onChangeText={setRouteName}
              style={[styles.routeInput, { color: text }]}
            />
            <Pressable
              onPress={onPreviewRoute}
              style={[styles.routeGo, { backgroundColor: tint }]}
              accessibilityLabel="Open route in maps">
              <Ionicons name="navigate" size={18} color={primaryText} />
            </Pressable>
          </View>

          <View style={styles.distanceBlock}>
            <ThemedText style={[styles.label, { color: muted }]}>Distance · km</ThemedText>
            <View style={styles.distanceMain}>
              <Pressable
                onPress={() => bumpDistance(-0.5)}
                style={[styles.stepper, { borderColor: border, backgroundColor: card }]}>
                <Ionicons name="remove" size={22} color={tint} />
              </Pressable>
              <ThemedText type="subtitle" style={styles.distanceNum}>
                {distanceKm.toFixed(1)}
              </ThemedText>
              <Pressable
                onPress={() => bumpDistance(0.5)}
                style={[styles.stepper, { borderColor: border, backgroundColor: card }]}>
                <Ionicons name="add" size={22} color={tint} />
              </Pressable>
            </View>
            <View style={styles.presets}>
              {DISTANCE_PRESETS_KM.map((km) => (
                <Pressable
                  key={km}
                  onPress={() => pickPreset(km)}
                  style={[
                    styles.presetChip,
                    { borderColor: border, backgroundColor: km === distanceKm ? mutedBg : card },
                  ]}>
                  <ThemedText
                    style={{
                      fontWeight: '600',
                      color: km === distanceKm ? tint : muted,
                      fontSize: 13,
                    }}>
                    {km}k
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.half}>
              <ThemedText style={[styles.label, { color: muted }]}>Moving time (mm:ss)</ThemedText>
              <TextInput
                placeholder="32:00"
                placeholderTextColor={muted}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numbers-and-punctuation"
                style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              />
            </View>
            <View style={styles.half}>
              <ThemedText style={[styles.label, { color: muted }]}>Pace (optional)</ThemedText>
              <TextInput
                placeholder={autoPace || '5:30/km'}
                placeholderTextColor={muted}
                value={paceOverride}
                onChangeText={setPaceOverride}
                style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
              />
            </View>
          </View>
          {autoPace ? (
            <ThemedText style={[styles.autoPace, { color: muted }]}>
              Calculated pace: {autoPace} — override above if you wore a watch
            </ThemedText>
          ) : null}

          <TextInput
            placeholder="Reflection — wins, lessons, or what’s next (optional)"
            placeholderTextColor={muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            style={[styles.textarea, { backgroundColor: inputBg, color: text, borderColor: border }]}
          />

          <Pressable
            style={[
              styles.shareBtn,
              { backgroundColor: isLoggedIn ? tint : muted },
              submitting && { opacity: 0.85 },
            ]}
            onPress={onPublish}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Share activity">
            {submitting ? (
              <ActivityIndicator color={primaryText} />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color={primaryText} />
                <ThemedText style={[styles.shareBtnText, { color: primaryText }]}>
                  {isLoggedIn ? 'Share activity' : 'Sign in to share'}
                </ThemedText>
              </>
            )}
          </Pressable>

          <ThemedText style={[styles.footerHint, { color: muted }]}>
            Your activity appears in Discover, Your crew, and on your profile. Others can send kudos
            and join the discussion on the activity.
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  previewMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  guestText: {
    flex: 1,
    gap: 4,
  },
  guestHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'none',
  },
  kindRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kindChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  gpsHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  routePriorityHint: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  stravaBuildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  stravaBuildBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 17,
  },
  clearRouteLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  gpsError: {
    fontSize: 13,
    marginTop: 4,
  },
  gpsActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  recordingLine: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  gpsMeta: {
    marginTop: 10,
    gap: 8,
  },
  gpsApply: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gpsMap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapSection: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
  },
  mapSectionHead: {
    gap: 4,
  },
  mapHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  mapScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  mapPick: {
    width: 112,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mapPickOn: {},
  mapThumb: {
    width: '100%',
    height: '100%',
  },
  mapCheck: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
  },
  routeIcon: {
    marginRight: 8,
  },
  routeInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  routeGo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBlock: {
    gap: 10,
  },
  distanceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceNum: {
    fontSize: 36,
    minWidth: 100,
    textAlign: 'center',
    letterSpacing: -1,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
    gap: 6,
  },
  autoPace: {
    fontSize: 13,
    marginTop: -6,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  shareBtnText: {
    fontWeight: '700',
    fontSize: 17,
  },
  footerHint: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },
});
