# CleanSpot — Public Toilet & Water ATM Locator

A full-stack web app for finding nearby public toilets and water ATMs
in **Kanniyakumari district, Tamil Nadu**, with crowd-sourced
cleanliness ratings, real-time status, water availability, and a
trust-scoring system.

Built for a college paper presentation competition — the code
prioritizes **clean, explainable, well-commented logic** over polish.

---

## Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite                  |
| Styling      | Tailwind CSS (custom color palette)           |
| Map          | Leaflet + OpenStreetMap tiles                 |
| Backend      | Supabase (Postgres + REST API + Row Security) |
| State        | React hooks + localStorage caching            |

No router library — the app has 3 pages switched via simple state
(`src/App.tsx`), keeping the routing trivial and easy to explain.

---

## Trust Score Formula

The trust score is the core differentiator. It's a **0–100** number
per location, computed in `src/lib/trustScore.ts`:

```
trustScore = (recencyWeightedAvgRating / 5) * 70
           + min(1, reviewCount / 10) * 30
```

**Part A — Quality (max 70 points):**
The average star rating, but recency-weighted. Each rating's weight
decays **linearly** from 1.0 (just submitted) to a **floor of 0.2** at
90 days old, then stays at 0.2. This means:
- A 5-star review from yesterday counts nearly fully.
- A 5-star review from 6 months ago counts at 20% weight.
- The floor ensures old ratings still carry *some* signal but never
  dominate over fresh reports.

```
weight(ageDays) =
  1.0                          if ageDays <= 0
  1.0 - (ageDays/90) * 0.8     if 0 < ageDays < 90   (linear: 1.0 → 0.2)
  0.2                          if ageDays >= 90
```

**Part B — Volume / confidence (max 30 points):**
A single 5-star review shouldn't produce a score of 100. This term
ramps up linearly with review count, **capping at 10 reviews**:
- 1 review → 3 points
- 5 reviews → 15 points
- 10+ reviews → 30 points (max)

**Special case:** If a location has **zero ratings**, the score is
`null` and the UI shows an **"Unverified / New"** badge with a
"Be the first to review!" prompt (see `TrustScoreBar.tsx`).

---

## Status Auto-Expiry

A status report (working/locked/maintenance + water availability) is
"fresh" for **6 hours** after submission. After that, the UI shows
**"Unverified"** instead of potentially stale data.

```typescript
// src/lib/trustScore.ts
const STATUS_EXPIRY_HOURS = 6;

function isStatusExpired(createdAt: string, now = new Date()): boolean {
  const ageHours = (now - new Date(createdAt)) / (1000 * 60 * 60);
  return ageHours >= STATUS_EXPIRY_HOURS;
}
```

This logic runs in `enrichLocation()` when building the data the UI
renders, so it's applied consistently everywhere.

---

## Feature → Code Map

| #  | Feature                              | Where it lives                                                                 |
| -- | ----------------------------------- | ------------------------------------------------------------------------------ |
| 1  | Live Map View (GPS, Haversine sort) | `src/components/MapView.tsx`, `src/hooks/useGeolocation.ts`, `src/lib/geo.ts`  |
| 2  | Crowd Ratings + GPS Verification    | `src/components/RatingModal.tsx`, `src/lib/geo.ts` (RATING_RADIUS_M = 100)     |
| 3  | Real-time Status + Water + Expiry   | `src/components/StatusModal.tsx`, `src/lib/trustScore.ts` (isStatusExpired)    |
| 4  | Smart Filters (type + tags)         | `src/components/Filters.tsx`                                                   |
| 5  | Trust Score                         | `src/lib/trustScore.ts` (computeTrustScore), `src/components/TrustScoreBar.tsx`|
| 6  | Add Location (GPS auto-fill)        | `src/components/AddLocationModal.tsx`, `src/lib/data.ts` (addLocation)         |
| 7  | Cold-Start Gamification (Pioneer)   | `src/components/RatingModal.tsx`, `src/lib/session.ts` (awardBadge)            |
| 7  | Top Contributors Leaderboard        | `src/pages/LeaderboardPage.tsx`, `src/lib/session.ts` (getTopContributors)     |
| 8  | Municipality Dashboard              | `src/pages/DashboardPage.tsx`                                                  |
| 9  | Safety SOS Button                   | `src/components/SosModal.tsx`                                                  |
| 10 | Offline-First Caching               | `src/lib/cache.ts`, `src/hooks/useLocations.ts`                                |

---

## Database Schema

Four tables in Supabase (Postgres), created via a single migration:

| Table            | Purpose                                              |
| ---------------- | --------------------------------------------------- |
| `locations`      | Toilets & water ATMs (name, type, lat/lng, tags)    |
| `ratings`        | 1–5 star ratings with optional comment/photo/GPS     |
| `status_reports` | working/locked/maintenance + water availability      |
| `app_users`      | Anonymous session-based users (review_count, badges) |

All tables have **Row Level Security** enabled with `anon, authenticated`
policies (the app has no login — data is intentionally public/shared).

### Seed Data

6 starting reference points in Kanniyakumari district. These are
**landmark-area approximations, not officially verified** — the UI
labels them as "starting reference points, refined by community."

---

## GPS Verification (Rating Submission)

Before allowing a rating, the app checks the user's current GPS
against the location's coordinates using the **Haversine formula**
(`src/lib/geo.ts`):

```typescript
const RATING_RADIUS_M = 100; // ~100 meters

// In RatingModal.tsx:
const distance = haversineDistance(userLat, userLng, loc.latitude, loc.longitude);
const withinRange = distance <= RATING_RADIUS_M;
```

If the user is beyond 100 m (or GPS is unavailable), the submit button
is disabled and a clear message explains why. A **"Simulate nearby"**
toggle bypasses the check for demo/judging purposes — this is clearly
labelled and is NOT a production feature.

---

## Offline-First Caching

After every successful fetch, enriched locations are saved to
`localStorage` keyed by the active filter combination. If a later fetch
fails (offline/network error):

1. Try the cache for the current filter → show cached data + a
   "Showing cached data (offline)" banner.
2. If no cache exists → show a "No data available — connect to
   internet" empty state (never a blank screen).

See `src/lib/cache.ts` and `src/hooks/useLocations.ts`.

---

## Color Palette

| Color        | Hex       | Usage                          |
| ------------ | --------- | ------------------------------ |
| Teal         | `#028090` | Primary                        |
| Seafoam      | `#00A896` | Accent                         |
| Navy         | `#0B2E33` | Headers, text                  |
| Off-white    | `#F4FAF9` | Background                     |
| Mint green   | `#02C39A` | CTAs / highlights              |
| Coral/red    | `#B0453E` | Alerts, locked status          |
| Amber        | `#F0A93C` | Stars, maintenance, warnings   |

Defined in `tailwind.config.js`.

---

## Running the App

```bash
npm install
npm run dev
```

The Supabase credentials are pre-configured in `.env`. The database
schema and seed data are applied automatically via the Supabase
migration tool during setup.
