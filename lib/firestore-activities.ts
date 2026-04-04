import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import type { FeedActivity, RouteCoord } from '@/constants/run-data';
import { getFirebaseDb } from '@/lib/firebase';

function activitySortKey(a: FeedActivity): number {
  if (typeof a.recordedAt === 'number') return a.recordedAt;
  const m = /^post-(\d+)$/.exec(a.id);
  return m ? Number(m[1]) : 0;
}

/** Remote wins when the same `id` exists in both lists (newer server data). */
export function mergeRemoteAndLocalActivities(
  remote: FeedActivity[],
  local: FeedActivity[],
): FeedActivity[] {
  const map = new Map<string, FeedActivity>();
  for (const a of local) map.set(a.id, a);
  for (const a of remote) map.set(a.id, a);
  return [...map.values()].sort((a, b) => activitySortKey(b) - activitySortKey(a));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function firestoreDocToFeedActivity(data: Record<string, unknown>): FeedActivity | null {
  if (typeof data.id !== 'string') return null;
  const user = data.user;
  const activity = data.activity;
  const stats = data.stats;
  if (!isRecord(user) || !isRecord(activity) || !isRecord(stats)) return null;
  if (
    typeof user.name !== 'string' ||
    typeof user.avatar !== 'string' ||
    typeof user.username !== 'string'
  ) {
    return null;
  }
  if (typeof activity.type !== 'string' || (activity.type !== 'run' && activity.type !== 'race')) {
    return null;
  }
  if (
    typeof activity.distance !== 'number' ||
    typeof activity.duration !== 'string' ||
    typeof activity.pace !== 'string' ||
    typeof activity.timestamp !== 'string'
  ) {
    return null;
  }
  if (typeof stats.likes !== 'number' || typeof stats.comments !== 'number') {
    return null;
  }

  const out: FeedActivity = {
    id: data.id,
    user: {
      name: user.name,
      avatar: user.avatar,
      username: user.username,
    },
    activity: {
      type: activity.type,
      distance: activity.distance,
      duration: activity.duration,
      pace: activity.pace,
      timestamp: activity.timestamp,
    },
    stats: {
      likes: stats.likes,
      comments: stats.comments,
    },
  };

  if (typeof activity.title === 'string') out.activity.title = activity.title;
  if (typeof activity.route === 'string') out.activity.route = activity.route;
  if (typeof activity.mapImage === 'string') out.activity.mapImage = activity.mapImage;

  if (Array.isArray(activity.routeCoords)) {
    const coords: RouteCoord[] = [];
    for (const c of activity.routeCoords) {
      if (!isRecord(c)) continue;
      if (typeof c.latitude !== 'number' || typeof c.longitude !== 'number') continue;
      coords.push({ latitude: c.latitude, longitude: c.longitude });
    }
    if (coords.length >= 2) out.activity.routeCoords = coords;
  }

  if (typeof data.recordedAt === 'number') out.recordedAt = data.recordedAt;

  return out;
}

/** Plain object for Firestore — no `undefined` values (SDK rejects them). */
function feedActivityToFirestorePayload(activity: FeedActivity): Record<string, unknown> {
  const act = activity.activity;
  const activityPayload: Record<string, unknown> = {
    type: act.type,
    distance: act.distance,
    duration: act.duration,
    pace: act.pace,
    timestamp: act.timestamp,
  };
  if (act.title !== undefined) activityPayload.title = act.title;
  if (act.route !== undefined) activityPayload.route = act.route;
  if (act.mapImage !== undefined) activityPayload.mapImage = act.mapImage;
  if (act.routeCoords && act.routeCoords.length >= 2) {
    activityPayload.routeCoords = act.routeCoords.map((c) => ({
      latitude: c.latitude,
      longitude: c.longitude,
    }));
  }

  const payload: Record<string, unknown> = {
    id: activity.id,
    user: activity.user,
    activity: activityPayload,
    stats: activity.stats,
    updatedAt: serverTimestamp(),
  };
  if (activity.recordedAt !== undefined) payload.recordedAt = activity.recordedAt;
  return payload;
}

export async function saveUserActivity(uid: string, activity: FeedActivity): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', uid, 'activities', activity.id);
  await setDoc(ref, feedActivityToFirestorePayload(activity));
}

export async function fetchUserActivitiesFromFirestore(uid: string): Promise<FeedActivity[]> {
  const col = collection(getFirebaseDb(), 'users', uid, 'activities');
  const snap = await getDocs(col);
  const out: FeedActivity[] = [];
  for (const d of snap.docs) {
    const row = firestoreDocToFeedActivity(d.data() as Record<string, unknown>);
    if (row) out.push(row);
  }
  out.sort((a, b) => activitySortKey(b) - activitySortKey(a));
  return out;
}
