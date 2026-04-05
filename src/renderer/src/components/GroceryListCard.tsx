import type { ReactNode } from "react";

type GroceryListCardProps = {
  name: string;
  itemCount: number;
  totalLabel: string;
  subtitle: string;
  children: ReactNode;
};

export function GroceryListCard({
  name,
  itemCount,
  totalLabel,
  subtitle,
  children,
}: GroceryListCardProps) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,20,0.98),rgba(10,10,12,1))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Grocery list</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{name}</h3>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{itemCount} items</p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">{totalLabel}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
