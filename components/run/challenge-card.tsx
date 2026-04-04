import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Challenge } from '@/constants/run-data';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = { challenge: Challenge };

export function ChallengeCard({ challenge }: Props) {
  const { hydrated, joinedChallengeIds, toggleChallengeJoin, challengeJoinsReady } = useAppData();
  const joined = joinedChallengeIds.has(challenge.id);
  const canPress = hydrated && challengeJoinsReady;

  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const mutedBg = useThemeColor({}, 'muted');
  const info = useThemeColor({}, 'info');
  const success = useThemeColor({}, 'success');
  const primaryText = useThemeColor({}, 'primaryButtonText');
  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const onToggleJoin = () => {
    if (!canPress) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void Haptics.impactAsync(
      joined ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    toggleChallengeJoin(challenge.id);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: joined ? success : borderColor,
          borderWidth: joined ? 2 : 1,
        },
      ]}>
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
            {challenge.participants.toLocaleString()} joined
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

      {joined ? (
        <View style={[styles.joinedBanner, { backgroundColor: mutedBg, borderColor }]}>
          <Ionicons name="checkmark-circle" size={18} color={success} />
          <ThemedText style={[styles.joinedBannerText, { color: muted }]}>
            {"You're in — keep logging activities to move the bar."}
          </ThemedText>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onToggleJoin}
        disabled={!canPress}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={[
          styles.cta,
          {
            backgroundColor: joined ? mutedBg : info,
            borderColor: joined ? borderColor : info,
            borderWidth: joined ? 1 : 0,
            opacity: !canPress ? 0.55 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={joined ? 'Leave challenge' : 'Join challenge'}
        accessibilityState={{ selected: joined, disabled: !canPress }}>
        {!canPress ? (
          <ActivityIndicator color={joined ? muted : primaryText} />
        ) : (
          <View style={styles.ctaInner}>
            <Ionicons
              name={joined ? 'checkmark-circle' : 'add-circle-outline'}
              size={22}
              color={joined ? tint : primaryText}
            />
            <ThemedText style={[styles.ctaText, { color: joined ? tint : primaryText }]}>
              {joined ? 'Joined · tap to leave' : 'Join challenge'}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  joinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  joinedBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
