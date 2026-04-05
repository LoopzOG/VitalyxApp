import { PriceBadge } from "@/components/PriceBadge";
import { TotalCostCard } from "@/components/TotalCostCard";

type GroceryDashboardWidgetProps = {
  weeklyEstimate: number;
  cheapestStore: string;
  cheapestTotal: number;
  stapleChanges: { item: string; change: string }[];
};

export function GroceryDashboardWidget({
  weeklyEstimate,
  cheapestStore,
  cheapestTotal,
  stapleChanges,
}: GroceryDashboardWidgetProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TotalCostCard
          label="Weekly spend"
          value={`$${weeklyEstimate.toFixed(2)}`}
          detail="Estimated from your active grocery list"
        />
        <TotalCostCard
          label="Best store"
          value={cheapestStore}
          detail={`Current full-cart estimate $${cheapestTotal.toFixed(2)}`}
          highlight
        />
      </div>

      <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
        <p className="text-sm font-medium text-white">Staple price changes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {stapleChanges.map((item) => (
            <PriceBadge key={item.item} label={`${item.item} ${item.change}`} tone={item.change.startsWith("-") ? "success" : "muted"} />
          ))}
        </div>
      </div>
    </div>
  );
}
