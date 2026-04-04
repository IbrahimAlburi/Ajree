import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { navigateToLogin } from '@/lib/auth-navigation';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile, isLoggedIn, hydrated } = useAppData();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const bg = useThemeColor({}, 'background');
  const border = useThemeColor({}, 'border');
  const muted = useThemeColor({}, 'mutedForeground');
  const inputBg = useThemeColor({}, 'inputBackground');
  const textColor = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      navigateToLogin(router, { replace: true });
    }
  }, [hydrated, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setName(profile.user.name);
    setUsername(profile.user.username);
    setLocation(profile.user.location);
    setBio(profile.user.bio);
  }, [profile.user, isLoggedIn]);

  if (!hydrated || !isLoggedIn) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const save = () => {
    updateProfile({
      name: name.trim() || profile.user.name,
      username: username.trim().replace(/\s+/g, '') || profile.user.username,
      location: location.trim(),
      bio: bio.trim(),
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.toolbar, { borderBottomColor: border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={26} color={muted} />
          </Pressable>
          <ThemedText type="subtitle">Edit profile</ThemedText>
          <Pressable onPress={save} hitSlop={8} accessibilityRole="button">
            <ThemedText style={{ color: tint, fontWeight: '700', fontSize: 16 }}>Save</ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Field label="Name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={muted}
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            />
          </Field>
          <Field label="Username">
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="username"
              placeholderTextColor={muted}
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            />
          </Field>
          <Field label="Location">
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="City, region"
              placeholderTextColor={muted}
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
            />
          </Field>
          <Field label="Bio">
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about your running journey"
              placeholderTextColor={muted}
              style={[styles.input, styles.bioInput, { backgroundColor: inputBg, color: textColor }]}
              multiline
              maxLength={280}
            />
          </Field>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const muted = useThemeColor({}, 'mutedForeground');
  return (
    <View style={styles.field}>
      <ThemedText style={[styles.label, { color: muted }]}>{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
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
  form: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
