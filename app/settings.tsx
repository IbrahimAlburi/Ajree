import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { AUTH_SIGN_UP_HREF, navigateToLogin } from '@/lib/auth-navigation';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, isLoggedIn, logout } = useAppData();
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const destructive = useThemeColor({}, 'destructive');
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <View style={[styles.toolbar, { borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="close" size={26} color={muted} />
        </Pressable>
        <ThemedText type="subtitle">Settings</ThemedText>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!isLoggedIn ? (
          <View style={[styles.card, styles.signInCard, { backgroundColor: card, borderColor: border }]}>
            <ThemedText type="defaultSemiBold">Account</ThemedText>
            <ThemedText style={[styles.signInSub, { color: muted }]}>
              Sync your profile with Firebase when configured, or use a demo account on Sign in.
            </ThemedText>
            <View style={styles.authBtnRow}>
              <Pressable
                style={[styles.authBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => navigateToLogin(router)}
                accessibilityRole="button"
                accessibilityLabel="Sign in">
                <ThemedText type="defaultSemiBold">Sign in</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.authBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => router.push(AUTH_SIGN_UP_HREF)}
                accessibilityRole="button"
                accessibilityLabel="Create account">
                <ThemedText type="defaultSemiBold">Sign up</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
        {isLoggedIn && session ? (
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <View style={styles.accountBlock}>
              <ThemedText style={[styles.signedLabel, { color: muted }]}>Signed in as</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.emailText}>
                {session.email}
              </ThemedText>
            </View>
            <Pressable
              style={[styles.logoutBtn, { borderColor: destructive }]}
              onPress={() => void logout()}
              accessibilityRole="button"
              accessibilityLabel="Log out">
              <ThemedText style={{ color: destructive, fontWeight: '600', textAlign: 'center' }}>
                Log out
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Row
            icon="notifications-outline"
            label="Push notifications"
            trailing={<Switch value={true} accessibilityLabel="Push notifications" />}
          />
          <Row
            icon="fitness-outline"
            label="Weekly recap email"
            trailing={<Switch value={false} accessibilityLabel="Weekly recap" />}
          />
        </View>
        <Pressable
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
          onPress={() => Linking.openURL('https://expo.dev/privacy')}>
          <Row icon="shield-checkmark-outline" label="Privacy policy" chevron />
        </Pressable>
        <Pressable
          style={[styles.card, { backgroundColor: card, borderColor: border }]}
          onPress={() => Linking.openURL('https://docs.expo.dev')}>
          <Row icon="help-circle-outline" label="Help & support" chevron />
        </Pressable>
        <ThemedText style={[styles.hint, { color: muted }]}>
          Preferences here are local placeholders for now — wire them to your backend when you ship.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  trailing,
  chevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing?: ReactNode;
  chevron?: boolean;
}) {
  const muted = useThemeColor({}, 'mutedForeground');
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={muted} />
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {trailing ?? (chevron ? <Ionicons name="chevron-forward" size={18} color={muted} /> : null)}
    </View>
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
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  signInCard: {
    padding: 16,
    gap: 8,
  },
  signInSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  authBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  authBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  accountBlock: {
    padding: 14,
    paddingBottom: 8,
    gap: 4,
  },
  signedLabel: {
    fontSize: 13,
  },
  emailText: {
    fontSize: 16,
  },
  logoutBtn: {
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
