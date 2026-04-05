import type { ReactNode } from "react";
import type { PageKey } from "@/data";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import type { SessionUser } from "@/lib/storage";

type AppShellProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  user: SessionUser;
  onSignOut: () => void;
  children: ReactNode;
};

export function AppShell({
  activePage,
  onNavigate,
  title,
  description,
  primaryAction,
  secondaryAction,
  onPrimaryAction,
  onSecondaryAction,
  user,
  onSignOut,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent text-zinc-50">
      <div className="flex min-h-screen">
        <Sidebar activePage={activePage} onNavigate={onNavigate} user={user} onSignOut={onSignOut} />

        <div className="min-w-0 flex-1">
          <Topbar
            title={title}
            description={description}
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
            user={user}
            onPrimaryAction={onPrimaryAction}
            onSecondaryAction={onSecondaryAction}
          />

          <main className="mx-auto flex max-w-[1700px] flex-col gap-6 px-4 py-5 pb-28 sm:px-6 lg:py-6 xl:px-8 xl:pb-6">
            <div key={activePage} className="page-flow">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
