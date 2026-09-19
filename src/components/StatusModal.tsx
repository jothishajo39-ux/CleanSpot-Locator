import { useState } from 'react';
import { CheckCircle, Lock, Wrench, Droplets, Droplet, HelpCircle } from 'lucide-react';
import type { LocationWithDetails, StatusValue, WaterAvailability } from '@/lib/types';
import { submitStatusReport } from '@/lib/data';
import { getSessionId } from '@/lib/session';
import { ModalShell } from './RatingModal';

// ---------------------------------------------------------------------------
// StatusModal — report real-time status + water availability (Feature #3).
//
// Two independent questions:
//  1. Status: working / locked / maintenance
//  2. Water available: yes / no / unknown (relevant for toilets)
//
// Auto-expiry is NOT handled here — it's in trustScore.ts (isStatusExpired).
// A report is fresh for 6 hours; after that the UI shows "Unverified".
// ---------------------------------------------------------------------------

interface StatusModalProps {
  location: LocationWithDetails;
  onClose: () => void;
  onSubmitted: () => void;
}

const STATUS_OPTIONS: { value: StatusValue; label: string; icon: typeof CheckCircle; color: string }[] = [
  { value: 'working', label: 'Working', icon: CheckCircle, color: 'border-mint-400 bg-mint-50 text-mint-700' },
  { value: 'locked', label: 'Locked', icon: Lock, color: 'border-coral-400 bg-coral-50 text-coral-700' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'border-amber-400 bg-amber-50 text-amber-700' },
];

const WATER_OPTIONS: { value: WaterAvailability; label: string; icon: typeof Droplets }[] = [
  { value: 'true', label: 'Water available', icon: Droplets },
  { value: 'false', label: 'No water', icon: Droplet },
  { value: 'unknown', label: "Don't know", icon: HelpCircle },
];

export function StatusModal({ location, onClose, onSubmitted }: StatusModalProps) {
  const [status, setStatus] = useState<StatusValue | null>(null);
  const [water, setWater] = useState<WaterAvailability>('unknown');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isToilet = location.type === 'toilet';

  const handleSubmit = async () => {
    if (status === null) return;
    setSubmitting(true);
    setError(null);

    try {
      await submitStatusReport({
        locationId: location.id,
        status,
        waterAvailable: water,
        sessionId: getSessionId(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit status report.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <ModalShell title="Report status" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-100">
            <CheckCircle size={32} className="text-mint-600" />
          </div>
          <p className="text-sm font-medium text-navy">Thank you! Status report submitted.</p>
          <p className="text-xs text-gray-400">
            This report stays fresh for 6 hours, then shows "Unverified".
          </p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Report status" onClose={onClose}>
      <p className="mb-1 text-sm font-semibold text-navy">{location.name}</p>
      <p className="mb-5 text-xs text-gray-400">
        Help others know what's happening right now.
      </p>

      {/* Status selection */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-navy-600">Current status</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-semibold transition-all ${
                  active ? opt.color : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Icon size={22} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Water availability — only for toilets */}
      {isToilet && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-navy-600">Water available inside?</p>
          <div className="grid grid-cols-3 gap-2">
            {WATER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = water === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setWater(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-semibold transition-all ${
                    active
                      ? opt.value === 'true'
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : opt.value === 'false'
                          ? 'border-coral-400 bg-coral-50 text-coral-700'
                          : 'border-gray-400 bg-gray-50 text-gray-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={22} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          disabled={status === null || submitting}
          className="flex-1 rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </ModalShell>
  );
}
