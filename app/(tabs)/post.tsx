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
import { DISTANCE_PRESETS_KM, ROUTE_MAP_IMAGES } from '@/constants/post-presets';
import { useAppData } from '@/context/app-data';
import { computePaceFromDuration } from '@/lib/run-math';
import { openRouteInMaps } from '@/lib/maps';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PostScreen() {
  const router = useRouter();
  const { publishActivity, isLoggedIn, profile } = useAppData();

  const [kind, setKind] = useState<'run' | 'race'>('run');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [distanceKm, setDistanceKm] = useState(5);
  const [duration, setDuration] = useState('32:00');
  const [paceOverride, setPaceOverride] = useState('');
  const [routeName, setRouteName] = useState('');
  const [mapIndex, setMapIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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

  const onPublish = useCallback(async () => {
    if (!isLoggedIn) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/(tabs)/profile');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    try {
      const id = publishActivity({
        type: kind,
        title,
        notes,
        distanceKm,
        durationMmSs: duration,
        pace: paceForPublish,
        routeName,
        mapImage: ROUTE_MAP_IMAGES[mapIndex] ?? ROUTE_MAP_IMAGES[0],
      });
      if (id) {
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
  ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}>
        <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
          <View>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Log a run
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: muted }]}>
              {isLoggedIn
                ? `Posting as @${profile.user.username}`
                : 'Sign in on Profile to publish'}
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
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.guestBanner, { backgroundColor: mutedBg, borderColor: border }]}>
              <Ionicons name="person-circle-outline" size={28} color={tint} />
              <View style={styles.guestText}>
                <ThemedText type="defaultSemiBold">Want to share this run?</ThemedText>
                <ThemedText style={[styles.guestHint, { color: muted }]}>
                  Tap here to sign in — takes two seconds with the demo accounts.
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </Pressable>
          ) : null}

          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <ThemedText style={[styles.label, { color: muted }]}>What did you do?</ThemedText>
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

          <View style={[styles.mapSection, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.mapSectionHead}>
              <ThemedText style={[styles.label, { color: muted }]}>Route vibe</ThemedText>
              <ThemedText style={[styles.mapHint, { color: muted }]}>
                Pick a cover — your real map link is the route name below
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
            placeholder="Give it a title (optional)"
            placeholderTextColor={muted}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: inputBg, color: text, borderColor: border }]}
          />

          <View style={[styles.routeRow, { backgroundColor: inputBg, borderColor: border }]}>
            <Ionicons name="location-outline" size={22} color={tint} style={styles.routeIcon} />
            <TextInput
              placeholder="Where’d you go? (opens in Maps)"
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
            <ThemedText style={[styles.label, { color: muted }]}>Distance (km)</ThemedText>
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
              <ThemedText style={[styles.label, { color: muted }]}>Time (mm:ss)</ThemedText>
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
              Auto pace from time ÷ distance: {autoPace}
            </ThemedText>
          ) : null}

          <TextInput
            placeholder="Caption — how did it feel? (optional)"
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
            accessibilityLabel="Publish activity">
            {submitting ? (
              <ActivityIndicator color={primaryText} />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={20} color={primaryText} />
                <ThemedText style={[styles.shareBtnText, { color: primaryText }]}>
                  {isLoggedIn ? 'Publish & view' : 'Sign in to publish'}
                </ThemedText>
              </>
            )}
          </Pressable>

          <ThemedText style={[styles.footerHint, { color: muted }]}>
            Publishing sends your run to the home feed and your profile. Open the route in Maps anytime
            from the pin row or the Maps button.
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
