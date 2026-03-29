import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ProfileStats, ProfileUser } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  user: ProfileUser;
  stats: ProfileStats;
};

export function ProfileHeader({ user, stats }: Props) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const primaryText = useThemeColor({}, 'primaryButtonText');

  return (
    <View style={[styles.wrap, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
      <View style={styles.topRow}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color={muted} />
        </Pressable>
      </View>

      <View style={styles.bioBlock}>
        <ThemedText type="subtitle">{user.name}</ThemedText>
        <ThemedText style={[styles.username, { color: muted }]}>@{user.username}</ThemedText>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={muted} />
          <ThemedText style={[styles.location, { color: muted }]}>{user.location}</ThemedText>
        </View>
        <ThemedText style={styles.bio}>{user.bio}</ThemedText>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <ThemedText type="defaultSemiBold">{stats.totalRuns}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Runs</ThemedText>
        </View>
        <View style={styles.statCell}>
          <ThemedText type="defaultSemiBold">{stats.totalDistance}k</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Total km</ThemedText>
        </View>
        <View style={styles.statCell}>
          <ThemedText type="defaultSemiBold">{stats.followers}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Followers</ThemedText>
        </View>
        <View style={styles.statCell}>
          <ThemedText type="defaultSemiBold">{stats.following}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: muted }]}>Following</ThemedText>
        </View>
      </View>

      <Pressable
        style={[styles.editBtn, { backgroundColor: tint }]}
        accessibilityRole="button"
        accessibilityLabel="Edit profile">
        <ThemedText style={[styles.editBtnText, { color: primaryText }]}>Edit Profile</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  bioBlock: {
    marginBottom: 16,
    gap: 6,
  },
  username: {
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  editBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
