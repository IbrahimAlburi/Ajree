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
15. [Sign-in routing](#sign-in-routing-libauth-navigationts)  
16. [Log screen, GPS, and route builder](#log-screen-gps-and-route-builder)  

*(Anchors follow common Markdown slug rules; if a link fails in your viewer, scroll by section title.)*

---

## What this app is

**Ajree** (package name `ajree`) is an **Expo / React Native** running-social prototype: **home** feed (with **collapsible monthly km leaderboard**), **Log** tab (**activity composer** — distance, time, **GPS recording**, **Strava-style route builder** full-screen modal, route preview, reflection), **activity** detail (map, stats, **kudos**, **discussion**), **profile** with **Stride circle** stats (**Supporters** / **Crew**), **centralized sign-in** at **`/login`** (see **`lib/auth-navigation.ts`**), **notifications**, and a **Challenges** tab (join/leave with local persistence). **Demo users** keep everything in **AsyncStorage**. With **Firebase** configured (`.env`), **Auth + Firestore** store **profiles** and (when signed in) **sync each user’s logged activities** to **`users/{uid}/activities/{activityId}`**, merged with local posts on login and on pull-to-refresh; **demo accounts** still work when Firebase is off.

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
| Location / maps | **expo-location** (foreground GPS for live tracks); **react-native-maps** (native map + polylines); **react-native-svg** (web route preview / schematic taps) |
| Gestures / animation | **react-native-gesture-handler**, **react-native-reanimated** |
| Lint / types | **TypeScript ~5.9**, **ESLint** via `expo lint` |
| Cloud (optional) | **Firebase** — `firebase/app`, `firebase/auth`, `firebase/firestore` (`lib/firebase.ts`, `lib/firestore-user.ts`, `lib/firestore-activities.ts`); configure via **`EXPO_PUBLIC_*`** in `.env` (see `.env.example`). |

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
  _layout.tsx              # Root Stack: tabs + modals/screens + login; follow-list: headerShown false
  login.tsx                # Dedicated sign-in / register (Firebase or demo)
  (tabs)/
    _layout.tsx            # Tabs: Home, Explore, Log (→ post.tsx), Challenges, Profile
    index.tsx              # Home: hero, pulse tips, quick actions, MONTHLY LEADERBOARD, feed
    challenges.tsx         # Challenges only (mockChallenges + ChallengeCard)
    explore.tsx            # Explore / search shell
    post.tsx, profile.tsx  # Log activity composer (tab title: Log), Profile tab
  activity/[id].tsx        # Activity detail
  edit-profile.tsx         # Modal
  settings.tsx             # Modal
  notifications.tsx        # Modal
  follow-list.tsx          # Stride circle lists; query `type`: `supporters` | `crew` (legacy: followers | following); help “?” modal
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
  post-presets.ts          # Log-activity map thumbnails + distance presets
  route-brand.ts           # Strava-style route accent (`STRAVA_ROUTE_ORANGE`) for polylines / CTAs
hooks/
  use-track-recording.ts   # Foreground GPS watch → `RouteCoord[]` for Log screen
lib/
  auth-navigation.ts       # `navigateToLogin` / `AUTH_LOGIN_HREF` — single entry for `/login`
  firebase.ts              # Firebase app + Auth + Firestore init (requires .env)
  firestore-user.ts        # `users/{uid}` profile read/write + default new-user seed
  firestore-activities.ts  # `users/{uid}/activities/{id}` read/write + merge with AsyncStorage
  route-geo.ts             # Haversine distance, region, thin coords for storage
  elevation.ts             # Elevation gain estimate (Open-Elevation API) for route builder
  profile-navigation.ts    # Navigate to Profile tab (+ optional username); uses router.navigate
  profile-format.ts        # formatProfileKm for profile stats display
  leaderboard.ts           # Monthly km board, mergeLeaderboardActivities, rank / percentile helpers
  maps.ts, run-math.ts, home-copy.ts   # home-copy: taglines, hero copy, pulse tips, feed mode labels
firestore.rules            # User profile + `users/{uid}/activities/*` — deploy in Console or `firebase deploy`
app.json                   # Plugins: `expo-router`, `expo-location` (permission copy), `expo-splash-screen`
AGENT_AND_DEVELOPER_GUIDE.md   # This file — update when behavior or routes change meaningfully
```

---

## Global state (`context/app-data.tsx`)

All interactive features read from **`useAppData()`**:

- **`hydrated`** — `false` until AsyncStorage has been read; screens should avoid flashing wrong UI until `true`.
- **`session` / `isLoggedIn`** — **`kind: 'demo'`** (`accountId`, `email`) or **`kind: 'firebase'`** (`uid`, `email`), or `null`.
- **`useFirebaseAuth`** — `true` when Firebase env is valid and Auth initializes (email/password + Firestore profile).
- **`profile`** — current user’s `ProfileUser` + `ProfileStats` (guest profile when logged out).
- **`feed`** — **`publishedPosts` first**, then **`mockActivities`** (merged list for the home feed).
- **`userActivities`** — current account’s activities (published + account seed data), avatar/name synced from profile.
- **`likes` / `comments`** — keyed by activity id; persisted.
- **`notifications`** — seeded list + read/unread from storage.
- **`joinedChallengeIds` / `toggleChallengeJoin`** — community challenge membership (local persistence); **`challengeJoinsReady`** gates the CTA until storage load finishes.
- **`login` / `register` / `logout`**, **`updateProfile`**, **`updateStats`** — demo or Firebase; **`onAuthStateChanged`** hydrates Firebase sessions.
- **`toggleLike`** (feed/activity **UI** shows **Kudos**) — guests are sent to **`/login`** before kudos on **feed / activity**; **`addComment`** still requires a session in context.
- **`publishActivity`** — builds a `FeedActivity` with **`recordedAt: Date.now()`**, optional **`activity.routeCoords`** (GPS or **route builder** polyline, thinned for storage), prepends to feed + user grid, persists under **`@ajree/posts-{storageId}`** (demo id or Firebase `uid`). When **`session.kind === 'firebase'`**, also writes the activity doc to **`users/{uid}/activities/{activityId}`** (`lib/firestore-activities.ts`). Profile/stats updates sync to Firestore when Firebase is active.
- **`refreshFeed`** — after a short delay, Firebase users **re-fetch** activities from Firestore and merge with local **`@ajree/posts-{uid}`** (remote wins on id conflicts).

**Storage keys** (prefix `@ajree/`): `profile`, `session`, `likes`, `comments`, `notif-read`, **`challenge-joins-v1`** (map of account id → joined challenge ids), and per-user **`posts-{demoIdOrUid}`**.

---

## Demo authentication

Used when **Firebase is not configured** or Auth fails to initialize (`useFirebaseAuth === false`).

Defined in **`constants/auth-accounts.ts`**:

- Accounts have **`id`** (`alex` | `jordan`), **email**, **password**, **profile**, **userActivities**.
- **`findAccountByCredentials`** validates login; there is **no real email verification** or OAuth.

Adding a new demo account means extending **`AccountId`**, **`AUTH_ACCOUNTS`**, and any UI that lists accounts.

### Firebase (optional)

With **`.env`** set and **Email/Password** enabled in the Firebase Console, **`login`** / **`register`** use **`signInWithEmailAndPassword`** / **`createUserWithEmailAndPassword`**. Profiles live in Firestore **`users/{uid}`** (`lib/firestore-user.ts`). **Logged activities** for Firebase users are stored under **`users/{uid}/activities/{activityId}`** (`lib/firestore-activities.ts`); rules in **`firestore.rules`** allow each user read/write only on their own profile doc and activity subdocs. **`app/login.tsx`** hosts **`LoginSection`**; successful auth replaces to **`/(tabs)/profile`**.

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

- **`/login`** — dedicated sign-in / register screen. Do **not** scatter `router.push('/login')`; use **`navigateToLogin`** from **`lib/auth-navigation.ts`** (supports **`replace: true`** when replacing the current screen). Entry points include: **Profile** (guest CTA), **Home** guest hero, **Log** tab (guest banner + share guard), **Activity detail** (kudos/comment when logged out), **`ActivityCard`** kudos when logged out, **Settings** (guest sign-in card), **`edit-profile`** redirects with **`replace`** if opened without a session.
- **`/activity/[id]`** — activity detail; uses **`navigateToUserProfile`** on avatar / @handle.
- **`/follow-list`** — **Stride circle** lists (Supporters vs Crew). Prefer **`params: { type: 'supporters' }`** or **`{ type: 'crew' }`**; legacy **`followers`** / **`following`** still map correctly. Stack **`headerShown: false`** (custom header). In-app **?** opens a help modal. Normalize `type` if it arrives as a string array from the URL.
- **Modals** — `edit-profile`, `settings`, `notifications` (see root `_layout.tsx`).

---

## Sign-in routing (`lib/auth-navigation.ts`)

- **`AUTH_LOGIN_HREF`** — `'/login'` (single source of truth for the route string).
- **`navigateToLogin(router, { replace?: boolean })`** — **`push`** by default; use **`replace: true`** for screens that should not remain on the stack (e.g. **`edit-profile`** when unauthenticated).

Successful sign-in from **`app/login.tsx`** uses **`router.replace('/(tabs)/profile')`**; if already logged in, **`login`** redirects to Profile.

---

## Leaderboard & challenges

**Monthly leaderboard (Home)** — **`app/(tabs)/index.tsx`** embeds **`MonthlyLeaderboard`**: sums each runner’s **`activity.distance`** per **calendar month** using **`recordedAt`** on **`FeedActivity`** (or `post-{timestamp}` from id for older publishes).

- **Leaderboard** quick action on Home scrolls to that section (stores layout offset via **`onLayout`** on the leaderboard wrapper).
- **Profile** “Top X%” pill uses **`/(tabs)`** + **`focus=leaderboard`** (same flow as in **Navigation conventions → Home: scroll to leaderboard**).

**Challenges only** — **`app/(tabs)/challenges.tsx`** lists **`mockChallenges`** with **`ChallengeCard`**. Join / leave is **`toggleChallengeJoin`** in **`context/app-data.tsx`**; joined ids persist under **`@ajree/challenge-joins-v1`** keyed by account id or **`_guest`**. The load effect depends on a **stable `challengeAccountKey` string** (not the `session` object) so joins stay interactive when auth re-renders.

**`lib/leaderboard.ts`**

- **`mergeLeaderboardActivities(feed, userActivities)`** — dedupes by activity id; merges **feed**, current **`userActivities`**, and all **`AUTH_ACCOUNTS`** seed activities so everyone appears in the board.
- **`buildMonthlyKmLeaderboard(activities, year, month)`** — ranked rows with km totals.
- **`rankToTopPercent`**, **`findMonthlyRankBadge`** — percentile for “Top X%” badges (used on Profile).

---

## Home screen (`app/(tabs)/index.tsx`)

- Branded header (logo mark, tagline from **`pickHeaderTagline()`**), notifications in a circular control.
- **`HomeHero`** — greeting copy from **`getHomeHeroCopy`**, optional three stat tiles (runs, km, **Supporters**), decorative blobs; **guest** hint opens **`/login`** via **`navigateToLogin`** (**`onGuestSignInPress`**).
- Horizontal **pulse tips** from **`pickPulseTips()`** (`lib/home-copy.ts`).
- Quick actions: **Log activity** → **Log** tab (`(tabs)/post`); **Leaderboard** → scrolls to the leaderboard **section** (same screen; section is a **collapsible disclosure** — closed by default, expands to show **`MonthlyLeaderboard`**).
- **Monthly leaderboard** — **collapsed** to a single row until expanded; month switcher + ranked list appear when open.
- Feed: **`getFeedModeLabel`** for Discover vs Your crew, activity count line, segment control, **`ActivityCard`** list (cards are inset with rounded borders and shadow).

---

## Log screen, GPS, and route builder

**`app/(tabs)/post.tsx`** is the **Log** tab (title: Log).

- **GPS track (optional)** — **`useTrackRecording`** (`hooks/use-track-recording.ts`) uses **`expo-location`** foreground permission + **`watchPositionAsync`**; points append to **`RouteCoord[]`**. Start / Stop / Clear; **Use GPS distance** copies the track length into the distance field. **`publishActivity`** can attach **`routeCoords`** when there are 2+ points.
- **Route builder (Strava-style)** — **`StravaRouteBuilderModal`** (`components/run/strava-route-builder-modal.tsx`) opens full-screen: dark chrome, **Strava orange** (`constants/route-brand.ts`) polyline, **Done** / Close, bottom stats (**distance**, **elevation gain** via **`lib/elevation.ts`** + Open-Elevation API). **`RoutePlanner`** (`components/run/route-planner.tsx`) draws the map: native **`react-native-maps`** (tap to add waypoints, **muted** map style on iOS); web uses a **schematic tap grid** (no Maps API key).
- **Priority on publish** — If **planned** route has **2+** points, that path is saved on the activity; otherwise a **GPS** track with 2+ points is used; **`thinCoords`** in **`publishActivity`** caps stored points.
- **Display** — **`TrackMap`** (`components/run/track-map.tsx`) shows polylines on feed cards and activity detail; optional **`strokeColor`** (orange for built routes). **`app.json`** includes the **`expo-location`** plugin for permission strings on native builds.

---

## Feature map (what exists)

| Area | Behavior |
|------|----------|
| **Home** | Feed from context, pull-to-refresh, notifications, pulse tips, **collapsible monthly km leaderboard**, quick actions (**Log activity** / leaderboard), guest hero → **`/login`**, Discover / Your crew |
| **Explore** | Search UI shell + sample content from **`mockActivities`** (`app/(tabs)/explore.tsx`) |
| **Log** (`post.tsx`) | Tab title **Log**; guests → **`navigateToLogin`**; **GPS** recording + **route builder** modal; **`publishActivity`** (sets **`recordedAt`**, optional **`routeCoords`**) → new activity on feed + profile; Firebase users also sync activity to Firestore |
| **Activity detail** | Map / **TrackMap** polyline when **`routeCoords`** exist, **kudos** / **Discussion** (guests → **`/login`** for kudos), **`navigateToUserProfile`** on avatar / @handle |
| **Sign-in** | **`/login`** + **`lib/auth-navigation.ts`**; **`LoginSection`**: Firebase + Firestore when configured; else demo |
| **Profile (tab)** | Guest → CTA via **`navigateToLogin`**; logged in → **`ProfileHeader`** (**Supporters** / **Crew**, **Join crew** on others), **`leaderboardBadge`**, grid; **`OtherUserProfile`** for others |
| **Settings** | Guest sign-in card → **`/login`**; logged in → account + logout |
| **Challenges tab** | Community challenges (`mockChallenges` / **`ChallengeCard`**); join state in **`AppDataProvider`** + AsyncStorage |
| **Follow list** | Rows use **`navigateToUserProfile`** |
| **Edit profile** | Logged in only; unauthenticated open → **`replace`** to **`/login`** |

---

## Types and data shapes

Core types live in **`constants/run-data.ts`** (`FeedActivity`, `ProfileUser`, `ProfileStats`, **`Challenge`** with **`id`**, **`RouteCoord`**, etc.). Logged activities (composer output) reuse the same **`FeedActivity`** shape.

- **`FeedActivity.recordedAt`** (optional, epoch ms) — used for **monthly leaderboard** aggregation; new publishes set it in **`publishActivity`**. Seed data in **`run-data.ts`** / **`auth-accounts.ts`** includes **`recordedAt`** for demos.
- **`activity.routeCoords`** (optional, **`RouteCoord[]`**) — lat/lng path from **GPS** or the **route builder**; shown with **`TrackMap`**; serialized to Firestore when Firebase sync is on.

---

## Design principles for future work

1. **Prefer extending `AppDataProvider`** over scattering new global state, unless you introduce a real API layer.
2. **Use `navigateToUserProfile`** for any “open this runner’s profile” action — keeps one Profile UX.
3. **Respect `hydrated`** before assuming login or stored data.
4. **Match existing patterns**: `StyleSheet`, themed colors, file placement under `components/run` or `components/profile`.
5. **Keep this guide in sync** when you add routes, move the leaderboard, or change global state contracts.
6. **Server-backed feed** (future): broader **social** feed in Firestore or another API; today **per-user activities** already sync for Firebase accounts. Keep AsyncStorage as cache or migrate off gradually.
7. **Road-snapped routes** (future): Strava-style “follow roads” needs a **routing API** (e.g. OpenRouteService, Mapbox) — current builder uses **straight segments** between taps.

---

## Known limitations

- Without Firebase, auth is **demo-only**; demo passwords live in source.
- Feed “other users” are mostly **mock data** + **published posts** from signed-in users.
- Leaderboard is **client-side only**; totals derive from merged local/demo activities.
- Logged **activities** are **AsyncStorage**-backed per user id (`posts-{id}` key). With **Firebase**, each user’s activities also sync to **`users/{uid}/activities`** (not a global social feed).
- **Route builder** does **not** snap to roads; elevation uses a **public elevation API** (may fail on web / offline).
- **Kudos** on feed/activity **UI** require sign-in (guests are sent to **`/login`**); **`toggleLike`** powers kudos and does not duplicate-check session in context.

---

## Quick reference: files to touch for common tasks

| Task | Start here |
|------|------------|
| New feed behavior | `context/app-data.tsx`, `app/(tabs)/index.tsx` |
| Home copy / tips / feed labels | `lib/home-copy.ts`, `components/run/home-hero.tsx` |
| Home leaderboard / `focus` scroll | `app/(tabs)/index.tsx`, `components/run/monthly-leaderboard.tsx` |
| Log activity / composer fields | `PublishActivityInput`, `app/(tabs)/post.tsx`, `publishActivity`, `hooks/use-track-recording.ts` |
| GPS path / map preview | `components/run/track-map.tsx`, `lib/route-geo.ts` |
| Route builder UI | `components/run/strava-route-builder-modal.tsx`, `components/run/route-planner.tsx`, `constants/route-brand.ts`, `lib/elevation.ts` |
| Firebase activity sync | `lib/firestore-activities.ts`, `firestore.rules` |
| Challenges (UI + joins + mock ids) | `app/(tabs)/challenges.tsx`, `components/run/challenge-card.tsx`, `constants/run-data.ts` (`mockChallenges`), `context/app-data.tsx` (`challengeAccountKey`, `toggleChallengeJoin`) |
| Stride circle / lists | `app/follow-list.tsx`, `components/run/profile-header.tsx` |
| Feed cards / activity detail (kudos) | `components/run/activity-card.tsx`, `app/activity/[id].tsx` |
| New demo user | `constants/auth-accounts.ts`, possibly `run-data.ts` |
| Profile routing | `lib/profile-navigation.ts`, `app/(tabs)/profile.tsx` |
| Profile km display | `lib/profile-format.ts`, `components/run/profile-header.tsx` |
| Leaderboard math / merge | `lib/leaderboard.ts` |
| Explore tab | `app/(tabs)/explore.tsx` |
| Public bios for handles | `constants/public-users.ts` |
| Theme / colors | `constants/theme.ts`, `hooks/use-theme-color.ts` |
| Firebase / Firestore profile + activities | `lib/firebase.ts`, `lib/firestore-user.ts`, `lib/firestore-activities.ts`, `.env.example`, `firestore.rules` |
| Sign-in UI / deep links to auth | `lib/auth-navigation.ts`, `app/login.tsx`, `components/profile/login-section.tsx` |
| **This guide** | `AGENT_AND_DEVELOPER_GUIDE.md` |

---

*Last updated April 2026: **Firestore activity sync** (`users/{uid}/activities`, `lib/firestore-activities.ts`); **GPS** (`expo-location`, `use-track-recording`) + **Strava-style route builder** (full-screen modal, orange polylines, elevation estimate); **`routeCoords`** on **`FeedActivity`**; **`TrackMap`** / **`route-geo`**; **`expo-location`** plugin in **`app.json`**; prior: Stride circle, kudos/Discussion, challenge joins, **`lib/auth-navigation.ts`**, collapsible leaderboard, Firestore profiles when Firebase is on.*
