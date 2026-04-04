import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TrackMap } from '@/components/run/track-map';
import { useAppData } from '@/context/app-data';
import type { FeedActivity } from '@/constants/run-data';
import { navigateToLogin } from '@/lib/auth-navigation';
import { openRouteInMaps } from '@/lib/maps';
import { STRAVA_ROUTE_ORANGE } from '@/constants/route-brand';
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
  const mutedBg = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  const handleKudos = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isLoggedIn) {
      navigateToLogin(router);
      return;
    }
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

  const accent = activity.type === 'race' ? success : tint;
  const kindLine =
    activity.type === 'race' ? 'Race or event · shared activity' : 'Training run · shared activity';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: borderColor,
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
            <View style={[styles.typePill, { backgroundColor: mutedBg, borderColor: borderColor }]}>
              <ThemedText style={[styles.typePillText, { color: activity.type === 'race' ? accent : tint }]}>
                {activity.type === 'race' ? 'RACE' : 'RUN'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Pressable onPress={goProfile} hitSlop={{ top: 6, bottom: 6, left: 0, right: 4 }}>
              <ThemedText style={[styles.meta, styles.handle, { color: info }]}>@{user.username}</ThemedText>
            </Pressable>
            <ThemedText style={[styles.meta, { color: muted }]}> · {activity.timestamp}</ThemedText>
          </View>
          <ThemedText style={[styles.kindLine, { color: muted }]}>{kindLine}</ThemedText>
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

        {activity.routeCoords && activity.routeCoords.length >= 2 ? (
          <View style={[styles.mapWrap, { backgroundColor: mutedBg }]}>
            <TrackMap coords={activity.routeCoords} height={192} strokeColor={STRAVA_ROUTE_ORANGE} />
          </View>
        ) : activity.mapImage ? (
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
          <ThemedText style={[styles.statLabel, { color: muted }]}>DISTANCE</ThemedText>
          <ThemedText type="defaultSemiBold">{activity.distance.toFixed(2)} km</ThemedText>
        </View>
        <View style={styles.statCol}>
          <ThemedText style={[styles.statLabel, { color: muted }]}>TIME</ThemedText>
          <ThemedText type="defaultSemiBold">{activity.duration}</ThemedText>
        </View>
        <View style={styles.statCol}>
          <ThemedText style={[styles.statLabel, { color: muted }]}>PACE</ThemedText>
          <ThemedText type="defaultSemiBold">{activity.pace}</ThemedText>
        </View>
      </View>

      {activity.route ? (
        <Pressable
          onPress={() => openRouteInMaps(activity.route ?? '')}
          accessibilityRole="link"
          accessibilityLabel="Open route in maps">
          <ThemedText style={[styles.route, { color: muted }]}>
            {activity.route} <ThemedText style={{ color: tint }}>· Maps</ThemedText>
          </ThemedText>
        </Pressable>
      ) : null}

      <View style={[styles.actions, { borderTopColor: borderColor }]}>
        <Pressable
          onPress={handleKudos}
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
          onPress={handleComment}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel="Open discussion">
          <Ionicons name="chatbubbles-outline" size={20} color={muted} />
          <ThemedText style={[styles.actionLabel, { color: muted }]}>Comment</ThemedText>
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
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
  kindLine: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  handle: {
    fontWeight: '600',
  },
  title: {
    marginBottom: 10,
    fontSize: 17,
    lineHeight: 24,
  },
  mapWrap: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapImage: {
    width: '100%',
    height: 200,
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
    lineHeight: 20,
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
});
