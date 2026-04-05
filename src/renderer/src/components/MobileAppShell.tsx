import type { ReactNode } from "react";
import { BottomNav, type MobileTab } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import type { SessionUser } from "@/lib/storage";

type MobileAppShellProps = {
  activeTab: MobileTab;
  onNavigate: (tab: MobileTab) => void;
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  user: SessionUser;
  children: ReactNode;
};

export function MobileAppShell({
  activeTab,
  onNavigate,
  title,
  subtitle,
  searchValue,
  onSearchChange,
  user,
  children,
}: MobileAppShellProps) {
  return (
    <div className="app-surface min-h-screen bg-transparent text-zinc-50">
      <div className="mx-auto min-h-screen max-w-md">
        <Header
          title={title}
          subtitle={subtitle}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          user={user}
        />

        <main className="px-4 pb-28 pt-5">
          <div key={activeTab} className="page-flow">
            {children}
          </div>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
