export type ActivityType = 'run' | 'race';

export interface FeedActivity {
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
