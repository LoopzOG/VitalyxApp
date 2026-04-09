import { Bell, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import type { SessionUser } from "@/lib/storage";

type HeaderProps = {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  user: SessionUser;
};

export function Header({ title, subtitle, searchValue, onSearchChange, searchPlaceholder, user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(10,10,12,0.9)] px-4 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[28rem] flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-emerald-300/80">
              <Sparkles size={14} />
              Vitalyx
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.045] text-zinc-300"
            >
              <Bell size={18} />
            </button>
            <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-emerald-400 px-3 text-sm font-semibold text-zinc-950">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>

        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder ?? "Search meals, recipes, lifts, staples..."}
        />
      </div>
    </header>
  );
}
