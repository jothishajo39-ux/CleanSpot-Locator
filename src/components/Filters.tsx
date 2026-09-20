import { Bath, Droplets, Heart, IndianRupee, Accessibility, Users } from 'lucide-react';
import type { LocationType, LocationTag } from '@/lib/types';

// ---------------------------------------------------------------------------
// Filters — horizontally scrollable filter chips (Feature #4).
//
// Two groups:
//  1. Type filter: All / Toilets / Water ATMs
//  2. Tag filters: women-friendly, free, paid, wheelchair accessible
//
// On mobile these scroll horizontally (no-scrollbar class hides the bar).
// ---------------------------------------------------------------------------

export interface FilterState {
  type: 'all' | LocationType;
  tags: LocationTag[];
}

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const TYPE_OPTIONS: { value: 'all' | LocationType; label: string; icon: typeof Bath }[] = [
  { value: 'all', label: 'All', icon: Bath },
  { value: 'toilet', label: 'Toilets', icon: Bath },
  { value: 'water_atm', label: 'Water ATMs', icon: Droplets },
];

const TAG_OPTIONS: { value: LocationTag; label: string; icon: typeof Heart }[] = [
  { value: 'women_friendly', label: 'Women-friendly', icon: Users },
  { value: 'free', label: 'Free', icon: Heart },
  { value: 'paid', label: 'Paid', icon: IndianRupee },
  { value: 'wheelchair_accessible', label: 'Wheelchair', icon: Accessibility },
];

export function Filters({ filters, onChange }: FiltersProps) {
  const toggleTag = (tag: LocationTag) => {
    const has = filters.tags.includes(tag);
    onChange({
      ...filters,
      tags: has ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag],
    });
  };

  return (
    <div className="flex flex-col gap-2 px-4 pt-3">
      {/* Type chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = filters.type === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, type: opt.value })}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                  : 'bg-white text-navy-600 border-gray-200 hover:border-teal-300'
              }`}
            >
              <Icon size={15} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Tag chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TAG_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = filters.tags.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleTag(opt.value)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-seafoam-500 text-white border-seafoam-500 shadow-sm'
                  : 'bg-white text-navy-600 border-gray-200 hover:border-seafoam-300'
              }`}
            >
              <Icon size={15} />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
