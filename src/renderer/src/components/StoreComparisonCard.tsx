import { PriceBadge } from "@/components/PriceBadge";
import type { PriceComparisonResult } from "@/lib/groceryTypes";

type StoreComparisonCardProps = {
  result: PriceComparisonResult;
  isBest?: boolean;
};

export function StoreComparisonCard({ result, isBest = false }: StoreComparisonCardProps) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        isBest ? "border-emerald-400/25 bg-emerald-400/10" : "border-white/8 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-medium ${isBest ? "text-emerald-100" : "text-white"}`}>{result.storeName}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {result.matchedItems.length} matched
            {result.unmatchedItems.length ? ` | ${result.unmatchedItems.length} missing` : " | full list coverage"}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-semibold ${isBest ? "text-emerald-100" : "text-white"}`}>${result.totalCost.toFixed(2)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {new Date(result.lastUpdated).toLocaleDateString([], { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isBest ? <PriceBadge label="Best full cart" tone="success" /> : null}
        {result.unmatchedItems.length ? (
          <PriceBadge label={`Missing ${result.unmatchedItems.length}`} tone="muted" />
        ) : (
          <PriceBadge label="All items priced" tone="success" />
        )}
      </div>
    </div>
  );
}
