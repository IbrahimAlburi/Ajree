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

type Props = {
  /** Called after a successful sign-in or registration (e.g. navigate away from `/login`). */
  onAuthSuccess?: () => void;
};

export function LoginSection({ onAuthSuccess }: Props) {
  const { login, register, authError, clearAuthError, useFirebaseAuth } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

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
      let ok = false;
      if (mode === 'register' && useFirebaseAuth) {
        ok = await register(email.trim(), password);
      } else {
        ok = await login(email.trim(), password);
      }
      if (ok) {
        onAuthSuccess?.();
      }
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
          {useFirebaseAuth
            ? mode === 'register'
              ? 'Create your account'
              : 'Sign in to your profile'
            : 'Sign in to your profile'}
        </ThemedText>
        <ThemedText style={[styles.sub, { color: muted }]}>
          {useFirebaseAuth
            ? mode === 'register'
              ? 'Your name and handle are saved to Firebase. Use a strong password (6+ characters).'
              : 'Sign in with the email and password you used at registration. Profile syncs from Firebase.'
            : 'Use a demo account below. Your profile and activities switch per account.'}
        </ThemedText>

        {useFirebaseAuth ? (
          <View style={[styles.modeRow, { borderColor: border }]}>
            <Pressable
              onPress={() => {
                clearAuthError();
                setMode('signin');
              }}
              style={[
                styles.modeBtn,
                mode === 'signin' && { backgroundColor: tint },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'signin' }}>
              <ThemedText
                style={[styles.modeBtnText, { color: mode === 'signin' ? primaryText : muted }]}>
                Sign in
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                clearAuthError();
                setMode('register');
              }}
              style={[
                styles.modeBtn,
                mode === 'register' && { backgroundColor: tint },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'register' }}>
              <ThemedText
                style={[styles.modeBtnText, { color: mode === 'register' ? primaryText : muted }]}>
                Create account
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

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
          accessibilityLabel={mode === 'register' && useFirebaseAuth ? 'Create account' : 'Sign in'}>
          {busy ? (
            <ActivityIndicator color={primaryText} />
          ) : (
            <ThemedText style={[styles.primaryBtnText, { color: primaryText }]}>
              {useFirebaseAuth && mode === 'register' ? 'Create account' : 'Sign in'}
            </ThemedText>
          )}
        </Pressable>

        {!useFirebaseAuth ? (
          <View style={[styles.demoBox, { backgroundColor: inputBg, borderColor: border }]}>
            <ThemedText style={[styles.demoTitle, { color: muted }]}>Demo accounts</ThemedText>
            <ThemedText style={[styles.demoText, { color: textColor }]}>{demoHint}</ThemedText>
          </View>
        ) : (
          <ThemedText style={[styles.firebaseHint, { color: muted }]}>
            Firebase Authentication + Firestore store your profile. Enable Email/Password in the Firebase
            Console and deploy security rules for the `users` collection.
          </ThemedText>
        )}
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
  modeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 2,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  demoBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  firebaseHint: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
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
