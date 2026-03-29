import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ProfileHeader } from '@/components/run/profile-header';
import { ThemedText } from '@/components/themed-text';
import { USER_BIO_BY_USERNAME } from '@/constants/public-users';
import type { ProfileStats, ProfileUser } from '@/constants/run-data';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';

const GRID_GAP = 8;
const H_PAD = 16;
const COLS = 3;
const cellW =
  (Dimensions.get('window').width - H_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;

type Props = {
  username: string;
  /** Clears `username` query and shows your profile (Profile tab). */
  onBackToMe: () => void;
};

/** Placeholder social counts when we only have feed-derived run stats. */
const DEMO_FOLLOWERS = 142;
const DEMO_FOLLOWING = 98;

export function OtherUserProfile({ username, onBackToMe }: Props) {
  const router = useRouter();
  const { feed, userActivities } = useAppData();

  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  const [following, setFollowing] = useState(false);

  const publicData = useMemo(() => {
    const all = [...feed, ...userActivities];
    const theirs = all.filter((a) => a.user.username === username);
    if (theirs.length === 0) return null;
    const u = theirs[0].user;
    const km = theirs.reduce((s, a) => s + a.activity.distance, 0);
    return {
      user: u,
      activities: theirs,
      runs: theirs.length,
      totalKm: Math.round(km * 10) / 10,
      mapsWithPreview: theirs.filter((a) => Boolean(a.activity.mapImage)).length,
    };
  }, [feed, userActivities, username]);

  const bioExtra = USER_BIO_BY_USERNAME[username];
  const fallbackBio =
    'Runner on RunTogether — miles, jokes, and the occasional bad playlist.';

  const toggleFollow = useCallback(() => {
    setFollowing((f) => !f);
  }, []);

  const goPost = useCallback(() => {
    router.push('/(tabs)/post');
  }, [router]);

  if (!publicData) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: bg }]}>
        <View style={[styles.toolbar, { borderBottomColor: border, backgroundColor: card }]}>
          <Pressable onPress={onBackToMe} hitSlop={12} accessibilityRole="button">
            <ThemedText style={{ color: tint, fontSize: 16 }}>← Profile</ThemedText>
          </Pressable>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.center}>
          <ThemedText type="subtitle">No runner @{username}</ThemedText>
          <ThemedText style={[styles.muted, { color: muted }]}>
            We don’t have activities from this handle in the feed yet.
          </ThemedText>
        </View>
      </View>
    );
  }

  const { user, activities, runs, totalKm, mapsWithPreview } = publicData;

  const mergedUser: ProfileUser = {
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    location: bioExtra?.location ?? '',
    bio: bioExtra?.bio ?? fallbackBio,
  };

  const stats: ProfileStats = {
    totalRuns: runs,
    totalDistance: Math.round(totalKm),
    followers: DEMO_FOLLOWERS,
    following: DEMO_FOLLOWING,
  };

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={[styles.toolbar, { borderBottomColor: border, backgroundColor: card }]}>
        <Pressable onPress={onBackToMe} hitSlop={12} accessibilityRole="button">
          <ThemedText style={{ color: tint, fontSize: 16 }}>← My profile</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" numberOfLines={1} style={styles.toolbarTitle}>
          @{user.username}
        </ThemedText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ProfileHeader
          mode="public"
          user={mergedUser}
          stats={stats}
          mapsWithPreview={mapsWithPreview}
          following={following}
          onFollowToggle={toggleFollow}
          onSecondaryAction={goPost}
        />

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Activities
          </ThemedText>
          <View style={styles.grid}>
            {activities.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  router.push({ pathname: '/activity/[id]', params: { id: item.id } })
                }
                style={[styles.cell, { backgroundColor: mutedBg }]}
                accessibilityRole="button"
                accessibilityLabel="Open activity">
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  muted: {
    textAlign: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
  },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    paddingTop: 4,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cell: {
    width: cellW,
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
