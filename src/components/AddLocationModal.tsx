import { useState } from 'react';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import type { LocationType, LocationTag } from '@/lib/types';
import { addLocation } from '@/lib/data';
import { getSessionId } from '@/lib/session';
import { ModalShell } from './RatingModal';

// ---------------------------------------------------------------------------
// AddLocationModal — add a new toilet/water ATM (Feature #6).
//
// Uses the user's current GPS (auto-filled via "Use my location"). The
// user picks a type and optional tags, then submits. A banner at the
// top encourages users to "Help us map Kanniyakumari district".
// ---------------------------------------------------------------------------

interface AddLocationModalProps {
  userLat: number | null;
  userLng: number | null;
  onUseMyLocation: () => void;
  onClose: () => void;
  onAdded: () => void;
}

const TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'toilet', label: 'Toilet' },
  { value: 'water_atm', label: 'Water ATM' },
];

const TAG_OPTIONS: { value: LocationTag; label: string }[] = [
  { value: 'women_friendly', label: 'Women-friendly' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'wheelchair_accessible', label: 'Wheelchair accessible' },
];

export function AddLocationModal({
  userLat,
  userLng,
  onUseMyLocation,
  onClose,
  onAdded,
}: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('toilet');
  const [tags, setTags] = useState<LocationTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: LocationTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const canSubmit = name.trim().length > 0 && userLat !== null && userLng !== null && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      await addLocation({
        name: name.trim(),
        type,
        latitude: userLat!,
        longitude: userLng!,
        tags,
        sessionId: getSessionId(),
      });
      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add location.');
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Add a facility" onClose={onClose}>
      {/* Encouragement banner */}
      <div className="mb-4 rounded-lg bg-teal-50 p-3 text-xs font-medium text-teal-700">
        Help us map Kanniyakumari district — every new facility you add helps your community.
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-navy-600">Facility name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="e.g. Near Nagercoil Bus Stand"
          className="w-full rounded-lg border border-gray-200 p-3 text-sm text-navy focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </div>

      {/* Type */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-navy-600">Type</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                type === opt.value
                  ? 'border-teal-400 bg-teal-50 text-teal-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-navy-600">Tags <span className="font-normal text-gray-400">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((opt) => {
            const active = tags.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleTag(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-seafoam-500 text-white border-seafoam-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-seafoam-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-navy-600">Location (GPS)</label>
        {userLat !== null && userLng !== null ? (
          <div className="flex items-center gap-2 rounded-lg bg-mint-50 p-3 text-sm text-mint-800">
            <MapPin size={16} />
            <span>
              {userLat.toFixed(5)}, {userLng.toFixed(5)}
            </span>
          </div>
        ) : (
          <button
            onClick={onUseMyLocation}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm font-medium text-gray-500 hover:border-teal-400 hover:text-teal-600"
          >
            <MapPin size={16} />
            Use my location
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-coral-50 p-3 text-sm text-coral-700">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-mint-500 py-2.5 text-sm font-semibold text-white hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Adding…
            </>
          ) : (
            <>
              <Plus size={16} />
              Add facility
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}
