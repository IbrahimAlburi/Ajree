import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppData();
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <View style={[styles.toolbar, { borderBottomColor: border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={muted} />
        </Pressable>
        <ThemedText type="subtitle">Notifications</ThemedText>
        <Pressable
          onPress={markAllNotificationsRead}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mark all read">
          <ThemedText style={{ color: tint, fontSize: 14, fontWeight: '600' }}>Clear all</ThemedText>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifications.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => markNotificationRead(n.id)}
            style={[styles.row, { backgroundColor: card, borderColor: border }]}
            accessibilityRole="button">
            <View style={[styles.dot, { backgroundColor: n.read ? 'transparent' : tint }]} />
            <View style={styles.rowText}>
              <ThemedText type="defaultSemiBold">{n.title}</ThemedText>
              <ThemedText style={[styles.body, { color: muted }]}>{n.body}</ThemedText>
              <ThemedText style={[styles.time, { color: muted }]}>{n.time}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
});
