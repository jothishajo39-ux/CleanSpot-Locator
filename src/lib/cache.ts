import type { LocationWithDetails } from './types';

// ---------------------------------------------------------------------------
// Offline-first caching (Feature #10)
//
// After every successful fetch we cache the enriched locations keyed by
// a filter string.  If a later fetch fails (offline / network error),
// we fall back to the most recent matching cache and the UI shows a
// "Showing cached data (offline)" banner.
//
// If there's no cache at all for the current filter we return null and
// the UI shows a "No data available — connect to internet" empty state.
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'cleanspot_cache_';

/** Build a cache key from the active filter state. */
export function cacheKey(filters: {
  type: 'all' | 'toilet' | 'water_atm';
  tags: string[];
}): string {
  return `${CACHE_PREFIX}${filters.type}__${[...filters.tags].sort().join(',')}`;
}

/** Store enriched locations in localStorage under the filter key. */
export function saveToCache(
  filters: { type: 'all' | 'toilet' | 'water_atm'; tags: string[] },
  locations: LocationWithDetails[],
): void {
  try {
    localStorage.setItem(
      cacheKey(filters),
      JSON.stringify({ ts: Date.now(), locations }),
    );
  } catch (e) {
    // localStorage might be full or disabled — silently ignore.
    console.warn('Cache save failed:', e);
  }
}

/** Read cached locations for a filter, or null if none exists. */
export function loadFromCache(filters: {
  type: 'all' | 'toilet' | 'water_atm';
  tags: string[];
}): LocationWithDetails[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(filters));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; locations: LocationWithDetails[] };
    return parsed.locations;
  } catch {
    return null;
  }
}
