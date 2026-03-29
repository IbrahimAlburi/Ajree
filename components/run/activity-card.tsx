import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/context/app-data';
import type { FeedActivity } from '@/constants/run-data';
import { openRouteInMaps } from '@/lib/maps';
import { navigateToUserProfile } from '@/lib/profile-navigation';
import { useThemeColor } from '@/hooks/use-theme-color';

export function ActivityCard({ id, user, activity, stats }: FeedActivity) {
  const router = useRouter();
  const { likes, comments, toggleLike, profile, isLoggedIn } = useAppData();
  const likeState = likes[id] ?? { liked: false, count: stats.likes };
  const extraComments = comments[id]?.length ?? 0;
  const commentCount = stats.comments + extraComments;

  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedForeground');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const destructive = useThemeColor({}, 'destructive');
  const mutedBg = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  const handleLike = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(id);
  };

  const handleComment = () => {
    router.push({ pathname: '/activity/[id]', params: { id } });
  };

  const goProfile = () => {
    void Haptics.selectionAsync();
    navigateToUserProfile(router, user.username, {
      isLoggedIn,
      myUsername: profile.user.username,
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor: borderColor }]}>
      <View style={styles.row}>
        <Pressable onPress={goProfile} accessibilityRole="button" accessibilityLabel={`${user.name} profile`}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </Pressable>
        <View style={styles.headerText}>
          <Pressable onPress={goProfile}>
            <View style={styles.nameRow}>
              <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
              {activity.type === 'race' && (
                <Ionicons name="ribbon" size={16} color={success} style={styles.award} />
              )}
            </View>
          </Pressable>
          <View style={styles.metaRow}>
            <Pressable onPress={goProfile} hitSlop={{ top: 6, bottom: 6, left: 0, right: 4 }}>
              <ThemedText style={[styles.meta, styles.handle, { color: tint }]}>
                @{user.username}
              </ThemedText>
            </Pressable>
            <ThemedText style={[styles.meta, { color: muted }]}> · {activity.timestamp}</ThemedText>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/activity/[id]', params: { id } })}
        accessibilityRole="button"
        accessibilityLabel={`Open activity from ${user.name}`}>
        {activity.title ? (
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {activity.title}
          </ThemedText>
        ) : null}

        {activity.mapImage ? (
          <View style={[styles.mapWrap, { backgroundColor: mutedBg }]}>
            <Image source={{ uri: activity.mapImage }} style={styles.mapImage} contentFit="cover" />
          </View>
        ) : null}
      </Pressable>

      <View
        style={[
          styles.statsGrid,
          {
            borderColor: `${info}33`,
            backgroundColor: mutedBg,
          },
        ]}>
        <View style={styles.statCol}>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Distance</ThemedText>
          <ThemedText type="defaultSemiBold">{activity.distance.toFixed(2)} km</ThemedText>
        </View>
        <View style={styles.statCol}>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Time</ThemedText>
          <ThemedText type="defaultSemiBold">{activity.duration}</ThemedText>
        </View>
        <View style={styles.statCol}>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Pace</ThemedText>
          <ThemedText type="defaultSemiBold">{activity.pace}</ThemedText>
        </View>
      </View>

      {activity.route ? (
        <Pressable
          onPress={() => openRouteInMaps(activity.route ?? '')}
          accessibilityRole="link"
          accessibilityLabel="Open route in maps">
          <ThemedText style={[styles.route, { color: muted }]}>📍 {activity.route} · Maps</ThemedText>
        </Pressable>
      ) : null}

      <View style={[styles.actions, { borderTopColor: borderColor }]}>
        <Pressable
          onPress={handleLike}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={likeState.liked ? 'Unlike' : 'Like'}>
          <Ionicons
            name={likeState.liked ? 'heart' : 'heart-outline'}
            size={22}
            color={likeState.liked ? destructive : muted}
          />
          <ThemedText style={[styles.actionCount, { color: muted }]}>{likeState.count}</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleComment}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Comments">
          <Ionicons name="chatbubble-outline" size={20} color={muted} />
          <ThemedText style={[styles.actionCount, { color: muted }]}>{commentCount}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  award: {
    marginTop: 1,
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
    marginBottom: 8,
  },
  mapWrap: {
    borderRadius: 14,
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
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 16,
  },
  statCol: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  route: {
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    fontSize: 14,
  },
});
