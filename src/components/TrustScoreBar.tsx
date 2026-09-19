import { trustScoreColor, trustScoreLabel } from '@/lib/display';

// ---------------------------------------------------------------------------
// TrustScoreBar — a horizontal progress bar showing the 0–100 trust score.
//
// When score is null (zero ratings) we show an "Unverified / New" badge
// with a "Be the first to review!" prompt instead of a bar.
// (Feature #5)
// ---------------------------------------------------------------------------

interface TrustScoreBarProps {
  score: number | null;
  reviewCount: number;
}

export function TrustScoreBar({ score, reviewCount }: TrustScoreBarProps) {
  if (score === null) {
    return (
      <div className="flex flex-col gap-1">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          Unverified / New
        </div>
        <p className="text-xs text-gray-400">Be the first to review!</p>
      </div>
    );
  }

  const label = trustScoreLabel(score);
  const color = trustScoreColor(score);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-navy-400">Trust score</span>
        <span className="text-xs font-bold text-navy">
          {score}
          <span className="font-normal text-gray-400">/100</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-400">
          {reviewCount} review{reviewCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
