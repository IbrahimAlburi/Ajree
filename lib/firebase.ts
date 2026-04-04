import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

function tryReadFirebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;

  const missing = [
    !authDomain && 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    !projectId && 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    !storageBucket && 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    !messagingSenderId && 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    !appId && 'EXPO_PUBLIC_FIREBASE_APP_ID',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    throw new Error(
      `Firebase: set ${missing.join(', ')} in .env (see .env.example).`,
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

let appInstance: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const config = tryReadFirebaseConfig();
  if (!config) {
    throw new Error(
      'Firebase not configured. Copy .env.example to .env and add your web app keys from Firebase Console → Project settings.',
    );
  }
  appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
  return appInstance;
}

/** True when `EXPO_PUBLIC_FIREBASE_API_KEY` is set (other vars still validated on first use). */
export const isFirebaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
);

let authInstance: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();

  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
    return authInstance;
  }

  // Public `firebase/auth` typings omit this; Metro still resolves the RN build at runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth') as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
  };

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage) as Persistence,
    });
  } catch {
    authInstance = getAuth(app);
  }
  return authInstance;
}

let dbInstance: Firestore | undefined;

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

/**
 * Google Analytics (Firebase) — web only. The web Analytics SDK does not run on iOS/Android in this setup.
 * Call from a web entry or `useEffect` after mount. Returns null on native or if the browser is unsupported.
 */
export async function getFirebaseAnalytics() {
  if (Platform.OS !== 'web') return null;
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (!(await isSupported())) return null;
  return getAnalytics(getFirebaseApp());
}
