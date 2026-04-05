import { ChevronRight } from "lucide-react";
import { PriceBadge } from "@/components/PriceBadge";
import { PriceConfidenceIndicator } from "@/components/PriceConfidenceIndicator";
import type { GroceryListItem } from "@/lib/groceryTypes";

type GroceryTrackedItemRowProps = {
  item: GroceryListItem;
  bestPriceLabel: string;
  bestStoreLabel: string;
  lastUpdatedLabel: string;
  hasMatch: boolean;
  onSelect: () => void;
};

type GroceryLegacyRowProps = {
  item: string;
  price: string;
  trend: string;
  store?: string;
  category?: string;
};

type GroceryItemRowProps = GroceryTrackedItemRowProps | GroceryLegacyRowProps;

export function GroceryItemRow(props: GroceryItemRowProps) {
  if ("price" in props) {
    return (
      <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-white">{props.item}</p>
            <p className="mt-1 text-sm text-zinc-400">{[props.category, props.store].filter(Boolean).join(" | ")}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-emerald-300">{props.price}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">{props.trend}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    item,
    bestPriceLabel,
    bestStoreLabel,
    lastUpdatedLabel,
    hasMatch,
    onSelect,
  } = props;
  const topConfidence = item.latestPrices[0]?.confidenceScore ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{item.name}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {item.quantity} {item.unit}
            {item.brand ? ` | ${item.brand}` : ""}
            {item.preferredStore ? ` | prefers ${item.preferredStore}` : ""}
          </p>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-zinc-500" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriceBadge label={hasMatch ? bestPriceLabel : "No price match"} tone={hasMatch ? "success" : "muted"} />
        <PriceBadge label={bestStoreLabel} tone="default" />
        <PriceBadge label={lastUpdatedLabel} tone="muted" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <PriceConfidenceIndicator score={topConfidence} />
        <span className="text-xs text-zinc-500">{hasMatch ? "Tap for store detail" : "Try a clearer item name"}</span>
      </div>
    </button>
  );
}
