import { type Href, type Router } from 'expo-router';

/**
 * Always opens the Profile tab (switches the active tab from Home, etc.).
 * Your account → plain tab; anyone else → `?username=`.
 * Uses `navigate` (not `push`) so the tab navigator focuses Profile like tapping the tab bar.
 */
export function navigateToUserProfile(
  router: Router,
  username: string,
  options: { isLoggedIn: boolean; myUsername: string },
): void {
  const un = username.trim().replace(/^@/, '');
  if (!un) return;
  if (options.isLoggedIn && options.myUsername === un) {
    router.navigate('/(tabs)/profile' as Href);
    return;
  }
  router.navigate({
    pathname: '/(tabs)/profile',
    params: { username: un },
  } as Href);
}
