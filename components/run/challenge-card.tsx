import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Challenge } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = { challenge: Challenge };

export function ChallengeCard({ challenge }: Props) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const primaryText = useThemeColor({}, 'primaryButtonText');

  return (
    <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.emoji}>{challenge.icon}</ThemedText>
        <View style={styles.headerText}>
          <ThemedText type="defaultSemiBold">{challenge.title}</ThemedText>
          <ThemedText style={[styles.desc, { color: muted }]}>{challenge.description}</ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="flag-outline" size={16} color={muted} />
          <ThemedText style={[styles.metaText, { color: muted }]}>{challenge.goal}</ThemedText>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={16} color={muted} />
          <ThemedText style={[styles.metaText, { color: muted }]}>
            {challenge.participants} joined
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={muted} />
          <ThemedText style={[styles.metaText, { color: muted }]}>
            {challenge.daysLeft}d left
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <ThemedText style={[styles.progressLabel, { color: muted }]}>Progress</ThemedText>
          <ThemedText style={{ color: success }}>{challenge.progress}%</ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: mutedBg }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${challenge.progress}%`,
                backgroundColor: info,
              },
            ]}
          />
        </View>
      </View>

      <Pressable
        style={[styles.cta, { backgroundColor: info }]}
        accessibilityRole="button"
        accessibilityLabel="Join challenge">
        <ThemedText style={[styles.ctaText, { color: primaryText }]}>Join Challenge</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  progressBlock: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  cta: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
