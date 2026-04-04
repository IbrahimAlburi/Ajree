import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginSection } from '@/components/profile/login-section';
import { ThemedText } from '@/components/themed-text';
import { useAppData } from '@/context/app-data';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const router = useRouter();
  const { hydrated, isLoggedIn } = useAppData();
  const bg = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'mutedForeground');
  const text = useThemeColor({}, 'text');

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace('/(tabs)/profile');
    }
  }, [hydrated, isLoggedIn, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['bottom']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={[styles.brand, { color: text }]}>
            RunTogether
          </ThemedText>
          <ThemedText style={[styles.introSub, { color: muted }]}>
            Sign in or create an account to sync your profile and runs.
          </ThemedText>
        </View>
        <LoginSection onAuthSuccess={() => router.replace('/(tabs)/profile')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 40,
  },
  intro: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  introSub: {
    fontSize: 15,
    lineHeight: 21,
  },
});
