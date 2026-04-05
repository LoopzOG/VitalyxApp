type MealCardProps = {
  id?: string;
  type: string;
  title: string;
  calories: number;
  protein: string;
  carbs?: string;
  fat?: string;
  cost: string;
  amount?: number;
  unit?: string;
  compact?: boolean;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function MealCard({
  type,
  title,
  calories,
  protein,
  carbs,
  fat,
  cost,
  amount,
  unit,
  compact = false,
  showAction = true,
  actionLabel = "Edit",
  onAction,
}: MealCardProps) {
  const metrics = [
    `${calories} cal`,
    protein,
    carbs,
    fat,
    amount && unit ? `${amount} ${unit}` : null,
    cost !== "$0.00" ? cost : null,
  ].filter(Boolean);

  return (
    <div
      className={`rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,27,0.95),rgba(13,13,16,0.98))] ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{type}</p>
          <p className={`font-medium text-white ${compact ? "mt-1 text-sm leading-6" : "mt-2 text-base"}`}>{title}</p>
        </div>
        {showAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className={`flex flex-wrap gap-2 text-sm ${compact ? "mt-3" : "mt-4"}`}>
        {metrics.map((metric) => (
          <span
            key={metric}
            className={`rounded-full px-3 py-1 ${metric === cost && cost !== "$0.00" ? "bg-emerald-400/15 text-emerald-300" : "bg-white/6 text-zinc-300"}`}
          >
            {metric}
          </span>
        ))}
      </div>
    </div>
  );
}
