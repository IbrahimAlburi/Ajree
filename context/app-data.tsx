import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  findAccountByCredentials,
  getAccountById,
  type AccountId,
} from '@/constants/auth-accounts';
import {
  mockActivities,
  mockUserActivities,
  type FeedActivity,
  type ProfileStats,
  type ProfileUser,
  type RouteCoord,
} from '@/constants/run-data';
import { thinCoords } from '@/lib/route-geo';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import {
  fetchUserActivitiesFromFirestore,
  mergeRemoteAndLocalActivities,
  saveUserActivity,
} from '@/lib/firestore-activities';
import {
  defaultProfileForNewUser,
  fetchUserProfile,
  saveUserProfile,
} from '@/lib/firestore-user';

const STORAGE = {
  profile: '@ajree/profile',
  session: '@ajree/session',
  likes: '@ajree/likes',
  comments: '@ajree/comments',
  notifRead: '@ajree/notif-read',
  challengeJoins: '@ajree/challenge-joins-v1',
} as const;

type ChallengeJoinsFile = Record<string, string[]>;

async function loadChallengeJoinsFile(): Promise<ChallengeJoinsFile> {
  const raw = await AsyncStorage.getItem(STORAGE.challengeJoins);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ChallengeJoinsFile;
  } catch {
    return {};
  }
}

async function persistChallengeJoinsForAccount(
  accountKey: string,
  ids: Set<string>,
): Promise<void> {
  const all = await loadChallengeJoinsFile();
  all[accountKey] = [...ids];
  await AsyncStorage.setItem(STORAGE.challengeJoins, JSON.stringify(all));
}

function postsStorageKey(accountId: string) {
  return `@ajree/posts-${accountId}`;
}

export type PublishActivityInput = {
  type: 'run' | 'race';
  title: string;
  notes: string;
  distanceKm: number;
  durationMmSs: string;
  pace: string;
  routeName: string;
  mapImage: string;
  /** GPS path from Log screen (optional). */
  routeCoords?: RouteCoord[];
};

export type ActivityComment = {
  id: string;
  author: string;
  body: string;
  time: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
};

type ProfileBundle = {
  accountId: string;
  user: ProfileUser;
  stats: ProfileStats;
};

export type AuthSession =
  | { kind: 'demo'; accountId: AccountId; email: string }
  | { kind: 'firebase'; uid: string; email: string };

function storageUserId(session: AuthSession): string {
  return session.kind === 'demo' ? session.accountId : session.uid;
}

