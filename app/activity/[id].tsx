import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
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
import { TrackMap } from '@/components/run/track-map';
import { useAppData } from '@/context/app-data';
import { navigateToLogin } from '@/lib/auth-navigation';
import { openRouteInMaps } from '@/lib/maps';
import { STRAVA_ROUTE_ORANGE } from '@/constants/route-brand';
import { navigateToUserProfile } from '@/lib/profile-navigation';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const { allActivitiesById, likes, comments, toggleLike, addComment, isLoggedIn, profile } =
    useAppData();

  const activity = id ? allActivitiesById.get(id) : undefined;
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const inputBg = useThemeColor({}, 'inputBackground');
  const tint = useThemeColor({}, 'tint');
  const primaryText = useThemeColor({}, 'primaryButtonText');
  const textColor = useThemeColor({}, 'text');

  const likeState = activity
    ? likes[activity.id] ?? { liked: false, count: activity.stats.likes }
    : { liked: false, count: 0 };
  const thread = activity ? comments[activity.id] ?? [] : [];
  const commentTotal = activity
    ? activity.stats.comments + thread.length
    : 0;

  const submit = useCallback(() => {
    if (!activity || !draft.trim()) return;
    addComment(activity.id, draft);
    setDraft('');
  }, [activity, draft, addComment]);

  const focusInput = useCallback(() => {
    if (!isLoggedIn) {
      navigateToLogin(router);
      return;
    }
    inputRef.current?.focus();
  }, [isLoggedIn, router]);

  const goProfile = useCallback(() => {
    if (!activity) return;
    navigateToUserProfile(router, activity.user.username, {
      isLoggedIn,
      myUsername: profile.user.username,
    });
  }, [activity, router, isLoggedIn, profile.user.username]);

  if (!activity) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: bg }]}>
        <ThemedText type="subtitle">Activity not found</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={{ color: tint }}>Go back</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { user, activity: act } = activity;
  const accent = act.type === 'race' ? success : tint;
  const kindLine =
    act.type === 'race' ? 'Race or event · shared activity' : 'Training run · shared activity';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: card,
                borderBottomColor: border,
                borderLeftColor: accent,
              },
            ]}>
            <View style={styles.row}>
              <Pressable onPress={goProfile} accessibilityRole="button" accessibilityLabel={`${user.name} profile`}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              </Pressable>
              <View style={styles.headerText}>
                <View style={styles.nameRow}>
                  <Pressable onPress={goProfile} style={styles.namePress}>
                    <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
                  </Pressable>
                  <View style={[styles.typePill, { backgroundColor: mutedBg, borderColor: border }]}>
                    <ThemedText style={[styles.typePillText, { color: act.type === 'race' ? accent : tint }]}>
                      {act.type === 'race' ? 'RACE' : 'RUN'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <Pressable onPress={goProfile} hitSlop={{ top: 6, bottom: 6, left: 0, right: 4 }}>
                    <ThemedText style={[styles.meta, styles.handle, { color: tint }]}>@{user.username}</ThemedText>
                  </Pressable>
                  <ThemedText style={[styles.meta, { color: muted }]}> · {act.timestamp}</ThemedText>
                </View>
                <ThemedText style={[styles.kindLine, { color: muted }]}>{kindLine}</ThemedText>
              </View>
            </View>

            {act.title ? (
              <ThemedText type="defaultSemiBold" style={styles.title}>
                {act.title}
              </ThemedText>
            ) : null}

            {act.routeCoords && act.routeCoords.length >= 2 ? (
              <View style={[styles.mapWrap, { backgroundColor: mutedBg }]}>
                <TrackMap coords={act.routeCoords} height={192} strokeColor={STRAVA_ROUTE_ORANGE} />
              </View>
            ) : act.mapImage ? (
              <View style={[styles.mapWrap, { backgroundColor: mutedBg }]}>
                <Image source={{ uri: act.mapImage }} style={styles.mapImage} contentFit="cover" />
              </View>
            ) : null}

            <View
              style={[
                styles.statsGrid,
                {
                  borderColor: `${info}33`,
                  backgroundColor: mutedBg,
                },
              ]}>
              <View style={styles.statCol}>
                <ThemedText style={[styles.statLabel, { color: muted }]}>DISTANCE</ThemedText>
                <ThemedText type="defaultSemiBold">{act.distance.toFixed(2)} km</ThemedText>
              </View>
              <View style={styles.statCol}>
                <ThemedText style={[styles.statLabel, { color: muted }]}>TIME</ThemedText>
                <ThemedText type="defaultSemiBold">{act.duration}</ThemedText>
              </View>
              <View style={styles.statCol}>
                <ThemedText style={[styles.statLabel, { color: muted }]}>PACE</ThemedText>
                <ThemedText type="defaultSemiBold">{act.pace}</ThemedText>
              </View>
            </View>

            {act.route ? (
              <Pressable
                onPress={() => openRouteInMaps(act.route ?? '')}
                accessibilityRole="link"
                accessibilityLabel="Open route in maps">
                <ThemedText style={[styles.route, { color: muted }]}>
                  {act.route} <ThemedText style={{ color: tint }}>· Open in Maps</ThemedText>
                </ThemedText>
              </Pressable>
            ) : null}

            <View style={[styles.actions, { borderTopColor: border }]}>
              <Pressable
                onPress={() => {
                  if (!isLoggedIn) {
                    navigateToLogin(router);
                    return;
                  }
                  toggleLike(activity.id);
                }}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={likeState.liked ? 'Remove kudos' : 'Give kudos'}>
                <Ionicons
                  name={likeState.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={22}
                  color={likeState.liked ? tint : muted}
                />
                <ThemedText style={[styles.actionLabel, { color: muted }]}>Kudos</ThemedText>
                <ThemedText style={[styles.actionCount, { color: muted }]}>{likeState.count}</ThemedText>
              </Pressable>
              <Pressable
                onPress={focusInput}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Join discussion">
                <Ionicons name="chatbubbles-outline" size={20} color={muted} />
                <ThemedText style={[styles.actionLabel, { color: muted }]}>Comment</ThemedText>
                <ThemedText style={[styles.actionCount, { color: muted }]}>{commentTotal}</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Discussion
            </ThemedText>
            {thread.length === 0 ? (
              <ThemedText style={{ color: muted }}>
                No replies yet — start the thread with a question or a shout-out.
              </ThemedText>
            ) : (
              thread.map((c) => (
                <View
                  key={c.id}
                  style={[styles.commentRow, { borderBottomColor: border }]}
                  accessibilityRole="text">
                  <ThemedText type="defaultSemiBold">{c.author}</ThemedText>
                  <ThemedText style={styles.commentBody}>{c.body}</ThemedText>
                  <ThemedText style={[styles.time, { color: muted }]}>{c.time}</ThemedText>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: border, backgroundColor: card }]}>
          {isLoggedIn ? (
            <>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder="Add to the discussion…"
                placeholderTextColor={muted}
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={submit}
                style={[styles.send, { backgroundColor: tint }]}
                disabled={!draft.trim()}
                accessibilityRole="button"
                accessibilityLabel="Send comment">
                <ThemedText style={{ color: primaryText, fontWeight: '600' }}>Send</ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => navigateToLogin(router)}
              accessibilityRole="button"
              accessibilityLabel="Sign in to comment">
              <ThemedText style={[styles.signInHint, { color: tint }]}>
                Sign in to leave a comment — tap here.
              </ThemedText>
            </Pressable>
          )}
        </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  backBtn: {
    padding: 12,
  },
  scroll: {
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  namePress: {
    flex: 1,
    minWidth: 0,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kindLine: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 2,
  },
  handle: {
    fontWeight: '600',
  },
  title: {
    marginBottom: 10,
    fontSize: 18,
    lineHeight: 26,
  },
  mapWrap: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapImage: {
    width: '100%',
    height: 192,
  },
  statsGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  statCol: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  route: {
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  commentRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  commentBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    fontSize: 12,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  send: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signInHint: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 8,
  },
});
