import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ProfileStats, ProfileUser } from '@/constants/run-data';
import { formatProfileKm } from '@/lib/profile-format';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  user: ProfileUser;
  stats: ProfileStats;
  /** `public` = viewing someone else: same layout as your profile, no edit/settings. */
  mode?: 'owner' | 'public';
  following?: boolean;
  onFollowToggle?: () => void;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
  /** Activities that include a map image (routes on the map). */
  mapsWithPreview?: number;
  /** Monthly km leaderboard — “Top X%” for the current month (owner only). */
  leaderboardBadge?: { topPercent: number; monthLabel: string } | null;
};

export function ProfileHeader({
  user,
  stats,
  mode = 'owner',
  following = false,
  onFollowToggle,
  onSecondaryAction,
  secondaryLabel = 'Log a run',
  mapsWithPreview = 0,
  leaderboardBadge = null,
}: Props) {
  const router = useRouter();
  const isOwner = mode === 'owner';
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const primaryText = useThemeColor({}, 'primaryButtonText');
  const mutedBg = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');

  const kmFormatted = formatProfileKm(stats.totalDistance);

  const avatarEl = (
    <Image source={{ uri: user.avatar }} style={styles.avatar} />
  );

  const followersCell = isOwner ? (
    <Pressable
      style={styles.statBox}
      onPress={() =>
        router.push({ pathname: '/follow-list', params: { type: 'followers' } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${stats.followers} followers`}>
      <ThemedText style={[styles.statValue, { color: text }]}>{formatCount(stats.followers)}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: muted }]}>Followers</ThemedText>
    </Pressable>
  ) : (
    <View style={styles.statBox}>
      <ThemedText style={[styles.statValue, { color: text }]}>{formatCount(stats.followers)}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: muted }]}>Followers</ThemedText>
    </View>
  );

  const followingCell = isOwner ? (
    <Pressable
      style={styles.statBox}
      onPress={() =>
        router.push({ pathname: '/follow-list', params: { type: 'following' } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${stats.following} following`}>
      <ThemedText style={[styles.statValue, { color: text }]}>{formatCount(stats.following)}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: muted }]}>Following</ThemedText>
    </Pressable>
  ) : (
    <View style={styles.statBox}>
      <ThemedText style={[styles.statValue, { color: text }]}>{formatCount(stats.following)}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: muted }]}>Following</ThemedText>
    </View>
  );

  return (
    <View style={[styles.wrap, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
      {isOwner ? (
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            {leaderboardBadge ? (
              <Pressable
                onPress={() =>
                  router.navigate({
                    pathname: '/(tabs)',
                    params: { focus: 'leaderboard' },
                  })
                }
                style={[styles.rankPill, { backgroundColor: mutedBg, borderColor: borderColor }]}
                accessibilityRole="button"
                accessibilityLabel={`Leaderboard: top ${leaderboardBadge.topPercent} percent this month`}>
                <Ionicons name="podium-outline" size={14} color={tint} />
                <ThemedText style={[styles.rankPillText, { color: tint }]}>
                  Top {leaderboardBadge.topPercent}% · {leaderboardBadge.monthLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={styles.settingsBtnBare}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={12}
            onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={muted} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.hero, isOwner && styles.heroWithTopBar]}>
        {isOwner ? (
          <Pressable
            onPress={() => router.push('/edit-profile')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile photo">
            {avatarEl}
          </Pressable>
        ) : (
          avatarEl
        )}

        {isOwner ? (
          <Pressable onPress={() => router.push('/edit-profile')} accessibilityRole="button">
            <ThemedText type="subtitle" style={styles.centerText}>
              {user.name}
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="subtitle" style={styles.centerText}>
            {user.name}
          </ThemedText>
        )}
        {isOwner ? (
          <Pressable
            onPress={() => router.push('/edit-profile')}
            accessibilityRole="button"
            accessibilityLabel="Edit username">
            <ThemedText style={[styles.handle, { color: tint }]}>@{user.username}</ThemedText>
          </Pressable>
        ) : (
          <ThemedText style={[styles.handle, { color: tint }]}>@{user.username}</ThemedText>
        )}
        {user.location?.trim() ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={muted} />
            <ThemedText style={[styles.location, { color: muted }]}>{user.location}</ThemedText>
          </View>
        ) : null}
        <ThemedText style={[styles.bio, { color: muted }]}>{user.bio}</ThemedText>
      </View>

      <View style={[styles.statsPanel, { backgroundColor: mutedBg, borderColor: borderColor }]}>
        <View style={styles.statsRow}>
          {followersCell}
          <View style={[styles.vDivider, { backgroundColor: borderColor }]} />
          {followingCell}
        </View>

        <View style={[styles.hDivider, { backgroundColor: borderColor }]} />

        <View style={styles.statsRowThree}>
          <View style={styles.statBox}>
            <ThemedText style={[styles.statValueSm, { color: text }]}>{formatCount(stats.totalRuns)}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: muted }]}>Routes</ThemedText>
          </View>
          <View style={[styles.vDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValueSm, { color: text }]}>
              {kmFormatted}
              <Text style={[styles.unitInline, { color: muted }]}> km</Text>
            </Text>
            <ThemedText style={[styles.statLabel, { color: muted }]}>Total distance</ThemedText>
          </View>
          <View style={[styles.vDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statBox}>
            <ThemedText style={[styles.statValueSm, { color: text }]}>{formatCount(mapsWithPreview)}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: muted }]}>With map</ThemedText>
          </View>
        </View>
      </View>

      {isOwner ? (
        <Pressable
          style={[styles.editBtn, { backgroundColor: tint }]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={() => router.push('/edit-profile')}>
          <ThemedText style={[styles.editBtnText, { color: primaryText }]}>Edit Profile</ThemedText>
        </Pressable>
      ) : (
        <View style={styles.publicActions}>
          <Pressable
            onPress={onFollowToggle}
            style={[
              styles.followBtn,
              { backgroundColor: following ? mutedBg : tint, borderColor: borderColor },
              following && styles.followBtnOutline,
            ]}
            accessibilityRole="button"
            accessibilityLabel={following ? 'Unfollow' : 'Follow'}>
            <ThemedText
              style={{
                fontWeight: '700',
                color: following ? muted : primaryText,
                textAlign: 'center',
              }}>
              {following ? 'Following' : 'Follow'}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.msgBtn, { borderColor: borderColor }]}
            onPress={onSecondaryAction}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}>
            <ThemedText style={{ fontWeight: '600' }}>{secondaryLabel}</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function formatCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString();
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
    minHeight: 40,
    zIndex: 2,
  },
  topBarLeft: {
    flex: 1,
    paddingRight: 8,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rankPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingsBtnBare: {
    padding: 8,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  heroWithTopBar: {
    paddingTop: 0,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  centerText: {
    textAlign: 'center',
    fontSize: 22,
  },
  handle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  location: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  statsPanel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statsRowThree: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statValueSm: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  unitInline: {
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vDivider: {
    width: StyleSheet.hairlineWidth,
  },
  hDivider: {
    height: StyleSheet.hairlineWidth,
  },
  editBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  publicActions: {
    flexDirection: 'row',
    gap: 10,
  },
  followBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnOutline: {
    borderWidth: 1,
  },
  msgBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
