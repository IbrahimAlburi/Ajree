import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from '@/constants/run-data';

const STORAGE = {
  profile: '@ajree/profile',
  session: '@ajree/session',
  likes: '@ajree/likes',
  comments: '@ajree/comments',
  notifRead: '@ajree/notif-read',
} as const;

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

export type AuthSession = {
  accountId: AccountId;
  email: string;
};

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'New follower',
    body: 'Jordan Lee started following you.',
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
    title: 'Like on your activity',
    body: 'Sarah Martinez liked your run.',
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
  login: (email: string, password: string) => Promise<boolean>;
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

  const allActivitiesById = useMemo(() => {
    const m = new Map<string, FeedActivity>();
    for (const a of [...feed, ...userActivities]) {
      m.set(a.id, a);
    }
    return m;
  }, [feed, userActivities]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawSession, rawProfile, rawLikes, rawComments, rawRead] = await Promise.all([
          AsyncStorage.getItem(STORAGE.session),
          AsyncStorage.getItem(STORAGE.profile),
          AsyncStorage.getItem(STORAGE.likes),
          AsyncStorage.getItem(STORAGE.comments),
          AsyncStorage.getItem(STORAGE.notifRead),
        ]);
        if (cancelled) return;

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

        let nextSession: AuthSession | null = null;
        if (rawSession) {
          try {
            const s = JSON.parse(rawSession) as AuthSession;
            if (getAccountById(s.accountId)) {
              nextSession = s;
            } else {
              await AsyncStorage.removeItem(STORAGE.session);
            }
          } catch {
            await AsyncStorage.removeItem(STORAGE.session);
          }
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
          const ids = JSON.parse(rawRead) as string[];
          setReadIds(new Set(ids));
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistProfileStorage = useCallback((bundle: ProfileBundle) => {
    setProfile({ user: bundle.user, stats: bundle.stats });
    void AsyncStorage.setItem(STORAGE.profile, JSON.stringify(bundle));
  }, []);

  const persistProfile = useCallback(
    (p: { user: ProfileUser; stats: ProfileStats }) => {
      if (!session) return;
      const bundle: ProfileBundle = {
        accountId: session.accountId,
        user: p.user,
        stats: p.stats,
      };
      persistProfileStorage(bundle);
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

  const login = useCallback(async (email: string, password: string) => {
    const acc = findAccountByCredentials(email, password);
    if (!acc) {
      setAuthError('Invalid email or password.');
      return false;
    }
    setAuthError(null);
    const newSession: AuthSession = { accountId: acc.id, email: acc.email };
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
    persistProfileStorage({
      accountId: acc.id,
      user: applied.profile.user,
      stats: applied.profile.stats,
    });

    const rawLikes = await AsyncStorage.getItem(STORAGE.likes);
    const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;
    const likeScope = [...posts, ...mockActivities, ...applied.userActivities];
    const base = buildInitialLikes(likeScope);
    setLikes(mergeLikes(base, storedLikes, likeScope));

    return true;
  }, [persistProfileStorage]);

  const logout = useCallback(async () => {
    setSession(null);
    setAuthError(null);
    setProfile(GUEST_PROFILE);
    setUserActivities([]);
    setPublishedPosts([]);
    await AsyncStorage.removeItem(STORAGE.session);
    const rawLikes = await AsyncStorage.getItem(STORAGE.likes);
    const storedLikes = rawLikes ? (JSON.parse(rawLikes) as LikeState) : null;
    const base = buildInitialLikes([...mockActivities]);
    setLikes(mergeLikes(base, storedLikes, [...mockActivities]));
  }, []);

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
  }, []);

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
        },
        stats: { likes: 0, comments: 0 },
      };
      setPublishedPosts((prev) => {
        const next = [newActivity, ...prev];
        void AsyncStorage.setItem(postsStorageKey(session.accountId), JSON.stringify(next));
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
      login,
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
    }),
    [
      hydrated,
      isLoggedIn,
      session,
      authError,
      login,
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
