import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/run/activity-card';
import { HomeHero } from '@/components/run/home-hero';
import { MonthlyLeaderboard } from '@/components/run/monthly-leaderboard';
import { ThemedText } from '@/components/themed-text';
import type { FeedActivity } from '@/constants/run-data';
import { mockFollowing } from '@/constants/run-data';
import { useAppData } from '@/context/app-data';
import { getFeedModeLabel, pickHeaderTagline, pickPulseTips } from '@/lib/home-copy';
import { buildMonthlyKmLeaderboard, mergeLeaderboardActivities } from '@/lib/leaderboard';
import { useThemeColor } from '@/hooks/use-theme-color';

const FOLLOWING_USERNAMES = new Set(mockFollowing.map((f) => f.username));

type FeedMode = 'foryou' | 'following';

function filterFeedByMode(feed: FeedActivity[], mode: FeedMode): FeedActivity[] {
  if (mode === 'following') {
    return feed.filter((a) => FOLLOWING_USERNAMES.has(a.user.username));
  }
  return feed;
}

export default function HomeScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams<{ focus?: string | string[] }>();
  const globalParams = useGlobalSearchParams<{ focus?: string | string[] }>();
  const rawFocus = localParams.focus ?? globalParams.focus;
  const focusParam = typeof rawFocus === 'string' ? rawFocus : rawFocus?.[0];

  const { feed, userActivities, refreshFeed, notifications, profile, isLoggedIn } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('foryou');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [leaderboardTop, setLeaderboardTop] = useState(0);
  const [leaderboardExpanded, setLeaderboardExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const headerTagline = useMemo(() => pickHeaderTagline(), []);
  const pulseTips = useMemo(() => pickPulseTips(), []);
  const feedCopy = useMemo(() => getFeedModeLabel(feedMode), [feedMode]);

  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const destructive = useThemeColor({}, 'destructive');
  const tint = useThemeColor({}, 'tint');
  const mutedBg = useThemeColor({}, 'muted');
  const primaryText = useThemeColor({}, 'primaryButtonText');
  const text = useThemeColor({}, 'text');

  const unread = notifications.filter((n) => !n.read).length;

  const displayedFeed = useMemo(
    () => filterFeedByMode(feed, feedMode),
    [feed, feedMode],
  );

  const allActivities = useMemo(
    () => mergeLeaderboardActivities(feed, userActivities),
    [feed, userActivities],
  );

  const leaderboard = useMemo(
    () =>
      buildMonthlyKmLeaderboard(allActivities, monthCursor.year, monthCursor.month),
    [allActivities, monthCursor.year, monthCursor.month],
  );

  const firstName = profile.user.name.trim().split(/\s+/)[0] ?? '';

  useEffect(() => {
    if (focusParam !== 'leaderboard') return;
    setLeaderboardExpanded(true);
  }, [focusParam]);

  useEffect(() => {
    if (focusParam !== 'leaderboard' || !leaderboardExpanded || leaderboardTop <= 0) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, leaderboardTop - 12),
        animated: true,
      });
      router.setParams({ focus: undefined });
    }, 80);
    return () => clearTimeout(t);
  }, [focusParam, leaderboardExpanded, leaderboardTop, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshFeed();
    } finally {
      setRefreshing(false);
    }
  };

  const goPost = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/post');
  };

  const scrollToLeaderboard = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const y = Math.max(0, leaderboardTop - 12);
    const scroll = () => {
      if (leaderboardTop > 0) {
        scrollRef.current?.scrollTo({ y, animated: true });
      }
    };
    if (!leaderboardExpanded) {
      setLeaderboardExpanded(true);
      setTimeout(scroll, 160);
    } else {
      scroll();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoMark, { backgroundColor: tint }]}>
            <Ionicons name="footsteps" size={17} color={primaryText} />
          </View>
          <View style={styles.headerTitles}>
            <ThemedText type="subtitle" style={[styles.brand, { color: text }]}>
              RunTogether
            </ThemedText>
            <ThemedText style={[styles.headerSub, { color: muted }]}>{headerTagline}</ThemedText>
          </View>
        </View>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
          style={[styles.bellCircle, { backgroundColor: mutedBg }]}>
          <Ionicons name="notifications-outline" size={22} color={muted} />
          {unread > 0 ? (
            <View style={[styles.badge, { backgroundColor: destructive }]}>
              <ThemedText style={styles.badgeText}>{unread > 9 ? '9+' : unread}</ThemedText>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tint} />
        }>
        <HomeHero
          isLoggedIn={isLoggedIn}
          firstName={firstName}
          stats={isLoggedIn ? profile.stats : null}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pulseScroll}
          style={styles.pulseScrollView}>
          {pulseTips.map((tip, i) => (
            <View
              key={`${tip.text}-${i}`}
              style={[styles.pulseChip, { backgroundColor: card, borderColor: border }]}>
              <Ionicons name={tip.icon} size={17} color={tint} />
              <ThemedText style={[styles.pulseText, { color: text }]} numberOfLines={2}>
                {tip.text}
              </ThemedText>
            </View>
          ))}
        </ScrollView>

        <View style={styles.quickRow}>
          <Pressable
            onPress={goPost}
            style={[styles.quickPrimary, { backgroundColor: tint }]}
            accessibilityRole="button"
            accessibilityLabel="Log a run">
            <Ionicons name="add-circle-outline" size={22} color={primaryText} />
            <ThemedText style={[styles.quickPrimaryText, { color: primaryText }]}>Log a run</ThemedText>
          </Pressable>
          <Pressable
            onPress={scrollToLeaderboard}
            style={[styles.quickSecondary, { borderColor: tint, backgroundColor: card }]}
            accessibilityRole="button"
            accessibilityLabel="Scroll to monthly leaderboard">
            <Ionicons name="podium-outline" size={21} color={tint} />
            <ThemedText style={[styles.quickSecondaryText, { color: tint }]}>Leaderboard</ThemedText>
          </Pressable>
        </View>

        <View
          onLayout={(e) => setLeaderboardTop(e.nativeEvent.layout.y)}
          style={styles.leaderboardSection}>
          <View style={[styles.leaderboardCard, { backgroundColor: card, borderColor: border }]}>
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLeaderboardExpanded((v) => !v);
              }}
              style={styles.leaderboardDisclosure}
              accessibilityRole="button"
              accessibilityState={{ expanded: leaderboardExpanded }}
              accessibilityLabel={
                leaderboardExpanded
                  ? 'Collapse monthly leaderboard'
                  : 'Expand monthly leaderboard'
              }>
              <View style={styles.leaderboardDisclosureLeft}>
                <View style={[styles.feedEyebrowDot, { backgroundColor: tint }]} />
                <View style={styles.leaderboardDisclosureTitles}>
                  <ThemedText style={[styles.leaderboardEyebrow, { color: tint }]}>
                    Leaderboard
                  </ThemedText>
                  <ThemedText style={[styles.leaderboardDisclosureTitle, { color: text }]}>
                    Monthly km leaderboard
                  </ThemedText>
                  {!leaderboardExpanded ? (
                    <ThemedText style={[styles.leaderboardDisclosureHint, { color: muted }]}>
                      Tap to open rankings
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              <Ionicons
                name={leaderboardExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={tint}
              />
            </Pressable>

            {leaderboardExpanded ? (
              <>
                <ThemedText style={[styles.leaderboardSub, { color: muted }]}>
                  Rankings by distance this month — tap a runner for their profile
                </ThemedText>
                <MonthlyLeaderboard
                  entries={leaderboard}
                  monthYear={monthCursor}
                  onMonthChange={setMonthCursor}
                  currentUsername={profile.user.username}
                  isLoggedIn={isLoggedIn}
                />
              </>
            ) : null}
          </View>
        </View>

        <View style={[styles.feedSurface, { borderColor: border }]}>
          <View style={styles.feedIntro}>
            <View style={styles.feedIntroTop}>
              <View style={[styles.feedEyebrowDot, { backgroundColor: tint }]} />
              <ThemedText style={[styles.feedEyebrow, { color: tint }]}>
                {feedCopy.eyebrow}
              </ThemedText>
            </View>
            <ThemedText style={[styles.feedTitle, { color: text }]}>{feedCopy.title}</ThemedText>
            <ThemedText style={[styles.feedMeta, { color: muted }]}>
              {displayedFeed.length} activit{displayedFeed.length === 1 ? 'y' : 'ies'}
              {feedMode === 'foryou' ? ' in this stream' : ' from people you follow'}
            </ThemedText>
          </View>

          <View style={styles.feedToolbar}>
            <View style={[styles.segment, { backgroundColor: mutedBg }]}>
              <Pressable
                onPress={() => setFeedMode('foryou')}
                style={[
                  styles.segmentBtn,
                  feedMode === 'foryou' && { backgroundColor: card },
                  feedMode === 'foryou' && styles.segmentBtnActive,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: feedMode === 'foryou' }}>
                <ThemedText
                  style={[
                    styles.segmentLabel,
                    { color: feedMode === 'foryou' ? tint : muted },
                  ]}>
                  Discover
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setFeedMode('following')}
                style={[
                  styles.segmentBtn,
                  feedMode === 'following' && { backgroundColor: card },
                  feedMode === 'following' && styles.segmentBtnActive,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: feedMode === 'following' }}>
                <ThemedText
                  style={[
                    styles.segmentLabel,
                    { color: feedMode === 'following' ? tint : muted },
                  ]}>
                  Your crew
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {displayedFeed.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: mutedBg, borderColor: border }]}>
              <ThemedText style={styles.emptyEmoji}>🌿</ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.emptyTitle, { color: text }]}>
                Kinda quiet in here
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: muted }]}>
                Nothing to show with this filter. Flip back to Discover and the feed comes alive
                again.
              </ThemedText>
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: tint }]}
                onPress={() => setFeedMode('foryou')}
                accessibilityRole="button">
                <ThemedText style={{ color: primaryText, fontWeight: '600' }}>Back to Discover</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.feedList}>
              {displayedFeed.map((item) => (
                <ActivityCard key={item.id} {...item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    gap: 3,
    flex: 1,
  },
  brand: {
    fontSize: 21,
    letterSpacing: -0.4,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  bellCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  pulseScrollView: {
    marginTop: 4,
    maxHeight: 92,
  },
  pulseScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 4,
  },
  pulseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 280,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pulseText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  quickPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  quickPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  quickSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  leaderboardSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  leaderboardCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    paddingTop: 14,
  },
  leaderboardDisclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leaderboardDisclosureLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  leaderboardDisclosureTitles: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  leaderboardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  leaderboardDisclosureTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  leaderboardDisclosureHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  leaderboardSub: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  feedSurface: {
    marginHorizontal: 12,
    marginTop: 20,
    paddingTop: 18,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  feedIntro: {
    paddingHorizontal: 8,
    marginBottom: 14,
    gap: 8,
  },
  feedIntroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  feedTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  feedMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedToolbar: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  feedList: {
    paddingBottom: 8,
  },
  empty: {
    marginHorizontal: 8,
    marginTop: 4,
    padding: 24,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 6,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
});
