// ---------------------------------------------------------------------------
// Core domain types for CleanSpot
// ---------------------------------------------------------------------------

export type LocationType = 'toilet' | 'water_atm';

export type LocationTag =
  | 'women_friendly'
  | 'free'
  | 'paid'
  | 'wheelchair_accessible';

export type StatusValue = 'working' | 'locked' | 'maintenance';

export type WaterAvailability = 'true' | 'false' | 'unknown';

/** A public toilet or water ATM, as stored in the `locations` table. */
export interface Location {
  id: string;
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  tags: LocationTag[];
  created_by_session: string | null;
  created_at: string;
}

/** A crowd-sourced cleanliness rating, as stored in the `ratings` table. */
export interface Rating {
  id: string;
  location_id: string;
  stars: number;
  comment: string | null;
  photo_url: string | null;
  reviewer_lat: number | null;
  reviewer_lng: number | null;
  session_id: string;
  created_at: string;
}

/** A real-time status report, as stored in the `status_reports` table. */
export interface StatusReport {
  id: string;
  location_id: string;
  status: StatusValue;
  water_available: WaterAvailability;
  session_id: string;
  created_at: string;
}

/** A lightweight anonymous user, as stored in the `app_users` table. */
export interface AppUser {
  id: string;
  review_count: number;
  badges: string[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Derived / computed types — these are NOT database tables; they are
// computed in the frontend to keep all trust-score and expiry logic
// transparent and explainable (the user needs to walk through this in a viva).
// ---------------------------------------------------------------------------

/**
 * A Location enriched with all the computed data the UI needs:
 * - all its ratings and the latest (non-expired) status report
 * - computed trust score, average rating, review count
 * - distance from the user's current GPS position
 */
export interface LocationWithDetails extends Location {
  ratings: Rating[];
  latestStatus: StatusReport | null;
  /** True when the latest status report is older than 6 hours → "Unverified". */
  statusExpired: boolean;
  averageRating: number | null;
  reviewCount: number;
  /** 0–100 trust score, or null when the location has zero ratings. */
  trustScore: number | null;
  /** Distance in metres from the user, or null when user position unknown. */
  distance: number | null;
}
