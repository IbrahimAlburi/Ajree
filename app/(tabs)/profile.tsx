import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtherUserProfile } from '@/components/profile/other-user-profile';
import { ProfileHeader } from '@/components/run/profile-header';
import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/context/app-data';
import { AUTH_SIGN_UP_HREF, navigateToLogin } from '@/lib/auth-navigation';
import {
  buildMonthlyKmLeaderboard,
  findMonthlyRankBadge,
  mergeLeaderboardActivities,
} from '@/lib/leaderboard';
import { useThemeColor } from '@/hooks/use-theme-color';

const GRID_GAP = 8;
const H_PAD = 16;
const COLS = 3;
const cellWidth = (Dimensions.get('window').width - H_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;

function normalizeUsernameParam(raw: string | string[] | undefined): string {
  const s = typeof raw === 'string' ? raw : raw?.[0];
  return (s ?? '').trim().replace(/^@/, '');
}

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string | string[] }>();
  const viewUsername = normalizeUsernameParam(params.username);

  const { profile, userActivities, feed, isLoggedIn, hydrated } = useAppData();

  const mapsWithPreview = useMemo(
    () => userActivities.filter((a) => Boolean(a.activity.mapImage)).length,
    [userActivities],
  );

  const leaderboardBadge = useMemo(() => {
    if (!isLoggedIn || !profile.user.username?.trim()) return null;
    const allActivities = mergeLeaderboardActivities(feed, userActivities);
    const d = new Date();
    const entries = buildMonthlyKmLeaderboard(allActivities, d.getFullYear(), d.getMonth() + 1);
    const info = findMonthlyRankBadge(entries, profile.user.username);
    if (!info) return null;
    return {
      topPercent: info.topPercent,
      monthLabel: d.toLocaleString(undefined, { month: 'short' }),
    };
  }, [feed, userActivities, isLoggedIn, profile.user.username]);
  const bg = useThemeColor({}, 'background');
  const mutedBg = useThemeColor({}, 'muted');
  const muted = useThemeColor({}, 'mutedForeground');
  const text = useThemeColor({}, 'text');

  /** Someone else’s profile (or public browse while logged out). */
  const showOtherProfile =
    Boolean(viewUsername) && (!isLoggedIn || profile.user.username !== viewUsername);

  const goMyProfile = () => {
    router.navigate('/(tabs)/profile');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: bg }]} edges={['top']}>
        <ActivityIndicator size="large" />
        <ThemedText style={[styles.loadingText, { color: muted }]}>Loading…</ThemedText>
      </SafeAreaView>
    );
  }

  if (showOtherProfile && viewUsername) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
        <OtherUserProfile username={viewUsername} onBackToMe={goMyProfile} />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.tabTitle}>
            Profile
          </ThemedText>
          <ThemedText style={[styles.guestBody, { color: muted }]}>
            Sign in to save your runs, sync your profile with Firebase when configured, and show up on
            the leaderboard.
          </ThemedText>
          <View style={styles.authRow}>
            <Pressable
              onPress={() => navigateToLogin(router)}
              style={[styles.loginCta, styles.loginCtaHalf, { backgroundColor: mutedBg, borderColor: muted }]}>
              <ThemedText type="defaultSemiBold" style={[styles.loginCtaText, { color: text }]}>
                Sign in
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push(AUTH_SIGN_UP_HREF)}
              style={[styles.loginCta, styles.loginCtaHalf, { backgroundColor: mutedBg, borderColor: muted }]}>
              <ThemedText type="defaultSemiBold" style={[styles.loginCtaText, { color: text }]}>
                Sign up
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader
          user={profile.user}
          stats={profile.stats}
          mapsWithPreview={mapsWithPreview}
          leaderboardBadge={leaderboardBadge}
        />
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Activities
          </ThemedText>
          <View style={styles.grid}>
            {userActivities.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel="Open activity"
                onPress={() => router.push({ pathname: '/activity/[id]', params: { id: item.id } })}
                style={[styles.cell, { backgroundColor: mutedBg }]}>
                {item.activity.mapImage ? (
                  <Image
                    source={{ uri: item.activity.mapImage }}
                    style={styles.cellImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.cellPlaceholder, { backgroundColor: mutedBg }]} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  loginScroll: {
    paddingBottom: 32,
  },
  tabTitle: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 22,
  },
  guestBody: {
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  authRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  loginCta: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCtaHalf: {
    flex: 1,
  },
  loginCtaText: {
    fontSize: 16,
  },
  section: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: cellWidth,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellPlaceholder: {
    flex: 1,
  },
});
