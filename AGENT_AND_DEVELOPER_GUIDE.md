# Ajree — Agent & Developer Guide

**Location:** `Ajree/AGENT_AND_DEVELOPER_GUIDE.md` (in the project root next to `package.json`).

This document summarizes the **tech stack**, **architecture**, **what was built**, and **how to extend** the app. It is written for **new developers** and **AI coding agents** picking up the project.

### Contents

1. [What this app is](#what-this-app-is)  
2. [Tech stack](#tech-stack)  
3. [How to run and check quality](#how-to-run-and-check-quality)  
4. [Repository layout](#repository-layout-what-matters)  
5. [Global state](#global-state-contextapp-datatsx)  
6. [Demo authentication](#demo-authentication)  
7. [Navigation conventions](#navigation-conventions)  
8. [Leaderboard & challenges](#leaderboard--challenges)  
9. [Home screen](#home-screen-apptabsindextsx)  
10. [Feature map](#feature-map-what-exists)  
11. [Types and data shapes](#types-and-data-shapes)  
12. [Design principles](#design-principles-for-future-work)  
13. [Known limitations](#known-limitations)  
14. [Quick reference](#quick-reference-files-to-touch-for-common-tasks)  

*(Anchors follow common Markdown slug rules; if a link fails in your viewer, scroll by section title.)*

---

## What this app is

**Ajree** (package name `ajree`) is an **Expo / React Native** running-social prototype: **home** feed (with **monthly km leaderboard** on the same screen), **post** composer, **activity** detail (route / map imagery), **profile**, demo **login**, **likes**, **comments**, **notifications**, and a **Challenges** tab (community goals only). **There is no production backend yet** — auth, feeds, and posts are **client-side** with **AsyncStorage** persistence.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | **Node** (local dev), **Expo SDK ~54** |
| UI | **React 19**, **React Native 0.81** |
| Navigation | **Expo Router ~6** (file-based routes, typed routes enabled in `app.json`) |
| State | **React Context** — single `AppDataProvider` (`context/app-data.tsx`) |
| Persistence | **@react-native-async-storage/async-storage** |
| Styling | React Native `StyleSheet`, theme hooks (`hooks/use-theme-color.ts`, `constants/theme.ts`) |
| Images | **expo-image** |
| Gestures / animation | **react-native-gesture-handler**, **react-native-reanimated** |
| Lint / types | **TypeScript ~5.9**, **ESLint** via `expo lint` |

**Note:** `@supabase/supabase-js` is listed in `package.json` but **not imported anywhere** yet — reserved for future real auth / sync.

---

## How to run and check quality

From the `Ajree` directory:

```bash
npm install
npx expo start
```

Quality checks used in development:

```bash
npx tsc --noEmit
npx expo lint
```

(`expo lint` runs ESLint with Expo’s config — there is no separate `expo eslint` command.)

**Windows PowerShell:** Older shells do not support `&&` between commands. Change directory first, then run tools:

```powershell
Set-Location "C:\path\to\myamazingap2\Ajree"
npx tsc --noEmit
npx expo lint
```

Or use a single line on **PowerShell 7+**: `Set-Location ...; npx tsc --noEmit; npx expo lint`.

First install can feel slow (native deps, Metro bundler, caches). Subsequent starts are faster.

---

## Repository layout (what matters)

```
app/
  _layout.tsx              # Root Stack: tabs + modals/screens
  (tabs)/
    index.tsx              # Home: hero, pulse tips, quick actions, MONTHLY LEADERBOARD, feed
    challenges.tsx         # Challenges only (mockChallenges + ChallengeCard)
    explore.tsx            # Explore / search shell
    post.tsx, profile.tsx  # Post composer, Profile tab
  activity/[id].tsx        # Activity detail
  edit-profile.tsx         # Modal
  settings.tsx             # Modal
  notifications.tsx        # Modal
  follow-list.tsx          # Stack screen (query param `type`: followers | following)
  user/[username].tsx      # Redirect → Profile tab (legacy deep links)
components/
  profile/                 # login-section, other-user-profile
  run/                     # activity-card, profile-header, home-hero, challenge-card,
                           # monthly-leaderboard
context/
  app-data.tsx             # Global app state + AsyncStorage
constants/
  auth-accounts.ts         # Demo users (email/password, seeded activities)
  run-data.ts              # Types, mock feed, mock profile data, optional recordedAt on activities
  public-users.ts          # Extra bios/locations for known @handles
  post-presets.ts          # Post composer helpers
lib/
  profile-navigation.ts    # Navigate to Profile tab (+ optional username); uses router.navigate
  profile-format.ts        # formatProfileKm for profile stats display
  leaderboard.ts           # Monthly km board, mergeLeaderboardActivities, rank / percentile helpers
  maps.ts, run-math.ts, home-copy.ts   # home-copy: taglines, hero copy, pulse tips, feed mode labels
AGENT_AND_DEVELOPER_GUIDE.md   # This file — update when behavior or routes change meaningfully
```

---

## Global state (`context/app-data.tsx`)

All interactive features read from **`useAppData()`**:

- **`hydrated`** — `false` until AsyncStorage has been read; screens should avoid flashing wrong UI until `true`.
- **`session` / `isLoggedIn`** — demo session (`accountId`, `email`) or `null`.
- **`profile`** — current user’s `ProfileUser` + `ProfileStats` (guest profile when logged out).
- **`feed`** — **`publishedPosts` first**, then **`mockActivities`** (merged list for the home feed).
- **`userActivities`** — current account’s activities (published + account seed data), avatar/name synced from profile.
- **`likes` / `comments`** — keyed by activity id; persisted.
- **`notifications`** — seeded list + read/unread from storage.
- **`login` / `logout`**, **`updateProfile`**, **`updateStats`**
- **`toggleLike`**, **`addComment`** (commenting requires login)
- **`publishActivity`** — builds a `FeedActivity` with **`recordedAt: Date.now()`**, prepends to feed + user grid, persists under `@ajree/posts-{accountId}`, updates stats.

**Storage keys** (prefix `@ajree/`): `profile`, `session`, `likes`, `comments`, `notif-read`, and per-account `posts-{accountId}`.

---

## Demo authentication

Defined in **`constants/auth-accounts.ts`**:

- Accounts have **`id`** (`alex` | `jordan`), **email**, **password**, **profile**, **userActivities**.
- **`findAccountByCredentials`** validates login; there is **no real email verification** or OAuth.

Adding a new demo account means extending **`AccountId`**, **`AUTH_ACCOUNTS`**, and any UI that lists accounts.

---

## Navigation conventions

### Profile is unified on the **Profile tab**

All profile taps should use **`navigateToUserProfile`** from **`lib/profile-navigation.ts`**:

- **Same user (logged in)** → `router.navigate('/(tabs)/profile')` (focuses the Profile tab like the tab bar).
- **Another user** → `router.navigate({ pathname: '/(tabs)/profile', params: { username } })`.

Use **`router.navigate`** (not `push`) so the tab navigator switches to Profile correctly from Home and other tabs.

**`app/(tabs)/profile.tsx`** reads **`useLocalSearchParams()`** for `username`:

- No param (or param matches current user) → **own profile** or **login** if guest.
- Param present and different user (or guest viewing someone) → **`OtherUserProfile`** (uses **`ProfileHeader`** in `mode="public"` where applicable).

**`app/user/[username].tsx`** only **redirects** to `/(tabs)/profile` with the same `username` so old links still work.

### Home: scroll to leaderboard (deep link)

- **`router.navigate({ pathname: '/(tabs)', params: { focus: 'leaderboard' } })`** switches to the tab stack and passes **`focus`**.
- **`app/(tabs)/index.tsx`** reads **`focus`** with **`useLocalSearchParams`** and **`useGlobalSearchParams`**, measures the leaderboard section with **`onLayout`**, **`scrollTo`**s into view, then **`router.setParams({ focus: undefined })`** to clear.

Used by the **Profile** “Top X%” pill and aligns with the **Leaderboard** quick action (same scroll target).

### Other routes

- **`/activity/[id]`** — activity detail; uses `navigateToUserProfile` on avatar / @handle.
- **`/follow-list`** — use **`router.push({ pathname: '/follow-list', params: { type: 'followers' } })`** (or `following`); normalize `type` if it arrives as a string array from the URL.
- **Modals** — `edit-profile`, `settings`, `notifications` (see root `_layout.tsx`).

---

## Leaderboard & challenges

**Monthly leaderboard (Home)** — **`app/(tabs)/index.tsx`** embeds **`MonthlyLeaderboard`**: sums each runner’s **`activity.distance`** per **calendar month** using **`recordedAt`** on **`FeedActivity`** (or `post-{timestamp}` from id for older publishes).

- **Leaderboard** quick action on Home scrolls to that section (stores layout offset via **`onLayout`** on the leaderboard wrapper).
- **Profile** “Top X%” pill uses **`/(tabs)`** + **`focus=leaderboard`** (same flow as in **Navigation conventions → Home: scroll to leaderboard**).

**Challenges only** — **`app/(tabs)/challenges.tsx`** lists **`mockChallenges`** with **`ChallengeCard`** (no leaderboard).

**`lib/leaderboard.ts`**

- **`mergeLeaderboardActivities(feed, userActivities)`** — dedupes by activity id; merges **feed**, current **`userActivities`**, and all **`AUTH_ACCOUNTS`** seed activities so everyone appears in the board.
- **`buildMonthlyKmLeaderboard(activities, year, month)`** — ranked rows with km totals.
- **`rankToTopPercent`**, **`findMonthlyRankBadge`** — percentile for “Top X%” badges (used on Profile).

---

## Home screen (`app/(tabs)/index.tsx`)

- Branded header (logo mark, tagline from **`pickHeaderTagline()`**), notifications in a circular control.
- **`HomeHero`** — greeting copy from **`getHomeHeroCopy`**, optional three stat tiles (runs, km, followers), decorative blobs, guest hint.
- Horizontal **pulse tips** from **`pickPulseTips()`** (`lib/home-copy.ts`).
- Quick actions: **Log a run** → Post tab; **Leaderboard** → scroll to monthly leaderboard on the same screen.
- **Monthly leaderboard** card (month switcher + ranked list), then feed section.
- Feed: **`getFeedModeLabel`** for Discover vs Your crew, activity count line, segment control, **`ActivityCard`** list (cards are inset with rounded borders and shadow).

---

## Feature map (what exists)

| Area | Behavior |
|------|----------|
| **Home** | Feed from context, pull-to-refresh, notifications, pulse tips, **monthly km leaderboard**, quick actions (Log run / scroll to leaderboard), Discover / Your crew |
| **Explore** | Search UI shell + sample content from **`mockActivities`** (`app/(tabs)/explore.tsx`) |
| **Post** | Composer → **`publishActivity`** (sets **`recordedAt`**) → navigates to new activity |
| **Activity detail** | Map/route image, like, comments, profile navigation |
| **Profile (tab)** | **`ProfileHeader`** (owner/public), stats panel (followers, following, routes, total km, maps with preview), **`leaderboardBadge`** when ranked; grid; **`OtherUserProfile`** for others |
| **Challenges tab** | Community challenges only (`mockChallenges` / **`ChallengeCard`**) |
| **Follow list** | Rows use **`navigateToUserProfile`** |
| **Edit profile / Settings** | Updates profile via context when logged in |

---

## Types and data shapes

Core types live in **`constants/run-data.ts`** (`FeedActivity`, `ProfileUser`, `ProfileStats`, etc.). Published posts reuse the same **`FeedActivity`** shape.

- **`FeedActivity.recordedAt`** (optional, epoch ms) — used for **monthly leaderboard** aggregation; new publishes set it in **`publishActivity`**. Seed data in **`run-data.ts`** / **`auth-accounts.ts`** includes **`recordedAt`** for demos.

---

## Design principles for future work

1. **Prefer extending `AppDataProvider`** over scattering new global state, unless you introduce a real API layer.
2. **Use `navigateToUserProfile`** for any “open this runner’s profile” action — keeps one Profile UX.
3. **Respect `hydrated`** before assuming login or stored data.
4. **Match existing patterns**: `StyleSheet`, themed colors, file placement under `components/run` or `components/profile`.
5. **Keep this guide in sync** when you add routes, move the leaderboard, or change global state contracts.
6. **Real backend** (recommended path): replace demo login with Supabase (or similar), sync feed/posts server-side, keep AsyncStorage as cache or remove gradually.

---

## Known limitations

- Auth is **demo-only**; passwords and accounts are in source.
- Feed “other users” are mostly **mock data** + **published posts** from signed-in users.
- Leaderboard is **client-side only**; totals derive from merged local/demo activities.
- **Supabase** is not wired; adding it requires env config, client init, and replacing persistence calls deliberately.

---

## Quick reference: files to touch for common tasks

| Task | Start here |
|------|------------|
| New feed behavior | `context/app-data.tsx`, `app/(tabs)/index.tsx` |
| Home copy / tips / feed labels | `lib/home-copy.ts`, `components/run/home-hero.tsx` |
| Home leaderboard / `focus` scroll | `app/(tabs)/index.tsx`, `components/run/monthly-leaderboard.tsx` |
| New post fields | `PublishActivityInput`, `post.tsx`, `publishActivity` |
| New demo user | `constants/auth-accounts.ts`, possibly `run-data.ts` |
| Profile routing | `lib/profile-navigation.ts`, `app/(tabs)/profile.tsx` |
| Profile km display | `lib/profile-format.ts`, `components/run/profile-header.tsx` |
| Leaderboard math / merge | `lib/leaderboard.ts` |
| Challenges only | `app/(tabs)/challenges.tsx` |
| Explore tab | `app/(tabs)/explore.tsx` |
| Public bios for handles | `constants/public-users.ts` |
| Theme / colors | `constants/theme.ts`, `hooks/use-theme-color.ts` |
| **This guide** | `AGENT_AND_DEVELOPER_GUIDE.md` |

---

*Last updated March 2026: leaderboard on **Home** (`index.tsx`); **Challenges** tab is challenges-only; Profile “Top %” → `/(tabs)` + `focus=leaderboard`; `recordedAt` on activities; follow-list params; Explore tab documented.*
