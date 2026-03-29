import { Image } from 'expo-image';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileHeader } from '@/components/run/profile-header';
import { ThemedText } from '@/components/themed-text';
import { mockActivities, mockProfile } from '@/constants/run-data';
import { useThemeColor } from '@/hooks/use-theme-color';

const GRID_GAP = 8;
const H_PAD = 16;
const COLS = 3;
const cellWidth = (Dimensions.get('window').width - H_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;

export default function ProfileScreen() {
  const bg = useThemeColor({}, 'background');
  const mutedBg = useThemeColor({}, 'muted');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader user={mockProfile.user} stats={mockProfile.stats} />
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Activities
          </ThemedText>
          <View style={styles.grid}>
            {mockActivities.map((item, index) => (
              <View
                key={`grid-${item.user.username}-${index}`}
                style={[styles.cell, { backgroundColor: mutedBg }]}>
                <Image
                  source={{ uri: item.activity.mapImage }}
                  style={styles.cellImage}
                  contentFit="cover"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: cellWidth,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
});
