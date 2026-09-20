import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { STATUS_EXPIRY_HOURS } from '@/lib/trustScore';
import type { Location, Rating, StatusReport, LocationWithDetails } from '@/lib/types';
import { enrichLocation } from '@/lib/trustScore';
import {
  AlertTriangle,
  Lock,
  Ban,
  TrendingUp,
  BarChart3,
  MapPin,
  Building2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// DashboardPage — Municipality dashboard (Feature #8).
//
// Shows:
//  - Total locations
//  - Locations below a trust-score threshold (flagged "needs attention")
//  - Most-reported "locked" or "no water" locations this week
//  - A bar chart of average trust score by area/tag
//
// This simulates value for a municipal sanitation department — it's
// read-only, pulling all data from Supabase and computing the same
// trust scores the public app uses.
// ---------------------------------------------------------------------------

const TRUST_THRESHOLD = 40; // below this → "needs attention"

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch all locations + ratings + status reports.
        const [{ data: locs }, { data: ratings }, { data: status }] = await Promise.all([
          supabase.from('locations').select('*'),
          supabase.from('ratings').select('*'),
          supabase.from('status_reports').select('*'),
        ]);

        const allLocs = (locs ?? []) as Location[];
        const allRatings = (ratings ?? []) as Rating[];
        const allStatus = (status ?? []) as StatusReport[];

        const enriched = allLocs.map((loc) => {
          const locRatings = allRatings.filter((r) => r.location_id === loc.id);
          const locStatus = allStatus.filter((s) => s.location_id === loc.id);
          // Pass null for user position — dashboard doesn't need distance.
          return enrichLocation(loc, locRatings, locStatus, null, null);
        });

        setLocations(enriched);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --- Compute metrics ---
  const totalLocations = locations.length;
  const ratedLocations = locations.filter((l) => l.trustScore !== null);
  const needsAttention = locations.filter((l) => l.trustScore !== null && l.trustScore < TRUST_THRESHOLD);

  // "This week" = last 7 days.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const problemReports = locations
    .map((l) => {
      if (!l.latestStatus || l.statusExpired) return null;
      const reportTime = new Date(l.latestStatus.created_at).getTime();
      if (reportTime < weekAgo) return null;
      if (l.latestStatus.status === 'locked' || l.latestStatus.water_available === 'false') {
        return l;
      }
      return null;
    })
    .filter((l): l is LocationWithDetails => l !== null)
    .sort((a, b) => b.reviewCount - a.reviewCount);

  // Average trust score by tag.
  const tagScoreMap = new Map<string, { sum: number; count: number }>();
  for (const loc of ratedLocations) {
    if (loc.trustScore === null) continue;
    for (const tag of loc.tags) {
      const entry = tagScoreMap.get(tag) ?? { sum: 0, count: 0 };
      entry.sum += loc.trustScore;
      entry.count += 1;
      tagScoreMap.set(tag, entry);
    }
  }
  const tagScores = Array.from(tagScoreMap.entries())
    .map(([tag, { sum, count }]) => ({
      tag,
      label: TAG_LABEL_MAP[tag] ?? tag,
      avg: Math.round(sum / count),
    }))
    .sort((a, b) => b.avg - a.avg);

  // Overall average trust score.
  const overallAvg = ratedLocations.length > 0
    ? Math.round(ratedLocations.reduce((s, l) => s + (l.trustScore ?? 0), 0) / ratedLocations.length)
    : 0;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pb-16">
        <p className="text-sm text-gray-400">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 pb-16 text-center">
        <AlertTriangle size={36} className="text-coral-400" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto px-4 pb-20 pt-4">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-navy">
          <Building2 size={22} className="text-teal-500" />
          Municipality Dashboard
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Simulated view for a municipal sanitation department.
        </p>
      </header>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard icon={MapPin} label="Total locations" value={totalLocations} color="teal" />
        <StatCard icon={TrendingUp} label="Avg trust score" value={overallAvg} color="mint" />
        <StatCard
          icon={AlertTriangle}
          label="Need attention"
          value={needsAttention.length}
          color="coral"
          subtitle={`Score < ${TRUST_THRESHOLD}`}
        />
        <StatCard
          icon={Lock}
          label="Issues this week"
          value={problemReports.length}
          color="amber"
          subtitle="Locked / no water"
        />
      </div>

      {/* Needs attention list */}
      <section className="mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
          <AlertTriangle size={16} className="text-coral-500" />
          Locations needing attention
        </h2>
        {needsAttention.length === 0 ? (
          <p className="rounded-lg bg-mint-50 p-4 text-sm text-mint-700">
            No locations below the threshold — all rated facilities are in fair or good standing.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {needsAttention.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between rounded-xl border border-coral-100 bg-coral-50 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">{loc.name}</p>
                  <p className="text-xs text-gray-500">
                    {loc.tags.join(', ') || 'No tags'} · {loc.reviewCount} review{loc.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-lg font-bold text-coral-600">{loc.trustScore}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Problem reports this week */}
      <section className="mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
          <Lock size={16} className="text-amber-500" />
          Most-reported issues this week
        </h2>
        {problemReports.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No "locked" or "no water" reports in the last 7 days.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {problemReports.slice(0, 5).map((loc) => {
              const issue =
                loc.latestStatus!.status === 'locked'
                  ? 'Locked'
                  : loc.latestStatus!.water_available === 'false'
                    ? 'No water'
                    : loc.latestStatus!.status;
              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy">{loc.name}</p>
                    <p className="text-xs text-amber-700">{issue}</p>
                  </div>
                  {loc.latestStatus!.water_available === 'false' && (
                    <Ban size={18} className="text-coral-500" />
                  )}
                  {loc.latestStatus!.status === 'locked' && (
                    <Lock size={18} className="text-coral-500" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust score by tag — bar chart */}
      <section className="mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
          <BarChart3 size={16} className="text-seafoam-500" />
          Average trust score by tag
        </h2>
        {tagScores.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No tagged locations with ratings yet.
          </p>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex flex-col gap-3">
              {tagScores.map((item) => (
                <div key={item.tag}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-navy-600">{item.label}</span>
                    <span className="font-bold text-navy">{item.avg}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.avg >= 70 ? 'bg-mint-500' : item.avg >= 40 ? 'bg-amber-400' : 'bg-coral-500'
                      }`}
                      style={{ width: `${item.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Expiry note */}
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
        Status reports auto-expire after {STATUS_EXPIRY_HOURS} hours — expired
        reports show as "Unverified" and are excluded from the issues list.
        Trust scores use recency-weighted ratings (90-day linear decay to a 20% floor).
      </p>
    </div>
  );
}

// --- Stat card ---
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
  color: 'teal' | 'mint' | 'coral' | 'amber';
  subtitle?: string;
}) {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-600',
    mint: 'bg-mint-50 text-mint-600',
    coral: 'bg-coral-50 text-coral-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
    </div>
  );
}

// Tag label map (avoids importing display.ts again for a different format).
const TAG_LABEL_MAP: Record<string, string> = {
  women_friendly: 'Women-friendly',
  free: 'Free',
  paid: 'Paid',
  wheelchair_accessible: 'Wheelchair accessible',
};
