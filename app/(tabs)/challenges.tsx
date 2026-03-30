import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChallengeCard } from '@/components/run/challenge-card';
import { ThemedText } from '@/components/themed-text';
import { mockChallenges } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChallengesScreen() {
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <ThemedText type="subtitle">Challenges</ThemedText>
        <ThemedText style={[styles.headerSub, { color: muted }]}>
          Community goals — join and stay accountable
        </ThemedText>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionBlock, { backgroundColor: card, borderColor: border }]}>
          <ThemedText type="defaultSemiBold" style={styles.sectionHead}>
            Active challenges
          </ThemedText>
          <ThemedText style={[styles.sectionSub, { color: muted }]}>
            Pick a goal that fits your week — progress is saved on device for this demo.
          </ThemedText>
          {mockChallenges.map((challenge) => (
            <ChallengeCard key={challenge.title} challenge={challenge} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 19,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionBlock: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    paddingBottom: 8,
  },
  sectionHead: {
    fontSize: 20,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
});
