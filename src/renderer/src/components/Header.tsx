import { Sparkles, UserRound } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import type { SessionUser } from "@/lib/storage";

type HeaderProps = {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  user: SessionUser;
  onOpenPremium: () => void;
  onOpenProfile: () => void;
};

export function Header({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  user,
  onOpenPremium,
  onOpenProfile,
}: HeaderProps) {
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
              onClick={onOpenPremium}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"
            >
              Premium
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-3 text-sm font-semibold text-zinc-950"
              aria-label="Open profile"
            >
              <UserRound size={14} />
              <span>{user.name.slice(0, 1).toUpperCase()}</span>
            </button>
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
