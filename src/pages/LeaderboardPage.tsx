import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Star, Sparkles } from 'lucide-react';
import { getTopContributors } from '@/lib/session';
import { getSessionId } from '@/lib/session';
import type { AppUser } from '@/lib/types';

// ---------------------------------------------------------------------------
// LeaderboardPage — Top Contributors (Feature #7).
//
// Ranks anonymous session-based users by review_count. Shows badges.
// The current user's own row is highlighted so they can find themselves.
// ---------------------------------------------------------------------------

export function LeaderboardPage() {
  const [contributors, setContributors] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentSessionId = getSessionId();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getTopContributors(20);
        setContributors(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto px-4 pb-20 pt-4">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-xl font-bold text-navy">
          <Trophy size={22} className="text-star" />
          Top Contributors
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Community members helping map clean facilities across Kanniyakumari.
        </p>
      </header>

      {/* Pioneer badge explainer */}
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-gradient-to-r from-mint-50 to-teal-50 p-4">
        <Sparkles size={24} className="mt-0.5 shrink-0 text-mint-600" />
        <div>
          <p className="text-sm font-semibold text-navy">Pioneer Reviewer Badge</p>
          <p className="text-xs text-gray-500">
            Earn this badge by being the first person to rate a brand-new location.
            Help expand the map and guide your community to cleaner facilities!
          </p>
        </div>
      </div>

      {loading && <p className="py-8 text-center text-sm text-gray-400">Loading leaderboard…</p>}

      {error && (
        <p className="rounded-lg bg-coral-50 p-4 text-sm text-coral-700">{error}</p>
      )}

      {!loading && !error && contributors.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center">
          <Trophy size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">
            No contributors yet. Be the first — rate a facility to get on the board!
          </p>
        </div>
      )}

      {!loading && !error && contributors.length > 0 && (
        <div className="flex flex-col gap-2">
          {contributors.map((user, idx) => {
            const isMe = user.id === currentSessionId;
            const rank = idx + 1;
            const hasPioneer = user.badges.includes('pioneer_reviewer');

            const RankIcon = rank === 1 ? Medal : rank === 2 ? Award : rank === 3 ? Award : null;
            const rankColor = rank === 1 ? 'text-star' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-coral-400' : 'text-gray-300';

            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  isMe
                    ? 'border-mint-300 bg-mint-50 ring-1 ring-mint-200'
                    : 'border-gray-100 bg-white'
                }`}
              >
                {/* Rank */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${rankColor}`}>
                  {RankIcon ? (
                    <RankIcon size={24} />
                  ) : (
                    <span className="text-lg font-bold">{rank}</span>
                  )}
                </div>

                {/* Name + badges */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">
                    {isMe ? 'You' : `Contributor ${user.id.slice(0, 6)}`}
                  </p>
                  <div className="flex items-center gap-2">
                    {hasPioneer && (
                      <span className="flex items-center gap-1 rounded-full bg-mint-100 px-2 py-0.5 text-xs font-medium text-mint-700">
                        <Sparkles size={10} />
                        Pioneer
                      </span>
                    )}
                  </div>
                </div>

                {/* Review count */}
                <div className="flex items-center gap-1.5 text-right">
                  <Star size={16} className="fill-star text-star" />
                  <div>
                    <p className="text-sm font-bold text-navy">{user.review_count}</p>
                    <p className="text-[10px] text-gray-400">reviews</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
