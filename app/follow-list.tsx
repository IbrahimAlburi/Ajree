import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { mockFollowers, mockFollowing } from '@/constants/run-data';
import { useAppData } from '@/context/app-data';
import { navigateToUserProfile } from '@/lib/profile-navigation';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function FollowListScreen() {
  const router = useRouter();
  const { profile, isLoggedIn } = useAppData();
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const rawType = params.type;
  const type = typeof rawType === 'string' ? rawType : rawType?.[0];
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');

  const isFollowing = type === 'following';
  const title = isFollowing ? 'Following' : 'Followers';
  const data = isFollowing ? mockFollowing : mockFollowers;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <ThemedText style={{ color: muted, fontSize: 16 }}>Back</ThemedText>
        </Pressable>
        <ThemedText type="subtitle">{title}</ThemedText>
        <View style={{ width: 48 }} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: card, borderColor: border }]}>
            <Pressable
              style={styles.rowMain}
              onPress={() =>
                navigateToUserProfile(router, item.username, {
                  isLoggedIn,
                  myUsername: profile.user.username,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open profile ${item.name}`}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <View style={styles.textCol}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText style={[styles.sub, { color: muted }]}>@{item.username}</ThemedText>
              </View>
            </Pressable>
            <Pressable
              style={[styles.followBtn, { borderColor: border }]}
              accessibilityRole="button"
              accessibilityLabel={isFollowing ? 'Following' : 'Follow back'}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>
                {isFollowing ? 'Following' : 'Follow'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  sub: {
    fontSize: 13,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
