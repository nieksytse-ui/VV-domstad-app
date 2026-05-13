import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import {
  Home,
  Calendar,
  Users,
  Banknote,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Trophy,
  ClipboardList,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/kalender", label: "Kalender", icon: Calendar },
  { to: "/spelers", label: "Spelers", icon: Users },
  { to: "/boetes", label: "Boetes", icon: Banknote },
  { to: "/prikbord", label: "Prikbord", icon: Megaphone },
  { to: "/statistieken", label: "Statistieken", icon: BarChart3 },
  { to: "/rotatie", label: "Rotatie", icon: RefreshCw },
  { to: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { to: "/opstelling", label: "Opstelling", icon: ClipboardList },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
    isActive
      ? "bg-club-green text-white"
      : "text-gray-400 hover:text-white hover:bg-gray-800"
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center gap-0.5 text-[10px] font-medium transition ${
    isActive ? "text-club-yellow" : "text-gray-500"
  }`;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth();

  const items = isAdmin
    ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: Settings }]
    : NAV_ITEMS;

  // Mobile: show first 5 items
  const mobileItems = [items[0], items[1], items[2], items[3], items[4]];

  return (
    <div className="min-h-screen bg-club-black">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-gray-950 border-r border-gray-800 p-4 z-40">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-club-yellow">v.v. Domstad</h1>
          {profile && (
            <p className="text-xs text-gray-500 mt-1">
              {profile.name} — #{profile.shirt_number}
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800 transition text-sm"
        >
          <LogOut size={18} />
          Uitloggen
        </button>
      </aside>

      {/* Main content */}
      <main className="md:ml-60 pb-20 md:pb-6 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 flex justify-around py-2 px-2 z-40 safe-area-pb">
        {mobileItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={mobileLinkClass}>
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
