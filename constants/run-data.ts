export type ActivityType = 'run' | 'race';

export interface FeedActivity {
  id: string;
  /** Epoch ms — used for monthly km leaderboard (defaults derived from `post-{timestamp}` id if omitted). */
  recordedAt?: number;
  user: {
    name: string;
    avatar: string;
    username: string;
  };
  activity: {
    type: ActivityType;
    title?: string;
    distance: number;
    duration: string;
    pace: string;
    route?: string;
    timestamp: string;
    mapImage?: string;
  };
  stats: {
    likes: number;
    comments: number;
  };
}

export interface Challenge {
  title: string;
  description: string;
  goal: string;
  participants: number;
  daysLeft: number;
  progress: number;
  icon: string;
}

export interface ProfileUser {
  name: string;
  username: string;
  avatar: string;
  location: string;
  bio: string;
}

export interface ProfileStats {
  totalRuns: number;
  totalDistance: number;
  followers: number;
  following: number;
}

export const mockActivities: FeedActivity[] = [
  {
    id: 'feed-1',
    recordedAt: Date.UTC(2026, 2, 29, 14, 30, 0),
    user: {
      name: 'Sarah Martinez',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      username: 'sarah_runs',
    },
    activity: {
      type: 'race',
      title: '🎉 Completed my first 10K!',
      distance: 10.2,
      duration: '56:32',
      pace: '5:32/km',
      route: 'Central Park Loop',
      timestamp: '2h ago',
      mapImage:
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop',
    },
    stats: {
      likes: 124,
      comments: 18,
    },
  },
  {
    id: 'feed-2',
    recordedAt: Date.UTC(2026, 1, 20, 8, 0, 0),
    user: {
      name: 'Mike Chen',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      username: 'mike_runner',
    },
    activity: {
      type: 'run',
      distance: 5.4,
      duration: '28:15',
      pace: '5:13/km',
      route: 'Riverside Trail',
      timestamp: '4h ago',
      mapImage:
        'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&h=400&fit=crop',
    },
    stats: {
      likes: 67,
      comments: 5,
    },
  },
  {
    id: 'feed-3',
    recordedAt: Date.UTC(2026, 2, 28, 7, 15, 0),
    user: {
      name: 'Emma Wilson',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      username: 'emma_fit',
    },
    activity: {
      type: 'run',
      title: 'Morning miles with the crew 🌅',
      distance: 8.0,
      duration: '45:20',
      pace: '5:40/km',
      route: 'Beach Boardwalk',
      timestamp: '6h ago',
      mapImage:
        'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=600&h=400&fit=crop',
    },
    stats: {
      likes: 89,
      comments: 12,
    },
  },
  {
    id: 'feed-4',
    recordedAt: Date.UTC(2026, 2, 27, 18, 45, 0),
    user: {
      name: 'Nico Alvarez',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      username: 'nico_trails',
    },
    activity: {
      type: 'run',
      title: 'Tempo Tuesday — held 4:30/km for 6K',
      distance: 12.0,
      duration: '54:02',
      pace: '4:30/km',
      route: 'Hillside Loop',
      timestamp: '8h ago',
      mapImage:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
    },
    stats: {
      likes: 201,
      comments: 31,
    },
  },
];

/** Activities shown on the current user's profile grid (same user as mockProfile). */
export const mockUserActivities: FeedActivity[] = [
  {
    id: 'user-1',
    recordedAt: Date.UTC(2026, 2, 26, 6, 0, 0),
    user: {
      name: 'Alex Johnson',
      username: 'alex_runs_2024',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    },
    activity: {
      type: 'run',
      title: 'Sunrise 10K — felt strong today',
      distance: 10.0,
      duration: '52:10',
      pace: '5:13/km',
      route: 'Embarcadero',
      timestamp: 'Yesterday',
      mapImage:
        'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=600&h=400&fit=crop',
    },
    stats: { likes: 41, comments: 3 },
  },
  {
    id: 'user-2',
    recordedAt: Date.UTC(2026, 2, 25, 17, 30, 0),
    user: {
      name: 'Alex Johnson',
      username: 'alex_runs_2024',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    },
    activity: {
      type: 'run',
      distance: 6.2,
      duration: '33:45',
      pace: '5:26/km',
      route: 'Golden Gate Park',
      timestamp: '3d ago',
      mapImage:
        'https://images.unsplash.com/photo-1486218119243-13883505764c?w=600&h=400&fit=crop',
    },
    stats: { likes: 28, comments: 1 },
  },
  {
    id: 'user-3',
    recordedAt: Date.UTC(2026, 2, 10, 9, 0, 0),
    user: {
      name: 'Alex Johnson',
      username: 'alex_runs_2024',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    },
    activity: {
      type: 'race',
      title: 'Half marathon PR 🏅',
      distance: 21.1,
      duration: '1:38:22',
      pace: '4:40/km',
      route: 'City Marathon',
      timestamp: '2w ago',
      mapImage:
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&h=400&fit=crop',
    },
    stats: { likes: 156, comments: 22 },
  },
];

export interface FollowPerson {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export const mockFollowers: FollowPerson[] = [
  {
    id: 'f1',
    name: 'Jordan Lee',
    username: 'jordan_runs',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  },
  {
    id: 'f2',
    name: 'Priya Shah',
    username: 'priya_fit',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop',
  },
  {
    id: 'f3',
    name: 'Chris Ortiz',
    username: 'chris_trails',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
  },
];

export const mockFollowing: FollowPerson[] = [
  {
    id: 'g1',
    name: 'Sarah Martinez',
    username: 'sarah_runs',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  },
  {
    id: 'g2',
    name: 'Mike Chen',
    username: 'mike_runner',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
  {
    id: 'g3',
    name: 'Emma Wilson',
    username: 'emma_fit',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  },
];

export const mockChallenges: Challenge[] = [
  {
    title: 'April Distance Challenge',
    description: 'Run 100km this month',
    goal: '100km',
    participants: 2847,
    daysLeft: 12,
    progress: 68,
    icon: '🏃',
  },
  {
    title: 'Early Bird Special',
    description: 'Complete 10 morning runs',
    goal: '10 runs',
    participants: 1523,
    daysLeft: 20,
    progress: 40,
    icon: '🌅',
  },
  {
    title: 'Speed Demon',
    description: 'Run 5K under 25 minutes',
    goal: '<25min',
    participants: 892,
    daysLeft: 7,
    progress: 85,
    icon: '⚡',
  },
];

export const mockProfile: { user: ProfileUser; stats: ProfileStats } = {
  user: {
    name: 'Alex Johnson',
    username: 'alex_runs_2024',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    location: 'San Francisco, CA',
    bio: 'Marathon runner | Trail enthusiast | Coffee addict ☕ | Running towards my goals one step at a time',
  },
  stats: {
    totalRuns: 342,
    totalDistance: 2847,
    followers: 1245,
    following: 876,
  },
};
