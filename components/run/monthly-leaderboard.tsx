import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LeaderboardEntry } from '@/lib/leaderboard';
import { formatLeaderboardMonth, shiftMonth } from '@/lib/leaderboard';
import { navigateToUserProfile } from '@/lib/profile-navigation';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  entries: LeaderboardEntry[];
  monthYear: { year: number; month: number };
  onMonthChange: (next: { year: number; month: number }) => void;
  currentUsername: string;
  isLoggedIn: boolean;
};

function rankMedal(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

export function MonthlyLeaderboard({
  entries,
  monthYear,
  onMonthChange,
  currentUsername,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const mutedBg = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');

  const label = formatLeaderboardMonth(monthYear.year, monthYear.month);
  const prev = () => onMonthChange(shiftMonth(monthYear.year, monthYear.month, -1));
  const next = () => onMonthChange(shiftMonth(monthYear.year, monthYear.month, 1));

  return (
    <View style={styles.outer}>
      <View style={styles.monthRow}>
        <Pressable
          onPress={prev}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={26} color={tint} />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.monthLabel}>
          {label}
        </ThemedText>
        <Pressable onPress={next} hitSlop={12} accessibilityRole="button" accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={26} color={tint} />
        </Pressable>
      </View>
      <ThemedText style={[styles.sub, { color: muted }]}>Sum of run distances for each runner</ThemedText>

      {entries.length === 0 ? (
        <View style={[styles.empty, { borderColor: border, backgroundColor: card }]}>
          <ThemedText style={{ color: muted }}>No activities this month yet.</ThemedText>
          <ThemedText style={[styles.emptyHint, { color: muted }]}>
            Log an activity or try another month.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.list, { borderColor: border, backgroundColor: card }]}>
          {entries.map((row) => {
            const isYou = isLoggedIn && row.username === currentUsername;
            const medal = rankMedal(row.rank);
            return (
              <Pressable
                key={row.username}
                onPress={() =>
                  navigateToUserProfile(router, row.username, {
                    isLoggedIn,
                    myUsername: currentUsername,
                  })
                }
                style={[
                  styles.row,
                  { borderBottomColor: border },
                  isYou && { backgroundColor: mutedBg },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${row.name}, rank ${row.rank}, ${row.km} kilometers`}>
                <View style={styles.rankCol}>
                  {medal ? (
                    <ThemedText style={styles.medal}>{medal}</ThemedText>
                  ) : (
                    <ThemedText style={[styles.rankNum, { color: muted }]}>{row.rank}</ThemedText>
                  )}
                </View>
                <Image source={{ uri: row.avatar }} style={styles.avatar} />
                <View style={styles.nameCol}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ color: text }}>
                    {row.name}
                    {isYou ? ' (you)' : ''}
                  </ThemedText>
                  <ThemedText style={[styles.handle, { color: tint }]} numberOfLines={1}>
                    @{row.username}
                  </ThemedText>
                </View>
                <Text style={[styles.km, { color: text }]}>
                  <Text style={{ fontWeight: '700', fontSize: 16 }}>
                    {row.km.toLocaleString(undefined, {
                      minimumFractionDigits: row.km % 1 === 0 ? 0 : 1,
                      maximumFractionDigits: 1,
                    })}
                  </Text>
                  <Text style={[styles.kmUnit, { color: muted }]}> km</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    gap: 10,
    marginBottom: 8,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  monthLabel: {
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  empty: {
    padding: 20,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 6,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
  },
  medal: {
    fontSize: 22,
  },
  rankNum: {
    fontSize: 15,
    fontWeight: '700',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  handle: {
    fontSize: 12,
    fontWeight: '600',
  },
  km: {
    fontSize: 16,
    minWidth: 72,
    textAlign: 'right',
  },
  kmUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
});
