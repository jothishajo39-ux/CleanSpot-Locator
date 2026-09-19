import { ShieldAlert, X } from 'lucide-react';
import type { LocationWithDetails } from '@/lib/types';

// ---------------------------------------------------------------------------
// SosModal — Safety SOS button (Feature #9).
//
// Opens a confirmation modal explaining what would happen in a live
// deployment: alert nearby emergency contacts / local authorities.
// NO real call is made — this is a demo.
// ---------------------------------------------------------------------------

interface SosModalProps {
  location: LocationWithDetails;
  onClose: () => void;
}

export function SosModal({ location, onClose }: SosModalProps) {
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
          <h2 className="flex items-center gap-2 text-lg font-bold text-coral-600">
            <ShieldAlert size={22} />
            Safety Alert
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="rounded-xl bg-coral-50 p-4">
          <p className="mb-2 text-sm font-semibold text-navy">{location.name}</p>
          <p className="text-sm leading-relaxed text-navy-600">
            In a live deployment, tapping confirm would <strong>immediately alert
            nearby emergency contacts and local authorities</strong> with your GPS
            location and the facility details.
          </p>
          <p className="mt-3 rounded-lg bg-white p-2.5 text-xs text-gray-500">
            This is a demo — no real alert or call is made.
          </p>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-coral-500 py-2.5 text-sm font-semibold text-white hover:bg-coral-600"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
