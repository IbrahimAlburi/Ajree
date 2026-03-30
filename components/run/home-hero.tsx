import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ProfileStats } from '@/constants/run-data';
import { getHomeHeroCopy, heroTimeIcon } from '@/lib/home-copy';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  isLoggedIn: boolean;
  firstName: string;
  stats: ProfileStats | null;
};

export function HomeHero({ isLoggedIn, firstName, stats }: Props) {
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const mutedBg = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');

  const { headline, sub, whisper } = getHomeHeroCopy(isLoggedIn, firstName);
  const timeIcon = heroTimeIcon();

  return (
    <View style={[styles.outer, { backgroundColor: card, borderColor: border }]}>
      <View style={[styles.blobA, { backgroundColor: tint }]} />
      <View style={[styles.blobB, { backgroundColor: tint }]} />
      <View style={[styles.accent, { backgroundColor: tint }]} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.textCol}>
            <ThemedText style={[styles.headline, { color: text }]}>{headline}</ThemedText>
            <ThemedText style={[styles.sub, { color: muted }]}>{sub}</ThemedText>
            <ThemedText style={[styles.whisper, { color: tint }]}>“{whisper}”</ThemedText>
          </View>
          <View style={[styles.iconBlob, { backgroundColor: mutedBg, borderColor: border }]}>
            <Ionicons name={timeIcon} size={28} color={tint} />
          </View>
        </View>

        {isLoggedIn && stats ? (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: mutedBg, borderColor: border }]}>
              <Ionicons name="fitness-outline" size={18} color={tint} style={styles.statIcon} />
              <ThemedText style={[styles.statNudge, { color: muted }]}>Total runs</ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.statNumber, { color: text }]}>
                {stats.totalRuns.toLocaleString()}
              </ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: mutedBg, borderColor: border }]}>
              <Ionicons name="navigate-outline" size={18} color={tint} style={styles.statIcon} />
              <ThemedText style={[styles.statNudge, { color: muted }]}>Distance</ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.statNumber, { color: text }]}>
                {stats.totalDistance.toLocaleString()} km
              </ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: mutedBg, borderColor: border }]}>
              <Ionicons name="people-outline" size={18} color={tint} style={styles.statIcon} />
              <ThemedText style={[styles.statNudge, { color: muted }]}>Followers</ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.statNumber, { color: text }]}>
                {stats.followers.toLocaleString()}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={[styles.guestHint, { backgroundColor: mutedBg, borderColor: border }]}>
            <Ionicons name="person-circle-outline" size={20} color={tint} />
            <ThemedText style={[styles.guestHintText, { color: muted }]}>
              Sign in from Profile to save runs, likes, and your place on the leaderboard.
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  blobA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.07,
    top: -50,
    right: -30,
  },
  blobB: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    opacity: 0.06,
    bottom: -20,
    left: -20,
  },
  accent: {
    width: 5,
    zIndex: 1,
  },
  inner: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingLeft: 14,
    gap: 18,
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  textCol: {
    flex: 1,
    gap: 10,
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    lineHeight: 23,
  },
  whisper: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    marginTop: 2,
  },
  iconBlob: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 2,
  },
  statNudge: {
    fontSize: 10,
    lineHeight: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 15,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  guestHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  guestHintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
