import { useState, useCallback, useMemo } from 'react';
import { Plus, Locate, Loader2, WifiOff, PackageOpen, Info } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLocations } from '@/hooks/useLocations';
import { Filters, type FilterState } from '@/components/Filters';
import { LocationCard } from '@/components/LocationCard';
import { MapView } from '@/components/MapView';
import { RatingModal } from '@/components/RatingModal';
import { StatusModal } from '@/components/StatusModal';
import { AddLocationModal } from '@/components/AddLocationModal';
import { SosModal } from '@/components/SosModal';
import type { LocationWithDetails } from '@/lib/types';

// ---------------------------------------------------------------------------
// MapPage — the main screen (Feature #1, #4, #10).
//
// Layout (mobile-first):
//   Top: header + filter chips
//   Middle: collapsible map (toggle between map and list view)
//   Bottom: scrollable list of location cards
//
// On desktop: map on the left, list on the right (side-by-side).
// ---------------------------------------------------------------------------

export function MapPage() {
  const geo = useGeolocation();
  const [filters, setFilters] = useState<FilterState>({ type: 'all', tags: [] });
  const [view, setView] = useState<'list' | 'map'>('list');
  const [recenterKey, setRecenterKey] = useState(0);
  const [selectedLoc, setSelectedLoc] = useState<LocationWithDetails | null>(null);
  const [ratingLoc, setRatingLoc] = useState<LocationWithDetails | null>(null);
  const [statusLoc, setStatusLoc] = useState<LocationWithDetails | null>(null);
  const [sosLoc, setSosLoc] = useState<LocationWithDetails | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { locations, loading, error, fromCache, refresh } = useLocations(
    filters,
    geo.lat,
    geo.lng,
  );

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleUseMyLocation = useCallback(() => {
    geo.requestPosition();
    setRecenterKey((k) => k + 1);
  }, [geo]);

  // Show selected location details in a modal-like expanded card.
  // For simplicity, selecting a card opens the rating modal as the
  // "detail view" entry point — the user can then rate, report, or SOS.
  const handleSelectLocation = useCallback((loc: LocationWithDetails) => {
    setSelectedLoc(loc);
  }, []);

  const memoizedLocations = useMemo(() => locations, [locations]);

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col pb-16">
      {/* Header */}
      <header className="z-10 bg-navy px-4 pb-3 pt-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">CleanSpot</h1>
            <p className="text-xs text-navy-100">
              Kanniyakumari — clean facilities, near you
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUseMyLocation}
              className="flex items-center gap-1.5 rounded-lg bg-navy-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-navy-700"
            >
              <Locate size={15} />
              <span className="hidden sm:inline">My location</span>
            </button>
            <button
              onClick={() => setView(view === 'list' ? 'map' : 'list')}
              className="rounded-lg bg-navy-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-navy-700"
            >
              {view === 'list' ? 'Map' : 'List'}
            </button>
          </div>
        </div>
      </header>

      {/* Geolocation status / loading */}
      {geo.loading && (
        <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 text-xs text-teal-700">
          <Loader2 size={14} className="animate-spin" />
          Getting your location…
        </div>
      )}
      {geo.error && (
        <div className="flex items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <span>{geo.error}</span>
          <button
            onClick={handleUseMyLocation}
            className="shrink-0 rounded-md bg-amber-200 px-2 py-1 font-semibold text-amber-900 hover:bg-amber-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Seed data disclaimer */}
      <div className="flex items-center gap-1.5 bg-offwhite px-4 py-1.5 text-[11px] text-gray-500">
        <Info size={11} className="shrink-0" />
        Starting reference points — refined by community. Not officially verified.
      </div>

      {/* Filters */}
      <Filters filters={filters} onChange={setFilters} />

      {/* Offline banner */}
      {fromCache && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <WifiOff size={14} />
          Showing cached data (offline)
        </div>
      )}

      {/* Map view (when toggled) */}
      {view === 'map' && (
        <div className="relative mt-2 flex-1 px-4">
          <div className="h-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <MapView
              locations={memoizedLocations}
              userLat={geo.lat}
              userLng={geo.lng}
              onSelectLocation={handleSelectLocation}
              recenterKey={recenterKey}
            />
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto px-4 pt-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              Loading facilities…
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <PackageOpen size={40} className="text-gray-300" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {!loading && !error && locations.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <PackageOpen size={40} className="text-gray-300" />
              <p className="text-sm text-gray-500">
                No facilities match your filters. Try adjusting them, or add a new one!
              </p>
            </div>
          )}

          {!loading && !error && locations.length > 0 && (
            <>
              <p className="mb-3 text-xs font-medium text-gray-400">
                {locations.length} facilit{locations.length !== 1 ? 'ies' : 'y'} found
              </p>
              <div className="flex flex-col gap-3">
                {locations.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    location={loc}
                    onRate={setRatingLoc}
                    onReportStatus={setStatusLoc}
                    onSos={setSosLoc}
                    onSelect={handleSelectLocation}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Add Location button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 z-20 flex items-center gap-2 rounded-full bg-mint-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-mint-500/30 transition-all hover:bg-mint-600 hover:shadow-xl active:scale-95"
      >
        <Plus size={20} />
        <span className="hidden sm:inline">Add Location</span>
      </button>

      {/* --- Modals --- */}
      {ratingLoc && (
        <RatingModal
          location={ratingLoc}
          userLat={geo.lat}
          userLng={geo.lng}
          onClose={() => setRatingLoc(null)}
          onSubmitted={handleRefresh}
        />
      )}

      {statusLoc && (
        <StatusModal
          location={statusLoc}
          onClose={() => setStatusLoc(null)}
          onSubmitted={handleRefresh}
        />
      )}

      {sosLoc && <SosModal location={sosLoc} onClose={() => setSosLoc(null)} />}

      {showAdd && (
        <AddLocationModal
          userLat={geo.lat}
          userLng={geo.lng}
          onUseMyLocation={handleUseMyLocation}
          onClose={() => setShowAdd(false)}
          onAdded={handleRefresh}
        />
      )}

      {/* Selected location detail (simple bottom sheet) */}
      {selectedLoc && !ratingLoc && !statusLoc && !sosLoc && (
        <SelectedLocationSheet
          location={selectedLoc}
          onClose={() => setSelectedLoc(null)}
          onRate={() => {
            setRatingLoc(selectedLoc);
            setSelectedLoc(null);
          }}
          onReport={() => {
            setStatusLoc(selectedLoc);
            setSelectedLoc(null);
          }}
          onSos={() => {
            setSosLoc(selectedLoc);
            setSelectedLoc(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectedLocationSheet — a bottom sheet showing the full detail of a
// selected location with the three action buttons.
// ---------------------------------------------------------------------------

import { Star, MapPin, X, Pencil, Activity, ShieldAlert, Droplets, Droplet } from 'lucide-react';
import { formatDistance } from '@/lib/geo';
import { TAG_LABELS, TAG_COLORS, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS } from '@/lib/display';
import { TrustScoreBar } from '@/components/TrustScoreBar';

function SelectedLocationSheet({
  location,
  onClose,
  onRate,
  onReport,
  onSos,
}: {
  location: LocationWithDetails;
  onClose: () => void;
  onRate: () => void;
  onReport: () => void;
  onSos: () => void;
}) {
  const isToilet = location.type === 'toilet';
  const statusExpired = location.statusExpired || !location.latestStatus;
  const statusText = statusExpired ? 'Unverified' : STATUS_LABELS[location.latestStatus!.status];
  const statusClass = statusExpired
    ? 'bg-gray-100 text-gray-500 border-gray-200'
    : STATUS_COLORS[location.latestStatus!.status];
  const water = !statusExpired && location.latestStatus ? location.latestStatus.water_available : 'unknown';
  const WaterIcon = water === 'true' ? Droplets : Droplet;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isToilet ? 'bg-teal-50 text-teal-600' : 'bg-seafoam-50 text-seafoam-600'
              }`}
            >
              {isToilet ? <MapPin size={20} /> : <Droplets size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">{location.name}</h2>
              <p className="text-xs text-gray-400">{TYPE_LABELS[location.type]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {location.distance !== null && (
          <p className="mb-3 text-sm text-gray-500">
            <MapPin size={13} className="mr-1 inline" />
            {formatDistance(location.distance)} from you
          </p>
        )}

        {/* Status + water */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
            {statusText}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${
            water === 'true' ? 'text-sky-600' : water === 'false' ? 'text-coral-600' : 'text-gray-400'
          }`}>
            <WaterIcon size={13} />
            {water === 'true' ? 'Water available' : water === 'false' ? 'No water' : 'Water: unknown'}
          </span>
        </div>

        {/* Rating */}
        {location.averageRating !== null && (
          <div className="mb-3 flex items-center gap-2">
            <Star size={18} className="fill-star text-star" />
            <span className="text-lg font-bold text-navy">{location.averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({location.reviewCount} reviews)</span>
          </div>
        )}

        {/* Tags */}
        {location.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {location.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
              >
                {TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}

        {/* Trust score */}
        <div className="mb-4">
          <TrustScoreBar score={location.trustScore} reviewCount={location.reviewCount} />
        </div>

        {/* Coordinates */}
        <p className="mb-4 text-xs text-gray-400">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onRate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-mint-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-mint-600"
          >
            <Pencil size={15} />
            Rate
          </button>
          <button
            onClick={onReport}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
          >
            <Activity size={15} />
            Report
          </button>
          <button
            onClick={onSos}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-coral-50 px-3 py-2.5 text-sm font-semibold text-coral-600 hover:bg-coral-100"
          >
            <ShieldAlert size={15} />
            SOS
          </button>
        </div>
      </div>
    </div>
  );
}
