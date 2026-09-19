import type { Rating, LocationWithDetails, StatusReport } from './types';
import { haversineDistance } from './geo';

// ---------------------------------------------------------------------------
// Trust Score — the heart of CleanSpot's credibility system.
//
// Formula (per location, 0–100):
//
//   trustScore = (recencyWeightedAvgRating / 5) * 70
//              + min(1, reviewCount / 10) * 30
//
// Part A (70 points) — quality:
//   The average star rating, recency-weighted so that recent ratings
//   count more than old ones.  Each rating's weight decays *linearly*
//   from 1.0 (just now) down to a floor of 0.2 at 90 days old, then
//   stays at 0.2 forever.  The floor means very old ratings still carry
//   *some* signal (a toilet that was dirty a year ago probably still is)
//   but they don't dominate the score over fresh reports.
//
// Part B (30 points) — volume / confidence:
//   A location with a single 5-star review shouldn't score 100.
//   This term ramps up linearly with review count, capping at 10
//   reviews.  So 1 review → 3 points, 5 reviews → 15, 10+ → 30.
//
// Special case: if a location has ZERO ratings we return null and the
// UI shows an "Unverified / New" badge instead of a number.
// ---------------------------------------------------------------------------

/** Ratings older than this many days start losing weight (linear decay). */
const DECAY_THRESHOLD_DAYS = 90;
/** The minimum weight a very old rating retains (never goes to zero). */
const DECAY_FLOOR = 0.2;

/**
 * Compute the linear recency weight for a single rating.
 *
 *   ageDays ≤ 0            → 1.0
 *   0 < ageDays < 90       → linearly decays from 1.0 → 0.2
 *   ageDays ≥ 90           → 0.2 (floor)
 *
 * So at exactly 90 days the weight is 0.2, not the 1.0 it started at.
 */
export function recencyWeight(ratingCreatedAt: string, now: Date = new Date()): number {
  const ageMs = now.getTime() - new Date(ratingCreatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= 0) return 1.0;
  if (ageDays >= DECAY_THRESHOLD_DAYS) return DECAY_FLOOR;

  // Linear interpolation: weight goes 1.0 → 0.2 as age goes 0 → 90
  const fraction = ageDays / DECAY_THRESHOLD_DAYS;
  return 1.0 - fraction * (1.0 - DECAY_FLOOR);
}

/**
 * Compute the recency-weighted average rating for a set of ratings.
 * Returns null when there are no ratings.
 */
function weightedAverageRating(ratings: Rating[], now: Date = new Date()): number | null {
  if (ratings.length === 0) return null;

  let weightSum = 0;
  let weightedStarSum = 0;

  for (const r of ratings) {
    const w = recencyWeight(r.created_at, now);
    weightSum += w;
    weightedStarSum += r.stars * w;
  }

  if (weightSum === 0) return null;
  return weightedStarSum / weightSum;
}

/**
 * Compute the 0–100 trust score for a location.
 * Returns null when the location has zero ratings (→ "Unverified / New").
 *
 * This is the single most important function in the app — it's what
 * separates CleanSpot from a plain pin map.
 */
export function computeTrustScore(ratings: Rating[], now: Date = new Date()): number | null {
  if (ratings.length === 0) return null;

  const weightedAvg = weightedAverageRating(ratings, now);
  if (weightedAvg === null) return null;

  // Part A: quality (max 70 points)
  const qualityScore = (weightedAvg / 5) * 70;

  // Part B: volume / confidence (max 30 points, caps at 10 reviews)
  const volumeScore = Math.min(1, ratings.length / 10) * 30;

  return Math.round(qualityScore + volumeScore);
}

/** Plain (non-weighted) average, used for the star display on cards. */
export function plainAverageRating(ratings: Rating[]): number | null {
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
}

// ---------------------------------------------------------------------------
// Status auto-expiry — a status report is "fresh" for 6 hours, then we
// show "Unverified" instead of potentially stale data.
// ---------------------------------------------------------------------------

export const STATUS_EXPIRY_HOURS = 6;

/** Has the given status report expired (older than STATUS_EXPIRY_HOURS)? */
export function isStatusExpired(
  reportCreatedAt: string,
  now: Date = new Date(),
): boolean {
  const ageMs = now.getTime() - new Date(reportCreatedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours >= STATUS_EXPIRY_HOURS;
}

// ---------------------------------------------------------------------------
// Enrichment — combine raw DB rows into the LocationWithDetails the UI uses.
// ---------------------------------------------------------------------------

/**
 * Attach computed fields (average rating, trust score, latest fresh
 * status, distance) to a raw Location + its ratings + status reports.
 *
 * All trust-score and expiry logic lives HERE so it's easy to find and
 * walk through during a viva.
 */
export function enrichLocation(
  location: { id: string; name: string; type: string; latitude: number; longitude: number; tags: string[]; created_by_session: string | null; created_at: string },
  ratings: Rating[],
  statusReports: StatusReport[],
  userLat: number | null,
  userLng: number | null,
  now: Date = new Date(),
): LocationWithDetails {
  // Sort status reports newest-first; the first one is the "latest".
  const sortedReports = [...statusReports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const latestReport = sortedReports[0] ?? null;
  const expired = latestReport ? isStatusExpired(latestReport.created_at, now) : true;

  // Distance from user (Haversine). null when we don't know the user's position.
  let distance: number | null = null;
  if (userLat !== null && userLng !== null) {
    distance = haversineDistance(userLat, userLng, location.latitude, location.longitude);
  }

  return {
    ...location,
    ratings,
    latestStatus: latestReport,
    statusExpired: expired,
    averageRating: plainAverageRating(ratings),
    reviewCount: ratings.length,
    trustScore: computeTrustScore(ratings, now),
    distance,
  };
}
