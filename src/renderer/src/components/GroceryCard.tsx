type GroceryCardProps = {
  item: string;
  price: string;
  trend: string;
  store?: string;
  category?: string;
};

export function GroceryCard({ item, price, trend, store, category }: GroceryCardProps) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,27,0.95),rgba(13,13,16,0.98))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{item}</p>
          <p className="mt-1 text-sm text-zinc-400">{[category, store].filter(Boolean).join(" • ")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-emerald-300">{price}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">{trend}</p>
        </div>
      </div>
    </div>
  );
}
