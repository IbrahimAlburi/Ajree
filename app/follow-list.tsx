import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { mockFollowers, mockFollowing } from '@/constants/run-data';
import { useAppData } from '@/context/app-data';
import { navigateToUserProfile } from '@/lib/profile-navigation';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Route `type`: `supporters` | `crew`. Legacy `followers` | `following` still accepted. */
function normalizeFollowListType(type: string | undefined): 'crew' | 'supporters' {
  if (type === 'crew' || type === 'following') return 'crew';
  return 'supporters';
}

export default function FollowListScreen() {
  const router = useRouter();
  const { profile, isLoggedIn } = useAppData();
  const params = useLocalSearchParams<{ type?: string | string[] }>();
  const rawType = params.type;
  const type = typeof rawType === 'string' ? rawType : rawType?.[0];
  const listKind = useMemo(() => normalizeFollowListType(type), [type]);

  const [helpOpen, setHelpOpen] = useState(false);

  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const tint = useThemeColor({}, 'tint');
  const text = useThemeColor({}, 'text');
  const primaryText = useThemeColor({}, 'primaryButtonText');

  const isCrew = listKind === 'crew';
  const title = isCrew ? 'Your crew' : 'Supporters';
  const subtitle = isCrew
    ? 'Runners you track — their miles show up in Your crew on Home.'
    : 'People who cheer your runs and see you in their feed.';
  const data = isCrew ? mockFollowing : mockFollowers;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <ThemedText style={{ color: muted, fontSize: 16 }}>Back</ThemedText>
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.headerSub, { color: muted }]} numberOfLines={2}>
            {subtitle}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => setHelpOpen(true)}
          hitSlop={12}
          style={styles.helpBtn}
          accessibilityRole="button"
          accessibilityLabel="What is Stride circle?">
          <Ionicons name="help-circle-outline" size={26} color={tint} />
        </Pressable>
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
              accessibilityLabel={isCrew ? 'On crew' : 'Cheer back — add to your crew'}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>
                {isCrew ? 'On crew' : 'Cheer back'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      />

      <Modal
        visible={helpOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpOpen(false)}>
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          onPress={() => setHelpOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss">
          <Pressable
            style={[styles.modalCard, { backgroundColor: card, borderColor: border }]}
            onPress={(e) => e.stopPropagation()}>
            <ThemedText type="subtitle" style={[styles.modalTitle, { color: text }]}>
              Stride circle
            </ThemedText>
            <ThemedText style={[styles.modalLead, { color: muted }]}>
              Two lists, one running social graph — no generic “follow” labels.
            </ThemedText>
            <View style={styles.modalBlock}>
              <ThemedText type="defaultSemiBold" style={{ color: text }}>
                Supporters
              </ThemedText>
              <ThemedText style={[styles.modalBody, { color: muted }]}>
                People who cheer your miles. They can see your activities in the wider community
                stream.
              </ThemedText>
            </View>
            <View style={styles.modalBlock}>
              <ThemedText type="defaultSemiBold" style={{ color: text }}>
                Crew
              </ThemedText>
              <ThemedText style={[styles.modalBody, { color: muted }]}>
                Runners you choose to track. Their activities appear in{' '}
                <ThemedText type="defaultSemiBold" style={{ color: text }}>
                  Your crew
                </ThemedText>{' '}
                on Home — newest first, no reordering.
              </ThemedText>
            </View>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: tint }]}
              onPress={() => setHelpOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Got it">
              <ThemedText style={{ color: primaryText, fontWeight: '700', fontSize: 16 }}>
                Got it
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    minWidth: 0,
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  helpBtn: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  modalLead: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  modalBlock: {
    gap: 6,
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  modalBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
