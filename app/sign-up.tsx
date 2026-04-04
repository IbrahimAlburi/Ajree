import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { AuthFlowLayout } from '@/components/auth/auth-flow-layout';
import { LoginSection } from '@/components/profile/login-section';
import { useAppData } from '@/context/app-data';

export default function SignUpScreen() {
  const router = useRouter();
  const { hydrated, isLoggedIn } = useAppData();

  useEffect(() => {
    if (hydrated && isLoggedIn) {
      router.replace('/(tabs)/profile');
    }
  }, [hydrated, isLoggedIn, router]);

  return (
    <AuthFlowLayout subtitle="Create an account to save your runs and keep your profile in sync.">
      <LoginSection
        fixedMode="register"
        onAuthSuccess={() => router.replace('/(tabs)/profile')}
        alternateLink={{
          lead: 'Already have an account?',
          action: 'Sign in',
          onPress: () => router.push('/sign-in'),
        }}
      />
    </AuthFlowLayout>
  );
}
