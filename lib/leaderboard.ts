import { AUTH_ACCOUNTS } from '@/constants/auth-accounts';
import type { FeedActivity } from '@/constants/run-data';

export type LeaderboardEntry = {
  rank: number;
  username: string;
  name: string;
  avatar: string;
  km: number;
};

const FALLBACK_RECORDED = Date.UTC(2026, 2, 15, 12, 0, 0);

/** Resolve when an activity was logged (for monthly km). */
export function getActivityRecordedAt(a: FeedActivity): number {
  if (typeof a.recordedAt === 'number' && Number.isFinite(a.recordedAt)) {
    return a.recordedAt;
  }
  const post = /^post-(\d+)$/.exec(a.id);
  if (post) {
    const ms = parseInt(post[1], 10);
    if (Number.isFinite(ms)) return ms;
  }
  return FALLBACK_RECORDED;
}

/** `month` is 1–12 (January = 1). */
export function buildMonthlyKmLeaderboard(
  activities: FeedActivity[],
  year: number,
  month: number,
): LeaderboardEntry[] {
  const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const end = Date.UTC(year, month, 1, 0, 0, 0, 0);

  const byUser = new Map<
    string,
    {
      name: string;
      avatar: string;
      km: number;
    }
  >();

  for (const a of activities) {
    const t = getActivityRecordedAt(a);
    if (t < start || t >= end) continue;
    const u = a.user.username;
    const cur = byUser.get(u) ?? {
      name: a.user.name,
      avatar: a.user.avatar,
      km: 0,
    };
    cur.km += a.activity.distance;
    cur.name = a.user.name;
    cur.avatar = a.user.avatar;
    byUser.set(u, cur);
  }

  const rows = [...byUser.entries()]
    .map(([username, v]) => ({
      username,
      name: v.name,
      avatar: v.avatar,
      km: Math.round(v.km * 10) / 10,
    }))
    .sort((a, b) => b.km - a.km);

  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}

export function formatLeaderboardMonth(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Deduped activity list for leaderboard math (feed + your activities + all demo accounts). */
export function mergeLeaderboardActivities(feed: FeedActivity[], userActivities: FeedActivity[]): FeedActivity[] {
  const map = new Map<string, FeedActivity>();
  for (const a of feed) map.set(a.id, a);
  for (const a of userActivities) map.set(a.id, a);
  for (const acc of AUTH_ACCOUNTS) {
    for (const a of acc.userActivities) {
      if (!map.has(a.id)) map.set(a.id, a);
    }
  }
  return [...map.values()];
}

/**
 * "Top X%" for this month’s ranking (rank 1 of 100 runners → top 1%).
 * Returns at least 1.
 */
export function rankToTopPercent(rank: number, totalRunners: number): number {
  if (totalRunners <= 0 || rank < 1) return 1;
  return Math.max(1, Math.min(100, Math.ceil((rank / totalRunners) * 100)));
}

export function findMonthlyRankBadge(
  entries: LeaderboardEntry[],
  username: string,
): { rank: number; topPercent: number; total: number } | null {
  if (!username.trim() || entries.length === 0) return null;
  const row = entries.find((e) => e.username === username);
  if (!row) return null;
  return {
    rank: row.rank,
    total: entries.length,
    topPercent: rankToTopPercent(row.rank, entries.length),
  };
}
