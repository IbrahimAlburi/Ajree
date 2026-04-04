import type { Href } from 'expo-router';

/** Dedicated sign-in / register screen (`app/login.tsx`). Use this instead of pushing Profile for auth. */
export const AUTH_LOGIN_HREF: Href = '/login';

type RouterLike = {
  push: (href: Href) => void;
  replace?: (href: Href) => void;
};

/**
 * Navigate to the login screen. Prefer **`replace`** when the current screen must not stay on the stack
 * (e.g. edit-profile opened without a session).
 */
export function navigateToLogin(router: RouterLike, options?: { replace?: boolean }): void {
  if (options?.replace && typeof router.replace === 'function') {
    router.replace(AUTH_LOGIN_HREF);
  } else {
    router.push(AUTH_LOGIN_HREF);
  }
}
