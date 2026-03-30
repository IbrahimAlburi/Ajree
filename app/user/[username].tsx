import { Redirect, useLocalSearchParams } from 'expo-router';

/** Old `/user/@name` URLs forward to the Profile tab (same screen for everyone). */
export default function UserProfileRedirect() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const u = typeof username === 'string' ? username : '';
  return (
    <Redirect
      href={{
        pathname: '/(tabs)/profile',
        params: { username: u },
      }}
    />
  );
}
