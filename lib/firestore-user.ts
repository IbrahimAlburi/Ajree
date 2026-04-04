import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import type { ProfileStats, ProfileUser } from '@/constants/run-data';
import { getFirebaseDb } from '@/lib/firebase';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';

/** Seed profile + Firestore doc for a new Firebase account. */
export function defaultProfileForNewUser(email: string, uid: string): {
  user: ProfileUser;
  stats: ProfileStats;
} {
  const rawLocal = email.split('@')[0] ?? 'runner';
  const local = rawLocal.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24) || 'runner';
  const name = local.length > 0 ? local.charAt(0).toUpperCase() + local.slice(1) : 'Runner';
  return {
    user: {
      name,
      username: `${local}_${uid.slice(0, 4)}`,
      avatar: DEFAULT_AVATAR,
      location: '',
      bio: '',
    },
    stats: {
      totalRuns: 0,
      totalDistance: 0,
      followers: 0,
      following: 0,
    },
  };
}

const COLLECTION = 'users';

export async function fetchUserProfile(uid: string): Promise<{
  user: ProfileUser;
  stats: ProfileStats;
} | null> {
  const snap = await getDoc(doc(getFirebaseDb(), COLLECTION, uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { user?: ProfileUser; stats?: ProfileStats };
  if (!data.user || !data.stats) return null;
  return { user: data.user, stats: data.stats };
}

export async function saveUserProfile(
  uid: string,
  user: ProfileUser,
  stats: ProfileStats,
): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), COLLECTION, uid),
    {
      user,
      stats,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
