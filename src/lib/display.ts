import type {
  LocationTag,
  StatusValue,
  WaterAvailability,
  LocationType,
} from './types';
import {
  Droplet,
  Droplets,
  Accessibility,
  Women,
  IndianRupee,
  Heart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Display helpers — keep tag/status colors and labels in one place.
// ---------------------------------------------------------------------------

export const TAG_LABELS: Record<LocationTag, string> = {
  women_friendly: 'Women-friendly',
  free: 'Free',
  paid: 'Paid',
  wheelchair_accessible: 'Wheelchair accessible',
};

export const TAG_ICONS: Record<LocationTag, LucideIcon> = {
  women_friendly: Women,
  free: Heart,
  paid: IndianRupee,
  wheelchair_accessible: Accessibility,
};

export const TAG_COLORS: Record<LocationTag, string> = {
  women_friendly: 'bg-pink-100 text-pink-700 border-pink-200',
  free: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  paid: 'bg-amber-100 text-amber-700 border-amber-200',
  wheelchair_accessible: 'bg-sky-100 text-sky-700 border-sky-200',
};

export const STATUS_LABELS: Record<StatusValue, string> = {
  working: 'Working',
  locked: 'Locked',
  maintenance: 'Maintenance',
};

export const STATUS_COLORS: Record<StatusValue, string> = {
  working: 'bg-mint-100 text-mint-800 border-mint-300',
  locked: 'bg-coral-100 text-coral-800 border-coral-300',
  maintenance: 'bg-amber-100 text-amber-800 border-amber-300',
};

export const WATER_LABELS: Record<WaterAvailability, string> = {
  true: 'Water available',
  false: 'No water',
  unknown: 'Water: unknown',
};

export const WATER_ICONS: Record<WaterAvailability, LucideIcon> = {
  true: Droplets,
  false: Droplet,
  unknown: Droplet,
};

export const WATER_COLORS: Record<WaterAvailability, string> = {
  true: 'text-sky-600',
  false: 'text-coral-600',
  unknown: 'text-gray-400',
};

export const TYPE_LABELS: Record<LocationType, string> = {
  toilet: 'Toilet',
  water_atm: 'Water ATM',
};

/** Trust-score colour ramp for the progress bar. */
export function trustScoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-300';
  if (score >= 70) return 'bg-mint-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-coral-500';
}

export function trustScoreLabel(score: number | null): string {
  if (score === null) return 'Unverified / New';
  if (score >= 70) return 'Trusted';
  if (score >= 40) return 'Fair';
  return 'Needs attention';
}
