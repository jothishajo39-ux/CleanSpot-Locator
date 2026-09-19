import { useState } from 'react';
import { Star, X, MapPinOff, MapPinCheck } from 'lucide-react';
import type { LocationWithDetails } from '@/lib/types';
import { haversineDistance, RATING_RADIUS_M } from '@/lib/geo';
import { submitRating, getRatingCountForLocation } from '@/lib/data';
import { getSessionId, awardBadge } from '@/lib/session';

// ---------------------------------------------------------------------------
// RatingModal — submit a 1–5 star cleanliness rating (Feature #2).
//
// GPS verification: before allowing submission, we check the user's
// current GPS against the location's coordinates. Only allow rating
// within ~100 m (RATING_RADIUS_M). If the user is too far (or we can't
// get their GPS), we show a clear message and disable the submit button.
//
// A "Simulate nearby" toggle bypasses the check for demo/judging — this
// is clearly labelled and is NOT a production feature.
//
// Pioneer Reviewer (Feature #7): if the location had zero ratings
// before this submission, the user earns a "pioneer_reviewer" badge.
// ---------------------------------------------------------------------------

interface RatingModalProps {
  location: LocationWithDetails;
  userLat: number | null;
  userLng: number | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RatingModal({ location, userLat, userLng, onClose, onSubmitted }: RatingModalProps) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [simulateNearby, setSimulateNearby] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- GPS proximity check ---
  // Distance from user to the location. If we don't have the user's
  // position, or they're beyond RATING_RADIUS_M, they can't rate
  // (unless "simulate nearby" is on).
  let distance: number | null = null;
  let withinRange = false;

  if (userLat !== null && userLng !== null) {
    distance = haversineDistance(userLat, userLng, location.latitude, location.longitude);
    withinRange = distance <= RATING_RADIUS_M;
  }

  const canRate = (withinRange || simulateNearby) && stars >= 1 && !submitting;

  const reasonBlocked =
    !simulateNearby && !withinRange
      ? userLat === null
        ? 'We need your GPS location to verify you are near this facility. Please enable location access.'
        : `You are ${distance !== null ? Math.round(distance) : '?'} m away — you must be within ${RATING_RADIUS_M} m to rate this facility.`
      : null;

  const handleSubmit = async () => {
    if (!canRate) return;
    setSubmitting(true);
    setError(null);

    try {
      const sessionId = getSessionId();

      // Check if this is the first rating → Pioneer Reviewer.
      const existingCount = await getRatingCountForLocation(location.id);
      const isFirst = existingCount === 0;

      await submitRating({
        locationId: location.id,
        stars,
        comment: comment.trim() || undefined,
        reviewerLat: userLat ?? undefined,
        reviewerLng: userLng ?? undefined,
        sessionId,
      });

      // Award badge + increment review count.
      if (isFirst) {
        await awardBadge(sessionId, 'pioneer_reviewer', true);
        setSuccessMsg('Pioneer Reviewer badge earned! You are the first to rate this location.');
      } else {
        await awardBadge(sessionId, '', true);
        setSuccessMsg('Thank you! Your rating has been submitted.');
      }

      // Brief delay to show the success message, then close.
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit rating.');
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Rate cleanliness" onClose={onClose}>
      {/* Location name */}
      <p className="mb-1 text-sm font-semibold text-navy">{location.name}</p>
      <p className="mb-4 text-xs text-gray-400">
        {location.type === 'toilet' ? 'Public Toilet' : 'Water ATM'}
      </p>

      {/* GPS verification status */}
      <div
        className={`mb-4 flex items-start gap-2 rounded-lg p-3 text-xs ${
          withinRange || simulateNearby
            ? 'bg-mint-50 text-mint-800'
            : 'bg-amber-50 text-amber-800'
        }`}
      >
        {withinRange || simulateNearby ? (
          <MapPinCheck size={16} className="mt-0.5 shrink-0" />
        ) : (
          <MapPinOff size={16} className="mt-0.5 shrink-0" />
        )}
        <div>
          {simulateNearby ? (
            <p><strong>Simulate nearby:</strong> GPS check bypassed for demo.</p>
          ) : withinRange ? (
            <p>Location verified — you are within {RATING_RADIUS_M} m.</p>
          ) : (
            <p>{reasonBlocked}</p>
          )}
        </div>
      </div>

      {/* Star picker */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-navy-600">Tap to rate</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              className="transition-transform hover:scale-110"
              aria-label={`${n} stars`}
            >
              <Star
                size={36}
                className={n <= stars ? 'fill-star text-star' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-navy-600">
          Comment <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="How clean was it? Any issues?"
          className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-navy focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </div>

      {/* Simulate nearby toggle */}
      <label className="mb-4 flex items-center gap-2 text-xs text-gray-500">
        <input
          type="checkbox"
          checked={simulateNearby}
          onChange={(e) => setSimulateNearby(e.target.checked)}
          className="h-4 w-4 rounded accent-teal-500"
        />
        Simulate nearby (bypass GPS check for demo)
      </label>

      {/* Error */}
      {error && (
        <p className="mb-3 rounded-lg bg-coral-50 p-3 text-sm text-coral-700">{error}</p>
      )}

      {/* Success */}
      {successMsg && (
        <p className="mb-3 rounded-lg bg-mint-50 p-3 text-sm font-medium text-mint-800">
          {successMsg}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canRate || !!successMsg}
          className="flex-1 rounded-lg bg-mint-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit rating'}
        </button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// ModalShell — shared modal wrapper (backdrop + centered panel).
// ---------------------------------------------------------------------------

export function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
