import { PriceConfidenceIndicator } from "@/components/PriceConfidenceIndicator";
import type { PriceRecord } from "@/lib/groceryTypes";

type PriceHistoryCardProps = {
  itemName: string;
  storeName: string;
  records: PriceRecord[];
};

export function PriceHistoryCard({ itemName, storeName, records }: PriceHistoryCardProps) {
  const maxPrice = Math.max(...records.map((record) => record.price), 1);

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{itemName}</p>
          <p className="mt-1 text-sm text-zinc-400">{storeName} price trend</p>
        </div>
        <PriceConfidenceIndicator score={records.at(-1)?.confidenceScore ?? 0} />
      </div>

      {records.length ? (
        <div className="mt-4 space-y-3">
          <div className="flex h-24 items-end gap-2">
            {records.map((record) => (
              <div key={record.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-2xl bg-emerald-400/70"
                  style={{ height: `${Math.max((record.price / maxPrice) * 100, 16)}%` }}
                />
                <span className="text-[11px] text-zinc-500">
                  {new Date(record.checkedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {records.map((record) => (
              <div key={`${record.id}-meta`} className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-2">
                <p className="text-sm font-medium text-white">${record.price.toFixed(2)}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{record.quantitySize ?? "latest check"}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          No price history yet for this store.
        </div>
      )}
    </div>
  );
}
