import { Star, MapPin, Droplets, Droplet, ShieldAlert, Pencil, Activity } from 'lucide-react';
import type { LocationWithDetails } from '@/lib/types';
import { formatDistance } from '@/lib/geo';
import {
  TAG_LABELS,
  TAG_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  TYPE_LABELS,
} from '@/lib/display';
import { TrustScoreBar } from './TrustScoreBar';

// ---------------------------------------------------------------------------
// LocationCard — the main card shown for each facility.
//
// Shows: name, type icon, status badge, water availability, star rating
// (or "Unverified"), trust score bar, distance, tags, and action buttons
// (Rate, Report Status, SOS).
// ---------------------------------------------------------------------------

interface LocationCardProps {
  location: LocationWithDetails;
  onRate: (loc: LocationWithDetails) => void;
  onReportStatus: (loc: LocationWithDetails) => void;
  onSos: (loc: LocationWithDetails) => void;
  onSelect: (loc: LocationWithDetails) => void;
}

export function LocationCard({ location, onRate, onReportStatus, onSos, onSelect }: LocationCardProps) {
  const isToilet = location.type === 'toilet';

  // Status display: if the latest report expired, show "Unverified".
  const statusText = location.statusExpired || !location.latestStatus
    ? 'Unverified'
    : STATUS_LABELS[location.latestStatus.status];
  const statusClass = location.statusExpired || !location.latestStatus
    ? 'bg-gray-100 text-gray-500 border-gray-200'
    : STATUS_COLORS[location.latestStatus.status];

  // Water availability — only relevant for toilets.
  const water = location.latestStatus && !location.statusExpired
    ? location.latestStatus.water_available
    : 'unknown';
  const WaterIcon = water === 'true' ? Droplets : Droplet;
  const waterText = location.statusExpired || !location.latestStatus
    ? 'Water: unknown'
    : (water === 'true' ? 'Water available' : water === 'false' ? 'No water' : 'Water: unknown');
  const waterColor = location.statusExpired || !location.latestStatus
    ? 'text-gray-400'
    : (water === 'true' ? 'text-sky-600' : water === 'false' ? 'text-coral-600' : 'text-gray-400');

  return (
    <div
      className="animate-fade-in cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
      onClick={() => onSelect(location)}
    >
      {/* Header: name + type icon */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isToilet ? 'bg-teal-50 text-teal-600' : 'bg-seafoam-50 text-seafoam-600'
            }`}
          >
            {isToilet ? <MapPin size={18} /> : <Droplets size={18} />}
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight text-navy">{location.name}</h3>
            <p className="text-xs text-gray-400">{TYPE_LABELS[location.type]}</p>
          </div>
        </div>

        {/* Star rating or Unverified */}
        <div className="flex flex-col items-end">
          {location.averageRating !== null ? (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-star text-star" />
              <span className="text-sm font-bold text-navy">
                {location.averageRating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
              New
            </span>
          )}
          {location.distance !== null && (
            <span className="mt-0.5 text-xs text-gray-400">
              {formatDistance(location.distance)}
            </span>
          )}
        </div>
      </div>

      {/* Status + water badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass}`}>
          {statusText}
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium ${waterColor}`}>
          <WaterIcon size={13} />
          {waterText}
        </span>
      </div>

      {/* Tags */}
      {location.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {location.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
              {TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}

      {/* Trust score */}
      <div className="mb-3">
        <TrustScoreBar score={location.trustScore} reviewCount={location.reviewCount} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onRate(location); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-mint-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-mint-600"
        >
          <Pencil size={14} />
          Rate
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReportStatus(location); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
        >
          <Activity size={14} />
          Report
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSos(location); }}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-coral-50 px-3 py-2 text-xs font-semibold text-coral-600 transition-colors hover:bg-coral-100"
          aria-label="Safety alert"
        >
          <ShieldAlert size={14} />
          SOS
        </button>
      </div>
    </div>
  );
}

