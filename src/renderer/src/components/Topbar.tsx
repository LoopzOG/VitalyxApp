import { SearchBar } from "@/components/SearchBar";
import { PageHeader } from "@/components/PageHeader";
import type { SessionUser } from "@/lib/storage";

type TopbarProps = {
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  user: SessionUser;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
};

export function Topbar({
  title,
  description,
  primaryAction,
  secondaryAction,
  user,
  onPrimaryAction,
  onSecondaryAction,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1700px] flex-col justify-between gap-4 px-6 py-4 lg:flex-row lg:items-center xl:px-8">
        <PageHeader title={title} description={description} />

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-right lg:block">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Signed in</p>
            <p className="mt-1 text-sm font-medium text-white">{user.name}</p>
            {user.role === "admin" ? (
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-emerald-300">Admin</p>
            ) : null}
          </div>
          <SearchBar />
          {secondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
            >
              {secondaryAction}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPrimaryAction}
            className="rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            {primaryAction}
          </button>
        </div>
      </div>
    </header>
  );
}
