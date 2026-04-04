import { Redirect } from 'expo-router';

/** Legacy route: deep links and old code may still use `/login`. */
export default function LoginRedirect() {
  return <Redirect href="/sign-in" />;
}
