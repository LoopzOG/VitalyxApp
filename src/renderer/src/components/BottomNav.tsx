import { Home, LayoutGrid, Dumbbell, Ellipsis } from "lucide-react";

export type MobileTab = "home" | "meals" | "track" | "more";

type BottomNavProps = {
  activeTab: MobileTab;
  onNavigate: (tab: MobileTab) => void;
};

const items: { key: MobileTab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "meals", label: "Meals", icon: LayoutGrid },
  { key: "track", label: "Track", icon: Dumbbell },
  { key: "more", label: "More", icon: Ellipsis },
];

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-2">
      <div className="mx-auto w-full max-w-[28rem] rounded-[28px] border border-white/10 bg-[rgba(15,15,18,0.94)] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <nav className="grid grid-cols-4 gap-2">
          {items.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeTab;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onNavigate(key)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 text-center ${
                  isActive ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"
                }`}
              >
                <Icon size={18} />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
