import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { AuthFlowLayout } from '@/components/auth/auth-flow-layout';
import { LoginSection } from '@/components/profile/login-section';
import { useAppData } from '@/context/app-data';

export default function SignInScreen() {
  const router = useRouter();
  const { hydrated, isLoggedIn } = useAppData();

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace('/(tabs)/profile');
    }
  }, [hydrated, isLoggedIn, router]);

  return (
    <AuthFlowLayout subtitle="Sign in to sync your profile, runs, and leaderboard progress.">
      <LoginSection
        fixedMode="signin"
        onAuthSuccess={() => router.replace('/(tabs)/profile')}
        alternateLink={{
          lead: 'New here?',
          action: 'Create an account',
          onPress: () => router.push('/sign-up'),
        }}
      />
    </AuthFlowLayout>
  );
}
