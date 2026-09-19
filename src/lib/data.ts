import { supabase } from './supabase';
import type {
  Location,
  Rating,
  StatusReport,
  LocationWithDetails,
  LocationType,
  StatusValue,
  WaterAvailability,
} from './types';
import { enrichLocation } from './trustScore';

// ---------------------------------------------------------------------------
// Data access layer — all Supabase queries live here.
//
// fetchLocationsWithDetails() is the main query: it loads locations,
// their ratings, and their status reports, then calls enrichLocation()
// to compute trust scores, status expiry, and distance.
// ---------------------------------------------------------------------------

export interface FetchFilters {
  type: 'all' | LocationType;
  tags: string[];
}

export interface FetchOptions extends FetchFilters {
  userLat: number | null;
  userLng: number | null;
}

export interface FetchResult {
  locations: LocationWithDetails[];
  error: string | null;
}

/**
 * Fetch all locations (optionally filtered) with their ratings and
 * status reports, then enrich each one with computed fields.
 *
 * This function is the single source of truth for the "locations list"
   * the UI renders — all trust-score and status-expiry logic happens
   * inside enrichLocation().
 */
export async function fetchLocationsWithDetails(
  opts: FetchOptions,
): Promise<FetchResult> {
  const { type, tags, userLat, userLng } = opts;

  // --- 1. Query locations (with optional type filter) ---
  let locQuery = supabase.from('locations').select('*');
  if (type !== 'all') {
    locQuery = locQuery.eq('type', type);
  }
  const { data: locData, error: locError } = await locQuery;

  if (locError) {
    return { locations: [], error: locError.message };
  }

  const locations = (locData ?? []) as Location[];

  // --- 2. Tag filter (post-fetch, since tags is an array column) ---
  const filteredByTags = tags.length === 0
    ? locations
    : locations.filter((loc) => tags.every((t) => loc.tags.includes(t as never)));

  if (filteredByTags.length === 0) {
    return { locations: [], error: null };
  }

  // --- 3. Fetch all ratings and status reports for these locations ---
  const locIds = filteredByTags.map((l) => l.id);

  const [{ data: ratingsData, error: ratingsError }, { data: statusData, error: statusError }] =
    await Promise.all([
      supabase.from('ratings').select('*').in('location_id', locIds),
      supabase.from('status_reports').select('*').in('location_id', locIds),
    ]);

  if (ratingsError || statusError) {
    return {
      locations: [],
      error: ratingsError?.message ?? statusError?.message ?? 'Unknown error',
    };
  }

  const allRatings = (ratingsData ?? []) as Rating[];
  const allStatusReports = (statusData ?? []) as StatusReport[];

  // --- 4. Enrich each location ---
  const enriched = filteredByTags.map((loc) => {
    const locRatings = allRatings.filter((r) => r.location_id === loc.id);
    const locStatus = allStatusReports.filter((s) => s.location_id === loc.id);
    return enrichLocation(loc, locRatings, locStatus, userLat, userLng);
  });

  // --- 5. Sort nearest-first (Haversine distance) ---
  // Locations with unknown distance (no user GPS) keep original order.
  enriched.sort((a, b) => {
    if (a.distance === null && b.distance === null) return 0;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return { locations: enriched, error: null };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Add a new location. Returns the created location or throws. */
export async function addLocation(params: {
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  tags: string[];
  sessionId: string;
}): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: params.name,
      type: params.type,
      latitude: params.latitude,
      longitude: params.longitude,
      tags: params.tags,
      created_by_session: params.sessionId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Location;
}

/** Submit a rating for a location. */
export async function submitRating(params: {
  locationId: string;
  stars: number;
  comment?: string;
  photoUrl?: string;
  reviewerLat?: number;
  reviewerLng?: number;
  sessionId: string;
}): Promise<Rating> {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      location_id: params.locationId,
      stars: params.stars,
      comment: params.comment ?? null,
      photo_url: params.photoUrl ?? null,
      reviewer_lat: params.reviewerLat ?? null,
      reviewer_lng: params.reviewerLng ?? null,
      session_id: params.sessionId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Rating;
}

/** Submit a status report for a location. */
export async function submitStatusReport(params: {
  locationId: string;
  status: StatusValue;
  waterAvailable: WaterAvailability;
  sessionId: string;
}): Promise<StatusReport> {
  const { data, error } = await supabase
    .from('status_reports')
    .insert({
      location_id: params.locationId,
      status: params.status,
      water_available: params.waterAvailable,
      session_id: params.sessionId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as StatusReport;
}

/**
 * Check whether a location has zero ratings — used to detect the
 * "first reviewer" / Pioneer Reviewer case.
 */
export async function getRatingCountForLocation(locationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', locationId);

  if (error) {
    console.error('Failed to count ratings:', error);
    return 0;
  }
  return count ?? 0;
}
