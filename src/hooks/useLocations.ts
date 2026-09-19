import { useState, useEffect, useCallback } from 'react';
import {
  fetchLocationsWithDetails,
  type FetchFilters,
} from '@/lib/data';
import type { LocationWithDetails } from '@/lib/types';
import { saveToCache, loadFromCache } from '@/lib/cache';

// ---------------------------------------------------------------------------
// useLocations — loads enriched locations with offline-first caching.
//
// Flow:
//  1. Try to fetch from Supabase.
//  2. On success → save to localStorage cache, clear the offline banner.
//  3. On failure → try the cache for the current filter.
//     a. Cache hit  → show cached data + "offline" banner.
//     b. Cache miss → show "No data available — connect to internet".
// ---------------------------------------------------------------------------

interface UseLocationsState {
  locations: LocationWithDetails[];
  loading: boolean;
  error: string | null;
  /** True when we're showing cached data because the fetch failed. */
  fromCache: boolean;
  refresh: () => void;
}

export function useLocations(
  filters: FetchFilters,
  userLat: number | null,
  userLng: number | null,
): UseLocationsState {
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchLocationsWithDetails({
          type: filters.type,
          tags: filters.tags,
          userLat,
          userLng,
        });

        if (cancelled) return;

        if (result.error) {
          throw new Error(result.error);
        }

        // Success — save to cache, clear offline banner.
        setLocations(result.locations);
        setFromCache(false);
        saveToCache(filters, result.locations);
      } catch (e) {
        if (cancelled) return;

        // Fetch failed — fall back to cache (Feature #10).
        const cached = loadFromCache(filters);
        if (cached && cached.length > 0) {
          setLocations(cached);
          setFromCache(true);
          setError(null);
        } else {
          // No cache for this filter → empty state, not a blank screen.
          setLocations([]);
          setFromCache(false);
          setError('No data available — connect to the internet to load facilities.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.tags.join(','), userLat, userLng, refreshTick]);

  return { locations, loading, error, fromCache, refresh };
}
