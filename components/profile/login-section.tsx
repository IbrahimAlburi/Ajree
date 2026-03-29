import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AUTH_ACCOUNTS } from '@/constants/auth-accounts';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export function LoginSection() {
  const { login, authError, clearAuthError } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const inputBg = useThemeColor({}, 'inputBackground');
  const textColor = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const primaryText = useThemeColor({}, 'primaryButtonText');
  const destructive = useThemeColor({}, 'destructive');

  const onSubmit = async () => {
    clearAuthError();
    setBusy(true);
    try {
      await login(email.trim(), password);
    } finally {
      setBusy(false);
    }
  };

  const demoHint = AUTH_ACCOUNTS.map((a) => `${a.email} / ${a.password}`).join('\n');

  useEffect(() => {
    clearAuthError();
  }, [email, password, clearAuthError]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}>
      <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-circle-outline" size={48} color={tint} />
        </View>
        <ThemedText type="subtitle" style={styles.title}>
          Sign in to your profile
        </ThemedText>
        <ThemedText style={[styles.sub, { color: muted }]}>
          Use a demo account below. Your profile and activities switch per account.
        </ThemedText>

        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: muted }]}>Email</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={muted}
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
            editable={!busy}
          />
        </View>
        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: muted }]}>Password</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={muted}
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor: border }]}
            editable={!busy}
            onSubmitEditing={onSubmit}
          />
        </View>

        {authError ? (
          <ThemedText style={[styles.error, { color: destructive }]} accessibilityLiveRegion="polite">
            {authError}
          </ThemedText>
        ) : null}

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: tint, opacity: busy ? 0.7 : 1 }]}
          onPress={onSubmit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Sign in">
          {busy ? (
            <ActivityIndicator color={primaryText} />
          ) : (
            <ThemedText style={[styles.primaryBtnText, { color: primaryText }]}>Sign in</ThemedText>
          )}
        </Pressable>

        <View style={[styles.demoBox, { backgroundColor: inputBg, borderColor: border }]}>
          <ThemedText style={[styles.demoTitle, { color: muted }]}>Demo accounts</ThemedText>
          <ThemedText style={[styles.demoText, { color: textColor }]}>{demoHint}</ThemedText>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    width: '100%',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  primaryBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
  demoBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
