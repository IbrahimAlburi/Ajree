import { Image } from 'expo-image';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { mockActivities } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ExploreScreen() {
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const inputBg = useThemeColor({}, 'inputBackground');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'mutedForeground');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Explore
        </ThemedText>
        <TextInput
          placeholder="Search runners, routes..."
          placeholderTextColor={muted}
          style={[styles.search, { backgroundColor: inputBg, color: text, borderColor: border }]}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Popular Routes
        </ThemedText>
        {mockActivities.map((item) => (
          <View
            key={item.id}
            style={[styles.routeCard, { backgroundColor: card, borderColor: border }]}>
            <Image
              source={{ uri: item.activity.mapImage }}
              style={styles.routeImage}
              contentFit="cover"
            />
            <View style={styles.routeBody}>
              <ThemedText type="defaultSemiBold">{item.activity.route}</ThemedText>
              <ThemedText style={{ color: muted }}>{item.activity.distance.toFixed(1)} km</ThemedText>
            </View>
          </View>
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
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
  },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  routeCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  routeImage: {
    width: '100%',
    height: 160,
  },
  routeBody: {
    padding: 12,
    gap: 4,
  },
});
