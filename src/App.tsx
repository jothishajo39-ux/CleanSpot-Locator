import { useState, useEffect, useCallback } from 'react';
import { BottomNav, type PageId } from '@/components/BottomNav';
import { MapPage } from '@/pages/MapPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { ensureAppUser } from '@/lib/session';

// ---------------------------------------------------------------------------
// App — top-level shell with simple page routing.
//
// We don't use a router library (react-router etc.) because the app has
// only 3 pages and a bottom nav.  `currentPage` state drives which page
// renders.  This keeps the code small and easy to walk through in a viva.
//
// On first load we call ensureAppUser() to create the anonymous session
// row in Supabase (needed for review_count / badges / leaderboard).
// ---------------------------------------------------------------------------

export default function App() {
  const [page, setPage] = useState<PageId>('map');

  useEffect(() => {
    ensureAppUser().catch((e) => {
      console.warn('Could not initialize app user:', e);
    });
  }, []);

  const handleNavigate = useCallback((p: PageId) => setPage(p), []);

  return (
    <div className="min-h-screen bg-offwhite">
      {page === 'map' && <MapPage />}
      {page === 'leaderboard' && <LeaderboardPage />}
      {page === 'dashboard' && <DashboardPage />}
      <BottomNav current={page} onNavigate={handleNavigate} />
    </div>
  );
}
