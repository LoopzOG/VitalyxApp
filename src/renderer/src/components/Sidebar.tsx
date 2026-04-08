import {
  BarChart3,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Target,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PageKey } from "@/data";
import type { SessionUser } from "@/lib/storage";
import { LogoMark } from "@/components/LogoMark";

const navItems: { key: PageKey; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "meal-planner", label: "Meal Planner", icon: ClipboardList },
  { key: "recipes", label: "Recipes", icon: ChefHat },
  { key: "workout-tracker", label: "Workout Tracker", icon: Target },
  { key: "progress", label: "Progress", icon: BarChart3 },
  { key: "grocery-budget", label: "Grocery Budget", icon: Wallet },
  { key: "shopping-list", label: "Shopping List", icon: ShoppingCart },
  { key: "settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  user: SessionUser;
  onSignOut: () => void;
};

export function Sidebar({ activePage, onNavigate, user, onSignOut }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-white/8 bg-black/20 xl:flex xl:flex-col">
        <div className="border-b border-white/8 p-6">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(132,204,22,0.16),rgba(16,18,22,0.94)_58%)] px-2.5 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(163,230,53,0.14),transparent_62%)]" />
              <LogoMark className="relative h-auto w-24" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/80">Vitalyx</p>
              <h1 className="mt-1 text-lg font-semibold text-white">Meals & Training OS</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4 text-sm">
          {navItems.map(({ key, label, icon: Icon }) => {
            const isActive = key === activePage;

            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  isActive
                    ? "bg-emerald-400 font-semibold text-zinc-950 shadow-lg shadow-emerald-500/10"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-zinc-400">Account</p>
            <p className="mt-2 text-lg font-semibold text-white">{user.name}</p>
            <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
            {user.role === "admin" ? (
              <div className="mt-3 inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Admin session
              </div>
            ) : null}
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
              <Receipt size={16} />
              Data saved per user
            </div>
            <button
              onClick={onSignOut}
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-2 py-2 backdrop-blur xl:hidden">
        <nav className="grid grid-cols-4 gap-2">
          {navItems.map(({ key, label, icon: Icon }) => {
            const isActive = key === activePage;

            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-medium ${
                  isActive ? "bg-emerald-400 text-zinc-950" : "text-zinc-300"
                }`}
              >
                <Icon size={18} />
                <span className="leading-tight">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
