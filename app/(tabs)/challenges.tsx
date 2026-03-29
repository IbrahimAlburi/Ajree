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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <ThemedText type="subtitle">Challenges</ThemedText>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Active Challenges
        </ThemedText>
        {mockChallenges.map((challenge) => (
          <ChallengeCard key={challenge.title} challenge={challenge} />
        ))}
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
});
