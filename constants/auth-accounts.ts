import type { FeedActivity, ProfileStats, ProfileUser } from '@/constants/run-data';
import { mockProfile, mockUserActivities } from '@/constants/run-data';

export type AccountId = 'alex' | 'jordan';

export type AuthAccount = {
  id: AccountId;
  email: string;
  password: string;
  profile: { user: ProfileUser; stats: ProfileStats };
  userActivities: FeedActivity[];
};

const jordanProfile: { user: ProfileUser; stats: ProfileStats } = {
  user: {
    name: 'Jordan Lee',
    username: 'jordan_runs',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    location: 'Los Angeles, CA',
    bio: '5K obsessive | Weekend long runs | Always chasing a new PR',
  },
  stats: {
    totalRuns: 89,
    totalDistance: 620,
    followers: 210,
    following: 342,
  },
};

const jordanActivities: FeedActivity[] = [
  {
    id: 'jordan-1',
    recordedAt: Date.UTC(2026, 2, 24, 21, 0, 0),
    user: {
      name: jordanProfile.user.name,
      username: jordanProfile.user.username,
      avatar: jordanProfile.user.avatar,
    },
    activity: {
      type: 'run',
      title: 'Track night — 12 × 400m',
      distance: 8.5,
      duration: '42:00',
      pace: '4:56/km',
      route: 'LA Stadium',
      timestamp: 'Today',
      mapImage:
        'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=600&h=400&fit=crop',
    },
    stats: { likes: 33, comments: 4 },
  },
  {
    id: 'jordan-2',
    recordedAt: Date.UTC(2026, 2, 22, 19, 30, 0),
    user: {
      name: jordanProfile.user.name,
      username: jordanProfile.user.username,
      avatar: jordanProfile.user.avatar,
    },
    activity: {
      type: 'run',
      distance: 5.0,
      duration: '24:18',
      pace: '4:51/km',
      route: 'Santa Monica Path',
      timestamp: '2d ago',
      mapImage:
        'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&h=400&fit=crop',
    },
    stats: { likes: 19, comments: 0 },
  },
];

export const AUTH_ACCOUNTS: AuthAccount[] = [
  {
    id: 'alex',
    email: 'alex@run.com',
    password: 'demo123',
    profile: mockProfile,
    userActivities: mockUserActivities,
  },
  {
    id: 'jordan',
    email: 'jordan@run.com',
    password: 'demo123',
    profile: jordanProfile,
    userActivities: jordanActivities,
  },
];

export function findAccountByCredentials(
  email: string,
  password: string,
): AuthAccount | undefined {
  const e = email.trim().toLowerCase();
  return AUTH_ACCOUNTS.find((a) => a.email.toLowerCase() === e && a.password === password);
}

export function getAccountById(id: string): AuthAccount | undefined {
  return AUTH_ACCOUNTS.find((a) => a.id === id);
}
