import { Map, Trophy, BarChart3 } from 'lucide-react';

// ---------------------------------------------------------------------------
// BottomNav — mobile-first navigation between the three pages.
// Sits fixed at the bottom; used on all screen sizes.
// ---------------------------------------------------------------------------

export type PageId = 'map' | 'leaderboard' | 'dashboard';

interface BottomNavProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Map }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'leaderboard', label: 'Leaders', icon: Trophy },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-navy border-t border-navy-700 shadow-lg">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-mint-400' : 'text-navy-100 hover:text-white'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
