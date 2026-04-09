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
  searchPlaceholder?: string;
  user: SessionUser;
  onOpenPremium: () => void;
  onOpenProfile: () => void;
  children: ReactNode;
};

export function MobileAppShell({
  activeTab,
  onNavigate,
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  user,
  onOpenPremium,
  onOpenProfile,
  children,
}: MobileAppShellProps) {
  return (
    <div className="app-surface min-h-screen bg-transparent text-zinc-50">
      <div className="mobile-frame mx-auto min-h-screen w-full">
        <Header
          title={title}
          subtitle={subtitle}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          user={user}
          onOpenPremium={onOpenPremium}
          onOpenProfile={onOpenProfile}
        />

        <main className="px-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pt-5">
          <div key={activeTab} className="page-flow">
            {children}
          </div>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
