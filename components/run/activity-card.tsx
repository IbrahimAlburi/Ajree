import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { FeedActivity } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export function ActivityCard({ user, activity, stats }: FeedActivity) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes);

  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'mutedForeground');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const destructive = useThemeColor({}, 'destructive');
  const mutedBg = useThemeColor({}, 'muted');

  const handleLike = () => {
    setLiked((wasLiked) => {
      setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
      return !wasLiked;
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
      <View style={styles.row}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
            {activity.type === 'race' && (
              <Ionicons name="ribbon" size={16} color={success} style={styles.award} />
            )}
          </View>
          <ThemedText style={[styles.meta, { color: muted }]}>
            @{user.username} · {activity.timestamp}
          </ThemedText>
        </View>
      </View>

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
        <ThemedText style={[styles.route, { color: muted }]}>📍 {activity.route}</ThemedText>
      ) : null}

      <View style={[styles.actions, { borderTopColor: borderColor }]}>
        <Pressable
          onPress={handleLike}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike' : 'Like'}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? destructive : muted}
          />
          <ThemedText style={[styles.actionCount, { color: muted }]}>{likeCount}</ThemedText>
        </Pressable>
        <Pressable style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Comment">
          <Ionicons name="chatbubble-outline" size={20} color={muted} />
          <ThemedText style={[styles.actionCount, { color: muted }]}>{stats.comments}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  title: {
    marginBottom: 8,
  },
  mapWrap: {
    borderRadius: 10,
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
