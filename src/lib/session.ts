import type { AppUser } from './types';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Lightweight anonymous session — no login, no password.
//
// On first visit we generate a random session id, store it in
// localStorage, and create a matching `app_users` row.  This row tracks
// review_count and badges (e.g. "pioneer_reviewer") for gamification.
// ---------------------------------------------------------------------------

const SESSION_KEY = 'cleanspot_session_id';

function generateSessionId(): string {
  // crypto.randomUUID is available in all modern browsers.
  return (crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
}

/** Read the session id from localStorage, creating one if none exists. */
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateSessionId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Ensure an `app_users` row exists for this session id.
 * Returns the user record.  Safe to call on every load — it upserts.
 */
export async function ensureAppUser(): Promise<AppUser> {
  const sessionId = getSessionId();

  // Try to read first.
  const { data: existing } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (existing) return existing as AppUser;

  // Create a new row for this session.
  const newUser: AppUser = {
    id: sessionId,
    review_count: 0,
    badges: [],
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('app_users')
    .insert(newUser)
    .select('*')
    .maybeSingle();

  if (error) {
    // If another tab created it in the race window, just read it.
    const { data: retry } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (retry) return retry as AppUser;
    throw error;
  }

  return data as AppUser;
}

/**
 * Award a badge to the current session's user (if they don't already have it).
 * Also increments review_count by 1.
 */
export async function awardBadge(
  sessionId: string,
  badge: string,
  incrementReviewCount: boolean,
): Promise<AppUser | null> {
  // Read current state.
  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (!user) return null;

  const currentBadges: string[] = user.badges ?? [];
  const newBadges = currentBadges.includes(badge)
    ? currentBadges
    : [...currentBadges, badge];

  const newReviewCount = incrementReviewCount
    ? (user.review_count ?? 0) + 1
    : user.review_count;

  const { data, error } = await supabase
    .from('app_users')
    .update({ badges: newBadges, review_count: newReviewCount })
    .eq('id', sessionId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Failed to award badge:', error);
    return null;
  }

  return data as AppUser;
}

/** Get the top N contributors by review_count, for the leaderboard. */
export async function getTopContributors(limit = 10): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('review_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load contributors:', error);
    return [];
  }

  return (data ?? []) as AppUser[];
}