function parseStoredSession(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Record<string, unknown>;
    if (s.kind === 'firebase' && typeof s.uid === 'string' && typeof s.email === 'string') {
      return { kind: 'firebase', uid: s.uid, email: s.email };
    }
    if (typeof s.accountId === 'string' && typeof s.email === 'string') {
      if (s.accountId === 'alex' || s.accountId === 'jordan') {
        return { kind: 'demo', accountId: s.accountId as AccountId, email: s.email };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function firebaseAuthErrorMessage(code: string): string {
  if (code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Invalid email or password.';
  }
  if (code.includes('user-not-found')) {
    return 'No account found for this email.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account already exists with this email.';
  }
  if (code.includes('weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (code.includes('invalid-email')) {
    return 'Enter a valid email address.';
  }
  return 'Something went wrong. Try again.';
}

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'New supporter',
    body: 'Jordan Lee is cheering your runs.',
    time: '5m ago',
  },
  {
    id: 'n2',
    title: 'Challenge update',
    body: 'You’re 68% through the April Distance Challenge.',
    time: '1h ago',
  },
  {
    id: 'n3',
    title: 'Kudos on your activity',
    body: 'Sarah Martinez sent kudos on your run.',
    time: '3h ago',
  },
];

const GUEST_PROFILE: { user: ProfileUser; stats: ProfileStats } = {
  user: {
    name: '',
    username: '',
    avatar: '',
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

type LikeState = Record<string, { liked: boolean; count: number }>;
type CommentState = Record<string, ActivityComment[]>;

type AppDataValue = {
  hydrated: boolean;
  isLoggedIn: boolean;
  session: AuthSession | null;
  authError: string | null;
  /** True when `.env` has Firebase keys — email/password uses Firebase + Firestore profile. */
  useFirebaseAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  profile: { user: ProfileUser; stats: ProfileStats };
  feed: FeedActivity[];
  userActivities: FeedActivity[];
  likes: LikeState;
  comments: CommentState;
  notifications: (AppNotification & { read: boolean })[];
  allActivitiesById: Map<string, FeedActivity>;
  updateProfile: (user: Partial<ProfileUser>) => void;
  updateStats: (stats: Partial<ProfileStats>) => void;
  toggleLike: (activityId: string) => void;
  addComment: (activityId: string, body: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshFeed: () => Promise<void>;
  /** Returns new activity id, or null if not signed in. */
  publishActivity: (input: PublishActivityInput) => string | null;
  /** Per-account (or guest) joined community challenges — persisted locally. */
  joinedChallengeIds: Set<string>;
  /** False while join state is loading from storage (avoid CTA flash). */
  challengeJoinsReady: boolean;
  toggleChallengeJoin: (challengeId: string) => void;
};

const AppDataContext = createContext<AppDataValue | null>(null);

function buildInitialLikes(activities: FeedActivity[]): LikeState {
  const o: LikeState = {};
  for (const a of activities) {
    o[a.id] = { liked: false, count: a.stats.likes };
  }
  return o;
}

function mergeLikes(
  base: LikeState,
  stored: LikeState | null,
  activities: FeedActivity[],
): LikeState {
  const next = { ...base };
  if (stored) {
    for (const [id, v] of Object.entries(stored)) {
      if (next[id]) {
        next[id] = {
          liked: v.liked,
          count: Math.max(0, v.count),
        };
      }
    }
  }
  for (const a of activities) {
    if (!next[a.id]) {
      next[a.id] = { liked: false, count: a.stats.likes };
    }
  }
  return next;
}

function syncUserActivities(activities: FeedActivity[], user: ProfileUser): FeedActivity[] {
  return activities.map((a) => ({
    ...a,
    user: {
      ...a.user,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
    },
  }));
}

function applyAccount(
  acc: NonNullable<ReturnType<typeof getAccountById>>,
  storedBundle: ProfileBundle | null,
) {
  if (storedBundle && storedBundle.accountId === acc.id) {
    const profile = { user: storedBundle.user, stats: storedBundle.stats };
    return {
      profile,
      userActivities: syncUserActivities([...acc.userActivities], storedBundle.user),
    };
  }
  return {
    profile: acc.profile,
    userActivities: syncUserActivities([...acc.userActivities], acc.profile.user),
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState(GUEST_PROFILE);
  const [publishedPosts, setPublishedPosts] = useState<FeedActivity[]>([]);
  const feed = useMemo(
    () => [...publishedPosts, ...mockActivities],
    [publishedPosts],
  );
  const [userActivities, setUserActivities] = useState<FeedActivity[]>([]);
  const [likes, setLikes] = useState<LikeState>(() => buildInitialLikes([...mockActivities]));
  const [comments, setComments] = useState<CommentState>({});
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(() => new Set());
  const [challengeJoinsReady, setChallengeJoinsReady] = useState(false);

  const allActivitiesById = useMemo(() => {
    const m = new Map<string, FeedActivity>();
    for (const a of [...feed, ...userActivities]) {
      m.set(a.id, a);
    }
    return m;
  }, [feed, userActivities]);

  const useFirebaseAuth = useMemo(() => {
    if (!isFirebaseConfigured) return false;
    try {
      getFirebaseAuth();
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDemoFromStorage(
      rawSession: string | null,
      rawProfile: string | null,
      rawLikes: string | null,
      rawComments: string | null,
      rawRead: string | null,
    ) {
      let bundle: ProfileBundle | null = null;
      if (rawProfile) {
        try {
          const parsed = JSON.parse(rawProfile) as ProfileBundle | { user: ProfileUser; stats: ProfileStats };
          if ('accountId' in parsed && parsed.accountId) {
            bundle = parsed as ProfileBundle;
          } else {
            const legacy = parsed as { user: ProfileUser; stats: ProfileStats };
            bundle = { accountId: 'alex', user: legacy.user, stats: legacy.stats };
          }
        } catch {
          bundle = null;
        }
      }

      let nextSession = parseStoredSession(rawSession);
      if (nextSession?.kind !== 'demo' || !getAccountById(nextSession.accountId)) {
        nextSession = null;
        if (rawSession) await AsyncStorage.removeItem(STORAGE.session);
      }

      const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;
      let likeScope: FeedActivity[] = [...mockActivities];

      if (nextSession) {
        const acc = getAccountById(nextSession.accountId);
        if (acc) {
          setSession(nextSession);
          const applied = applyAccount(acc, bundle);
          setProfile(applied.profile);
          const rawPub = await AsyncStorage.getItem(postsStorageKey(acc.id));
          const posts = rawPub ? (JSON.parse(rawPub) as FeedActivity[]) : [];
          setPublishedPosts(posts);
          const syncedPub = syncUserActivities(posts, applied.profile.user);
          setUserActivities([...syncedPub, ...applied.userActivities]);
          likeScope = [...posts, ...mockActivities, ...applied.userActivities];
        }
      } else {
        setSession(null);
        setProfile(GUEST_PROFILE);
        setUserActivities([]);
        setPublishedPosts([]);
      }
      const base = buildInitialLikes(likeScope);
      setLikes(mergeLikes(base, storedLikes, likeScope));

      if (rawComments) {
        setComments(JSON.parse(rawComments) as CommentState);
      }
      if (rawRead) {
        setReadIds(new Set(JSON.parse(rawRead) as string[]));
      }
    }

    if (useFirebaseAuth) {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, async (user: User | null) => {
        if (cancelled) return;
        try {
          const [rawSession, rawProfile, rawLikes, rawComments, rawRead] = await Promise.all([
            AsyncStorage.getItem(STORAGE.session),
            AsyncStorage.getItem(STORAGE.profile),
            AsyncStorage.getItem(STORAGE.likes),
            AsyncStorage.getItem(STORAGE.comments),
            AsyncStorage.getItem(STORAGE.notifRead),
          ]);

          const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;

          if (user) {
            setAuthError(null);
            const uid = user.uid;
            const email = user.email ?? '';
            setSession({ kind: 'firebase', uid, email });

            let remote = await fetchUserProfile(uid);
            if (!remote) {
              const seed = defaultProfileForNewUser(email, uid);
              await saveUserProfile(uid, seed.user, seed.stats);
              remote = seed;
            }

            setProfile({ user: remote.user, stats: remote.stats });
            await AsyncStorage.setItem(
              STORAGE.profile,
              JSON.stringify({
                accountId: uid,
                user: remote.user,
                stats: remote.stats,
              } satisfies ProfileBundle),
            );

            const rawPub = await AsyncStorage.getItem(postsStorageKey(uid));
            const localPosts = rawPub ? (JSON.parse(rawPub) as FeedActivity[]) : [];
            let mergedPosts = localPosts;
            try {
              const remoteActivities = await fetchUserActivitiesFromFirestore(uid);
              mergedPosts = mergeRemoteAndLocalActivities(remoteActivities, localPosts);
              await AsyncStorage.setItem(postsStorageKey(uid), JSON.stringify(mergedPosts));
            } catch {
              mergedPosts = localPosts;
            }
            setPublishedPosts(mergedPosts);
            const syncedPub = syncUserActivities(mergedPosts, remote.user);
            setUserActivities(syncedPub);

            const likeScope = [...mergedPosts, ...mockActivities, ...syncedPub];
            const base = buildInitialLikes(likeScope);
            setLikes(mergeLikes(base, storedLikes, likeScope));

            if (rawComments) setComments(JSON.parse(rawComments) as CommentState);
            if (rawRead) setReadIds(new Set(JSON.parse(rawRead) as string[]));
          } else {
            setSession(null);
            setProfile(GUEST_PROFILE);
            setUserActivities([]);
            setPublishedPosts([]);
            await hydrateDemoFromStorage(rawSession, rawProfile, rawLikes, rawComments, rawRead);
          }
        } catch {
          /* keep defaults */
        } finally {
          if (!cancelled) setHydrated(true);
        }
      });
      return () => {
        cancelled = true;
        unsub();
      };
    }

    if (!useFirebaseAuth) {
      void (async () => {
        try {
          const [rawSession, rawProfile, rawLikes, rawComments, rawRead] = await Promise.all([
            AsyncStorage.getItem(STORAGE.session),
            AsyncStorage.getItem(STORAGE.profile),
            AsyncStorage.getItem(STORAGE.likes),
            AsyncStorage.getItem(STORAGE.comments),
            AsyncStorage.getItem(STORAGE.notifRead),
          ]);
          if (cancelled) return;
          await hydrateDemoFromStorage(rawSession, rawProfile, rawLikes, rawComments, rawRead);
        } catch {
          /* keep defaults */
        } finally {
          if (!cancelled) setHydrated(true);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [useFirebaseAuth]);

  /** Stable string — avoids effect churn when `session` is a new object reference each auth tick. */
  const challengeAccountKey = session ? storageUserId(session) : '_guest';

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setChallengeJoinsReady(false);
    const key = challengeAccountKey;
    void (async () => {
      try {
        const all = await loadChallengeJoinsFile();
        if (cancelled) return;
        setJoinedChallengeIds(new Set(all[key] ?? []));
      } catch {
        if (!cancelled) setJoinedChallengeIds(new Set());
      } finally {
        if (!cancelled) setChallengeJoinsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, challengeAccountKey]);

  const persistProfileStorage = useCallback(
    (bundle: ProfileBundle, sessionForRemote: AuthSession | null) => {
      setProfile({ user: bundle.user, stats: bundle.stats });
      void AsyncStorage.setItem(STORAGE.profile, JSON.stringify(bundle));
      if (sessionForRemote?.kind === 'firebase') {
        void saveUserProfile(sessionForRemote.uid, bundle.user, bundle.stats);
      }
    },
    [],
  );

  const persistProfile = useCallback(
    (p: { user: ProfileUser; stats: ProfileStats }) => {
      if (!session) return;
      const bundle: ProfileBundle = {
        accountId: storageUserId(session),
        user: p.user,
        stats: p.stats,
      };
      persistProfileStorage(bundle, session);
    },
    [session, persistProfileStorage],
  );

  const persistLikes = useCallback((next: LikeState) => {
    void AsyncStorage.setItem(STORAGE.likes, JSON.stringify(next));
  }, []);

  const persistComments = useCallback((next: CommentState) => {
    void AsyncStorage.setItem(STORAGE.comments, JSON.stringify(next));
  }, []);

  const persistRead = useCallback((ids: Set<string>) => {
    void AsyncStorage.setItem(STORAGE.notifRead, JSON.stringify([...ids]));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (useFirebaseAuth) {
        try {
          const auth = getFirebaseAuth();
          await signInWithEmailAndPassword(auth, email.trim(), password);
          setAuthError(null);
          return true;
        } catch (e: unknown) {
          const code =
            e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
          setAuthError(firebaseAuthErrorMessage(code));
          return false;
        }
      }

      const acc = findAccountByCredentials(email, password);
      if (!acc) {
        setAuthError('Invalid email or password.');
        return false;
      }
      setAuthError(null);
      const newSession: AuthSession = { kind: 'demo', accountId: acc.id, email: acc.email };
      setSession(newSession);
      await AsyncStorage.setItem(STORAGE.session, JSON.stringify(newSession));

      const rawProfile = await AsyncStorage.getItem(STORAGE.profile);
      let bundle: ProfileBundle | null = null;
      if (rawProfile) {
        try {
          const parsed = JSON.parse(rawProfile) as ProfileBundle | { user: ProfileUser; stats: ProfileStats };
          if ('accountId' in parsed && parsed.accountId) {
            bundle = parsed as ProfileBundle;
          }
        } catch {
          bundle = null;
        }
      }

      const applied = applyAccount(acc, bundle);
      const rawPub = await AsyncStorage.getItem(postsStorageKey(acc.id));
      const posts = rawPub ? (JSON.parse(rawPub) as FeedActivity[]) : [];
      setPublishedPosts(posts);
      const syncedPub = syncUserActivities(posts, applied.profile.user);
      setUserActivities([...syncedPub, ...applied.userActivities]);
      persistProfileStorage(
        {
          accountId: acc.id,
          user: applied.profile.user,
          stats: applied.profile.stats,
        },
        newSession,
      );

      const rawLikes = await AsyncStorage.getItem(STORAGE.likes);
      const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;
      const likeScope = [...posts, ...mockActivities, ...applied.userActivities];
      const base = buildInitialLikes(likeScope);
      setLikes(mergeLikes(base, storedLikes, likeScope));

      return true;
    },
    [persistProfileStorage, useFirebaseAuth],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      if (!useFirebaseAuth) {
        setAuthError('Firebase is not configured. Use a demo account or add Firebase keys to .env.');
        return false;
      }
      try {
        const auth = getFirebaseAuth();
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = cred.user.uid;
        const em = cred.user.email ?? email.trim();
        const seed = defaultProfileForNewUser(em, uid);
        await saveUserProfile(uid, seed.user, seed.stats);
        await AsyncStorage.setItem(
          STORAGE.profile,
          JSON.stringify({
            accountId: uid,
            user: seed.user,
            stats: seed.stats,
          } satisfies ProfileBundle),
        );
        setAuthError(null);
        return true;
      } catch (e: unknown) {
        const code =
          e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
        setAuthError(firebaseAuthErrorMessage(code));
        return false;
      }
    },
    [useFirebaseAuth],
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    if (session?.kind === 'firebase') {
      try {
        await signOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
      return;
    }

    setSession(null);
    setProfile(GUEST_PROFILE);
    setUserActivities([]);
    setPublishedPosts([]);
    await AsyncStorage.removeItem(STORAGE.session);
    const rawLikes = await AsyncStorage.getItem(STORAGE.likes);
    const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;
    const base = buildInitialLikes([...mockActivities]);
    setLikes(mergeLikes(base, storedLikes, [...mockActivities]));
  }, [session]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const updateProfile = useCallback(
    (user: Partial<ProfileUser>) => {
      if (!session) return;
      const next = {
        ...profile,
        user: { ...profile.user, ...user },
      };
      persistProfile(next);
      setUserActivities((prev) => syncUserActivities(prev, next.user));
    },
    [profile, persistProfile, session],
  );

  const updateStats = useCallback(
    (stats: Partial<ProfileStats>) => {
      if (!session) return;
      const next = {
        ...profile,
        stats: { ...profile.stats, ...stats },
      };
      persistProfile(next);
    },
    [profile, persistProfile, session],
  );

  const toggleLike = useCallback(
    (activityId: string) => {
      setLikes((prev) => {
        const baseActivity = allActivitiesById.get(activityId);
        const base = baseActivity?.stats.likes ?? 0;
        const cur = prev[activityId] ?? { liked: false, count: base };
        const nextLiked = !cur.liked;
        const count = nextLiked ? cur.count + 1 : Math.max(0, cur.count - 1);
        const next = { ...prev, [activityId]: { liked: nextLiked, count } };
        persistLikes(next);
        return next;
      });
    },
    [allActivitiesById, persistLikes],
  );

  const addComment = useCallback(
    (activityId: string, body: string) => {
      if (!session) return;
      const trimmed = body.trim();
      if (!trimmed) return;
      const row: ActivityComment = {
        id: `c-${Date.now()}`,
        author: profile.user.name || 'Runner',
        body: trimmed,
        time: 'Just now',
      };
      setComments((prev) => {
        const list = prev[activityId] ?? [];
        const next = { ...prev, [activityId]: [...list, row] };
        persistComments(next);
        return next;
      });
    },
    [profile.user.name, persistComments, session],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        persistRead(next);
        return next;
      });
    },
    [persistRead],
  );

  const markAllNotificationsRead = useCallback(() => {
    const next = new Set(SEED_NOTIFICATIONS.map((n) => n.id));
    setReadIds(next);
    persistRead(next);
  }, [persistRead]);

  const refreshFeed = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
    if (!useFirebaseAuth || session?.kind !== 'firebase') return;
    try {
      const uid = session.uid;
      const remoteActivities = await fetchUserActivitiesFromFirestore(uid);
      const rawPub = await AsyncStorage.getItem(postsStorageKey(uid));
      const localPosts = rawPub ? (JSON.parse(rawPub) as FeedActivity[]) : [];
      const mergedPosts = mergeRemoteAndLocalActivities(remoteActivities, localPosts);
      await AsyncStorage.setItem(postsStorageKey(uid), JSON.stringify(mergedPosts));
      setPublishedPosts(mergedPosts);
      setUserActivities(syncUserActivities(mergedPosts, profile.user));
      const rawLikes = await AsyncStorage.getItem(STORAGE.likes);
      const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;
      const likeScope = [...mergedPosts, ...mockActivities];
      const base = buildInitialLikes(likeScope);
      setLikes(mergeLikes(base, storedLikes, likeScope));
    } catch {
      /* keep current feed */
    }
  }, [useFirebaseAuth, session, profile.user]);

  const toggleChallengeJoin = useCallback(
    (challengeId: string) => {
      const accountKey = session ? storageUserId(session) : '_guest';
      setJoinedChallengeIds((prev) => {
        const next = new Set(prev);
        if (next.has(challengeId)) next.delete(challengeId);
        else next.add(challengeId);
        void persistChallengeJoinsForAccount(accountKey, next);
        return next;
      });
    },
    [session],
  );

  const publishActivity = useCallback(
    (input: PublishActivityInput): string | null => {
      if (!session) return null;
      const id = `post-${Date.now()}`;
      const titleLine =
        input.title.trim() ||
        (input.notes.trim()
          ? input.notes.trim().slice(0, 120)
          : input.type === 'race'
            ? 'Race day ✔️'
            : 'Out on the road');
      const routeCoords =
        input.routeCoords && input.routeCoords.length >= 2
          ? thinCoords(input.routeCoords, 200)
          : undefined;
      const newActivity: FeedActivity = {
        id,
        recordedAt: Date.now(),
        user: { ...profile.user },
        activity: {
          type: input.type,
          title: titleLine,
          distance: input.distanceKm,
          duration: input.durationMmSs,
          pace: input.pace,
          route: input.routeName.trim() || undefined,
          timestamp: 'Just now',
          mapImage: input.mapImage,
          ...(routeCoords ? { routeCoords } : {}),
        },
        stats: { likes: 0, comments: 0 },
      };
      setPublishedPosts((prev) => {
        const next = [newActivity, ...prev];
        void AsyncStorage.setItem(postsStorageKey(storageUserId(session)), JSON.stringify(next));
        return next;
      });
      setUserActivities((prev) => {
        const synced = syncUserActivities([newActivity], profile.user)[0];
        return [synced, ...prev];
      });
      setLikes((prev) => {
        const next = { ...prev, [id]: { liked: false, count: 0 } };
        persistLikes(next);
        return next;
      });
      if (session.kind === 'firebase') {
        void saveUserActivity(session.uid, newActivity);
      }
      const newStats: ProfileStats = {
        ...profile.stats,
        totalRuns: profile.stats.totalRuns + 1,
        totalDistance: profile.stats.totalDistance + Math.round(input.distanceKm),
      };
      persistProfile({ user: profile.user, stats: newStats });
      return id;
    },
    [session, profile, persistProfile, persistLikes],
  );

  const notifications = useMemo(
    () =>
      SEED_NOTIFICATIONS.map((n) => ({
        ...n,
        read: readIds.has(n.id),
      })),
    [readIds],
  );

  const isLoggedIn = session !== null;

  const value = useMemo<AppDataValue>(
    () => ({
      hydrated,
      isLoggedIn,
      session,
      authError,
      useFirebaseAuth,
      login,
      register,
      logout,
      clearAuthError,
      profile,
      feed,
      userActivities,
      likes,
      comments,
      notifications,
      allActivitiesById,
      updateProfile,
      updateStats,
      toggleLike,
      addComment,
      markNotificationRead,
      markAllNotificationsRead,
      refreshFeed,
      publishActivity,
      joinedChallengeIds,
      challengeJoinsReady,
      toggleChallengeJoin,
    }),
    [
      hydrated,
      isLoggedIn,
      session,
      authError,
      useFirebaseAuth,
      login,
      register,
      logout,
      clearAuthError,
      profile,
      feed,
      userActivities,
      likes,
      comments,
      notifications,
      allActivitiesById,
      updateProfile,
      updateStats,
      toggleLike,
      addComment,
      markNotificationRead,
      markAllNotificationsRead,
      refreshFeed,
      publishActivity,
      joinedChallengeIds,
      challengeJoinsReady,
      toggleChallengeJoin,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}
