import {
  Barcode,
  Camera,
  ChevronDown,
  Search,
  ScanLine,
  Trash2,
} from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { PlannerMeal, PortionUnit } from "@/data";
import type { NutritionEntry } from "@/lib/nutritionService";

export type LoggingMethod = "barcode" | "search" | "photo";

type NutritionLoggerProps = {
  dayLabel: string;
  loggingMethod: LoggingMethod;
  onLoggingMethod: (method: LoggingMethod) => void;
  barcodeValue: string;
  onBarcodeValue: (value: string) => void;
  onOpenBarcodeScanner: () => void;
  searchValue: string;
  onSearchValue: (value: string) => void;
  photoLabel: string;
  onRunLookup: () => void;
  onOpenPhotoPicker: () => void;
  pendingEntries: NutritionEntry[];
  onEntryChange: (entryId: string, field: keyof NutritionEntry, value: string) => void;
  onSaveEntries: () => void;
  onCancelEntries: () => void;
  feedback: string | null;
  editingMealId: string | null;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: PlannerMeal[];
  onEditMeal: (mealId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  renderMealCard: (meal: PlannerMeal) => React.ReactNode;
};

const units: PortionUnit[] = ["g", "oz", "serving", "cup", "tbsp", "piece"];

function methodLabel(method: LoggingMethod) {
  if (method === "barcode") return "Scan Barcode";
  if (method === "search") return "Search Food";
  return "Snap Photo";
}

function sourceLabel(source: NutritionEntry["source"]) {
  if (source === "openfoodfacts") return "Open Food Facts";
  if (source === "search") return "Search";
  return "Photo estimate";
}

export function NutritionLogger({
  dayLabel,
  loggingMethod,
  onLoggingMethod,
  barcodeValue,
  onBarcodeValue,
  onOpenBarcodeScanner,
  searchValue,
  onSearchValue,
  photoLabel,
  onRunLookup,
  onOpenPhotoPicker,
  pendingEntries,
  onEntryChange,
  onSaveEntries,
  onCancelEntries,
  feedback,
  editingMealId,
  totals,
  meals,
  onEditMeal,
  onRemoveMeal,
  renderMealCard,
}: NutritionLoggerProps) {
  return (
    <>
      <SectionCard
        eyebrow="Add food"
        title={`${dayLabel} nutrition logging`}
        action={
          pendingEntries.length ? (
            <button
              type="button"
              onClick={onCancelEntries}
              className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-zinc-200"
            >
              Cancel
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
            {([
              { key: "barcode", icon: Barcode, label: "Scan Barcode" },
              { key: "search", icon: Search, label: "Search Food" },
              { key: "photo", icon: Camera, label: "Snap Photo" },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onLoggingMethod(key)}
                className={`rounded-[22px] px-3 py-3 text-left ${
                  loggingMethod === key
                    ? "bg-emerald-400 text-zinc-950"
                    : "border border-white/10 bg-white/[0.04] text-zinc-200"
                }`}
              >
                <Icon size={16} />
                <p className="mt-2 text-xs font-medium leading-5">{label}</p>
              </button>
            ))}
          </div>

          {loggingMethod === "barcode" ? (
            <div className="space-y-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Barcode</span>
                <input
                  value={barcodeValue}
                  onChange={(event) => onBarcodeValue(event.target.value)}
                  inputMode="numeric"
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="012345678905"
                />
              </label>
              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200"
              >
                <ScanLine size={16} />
                Open live scanner
              </button>
              <button
                type="button"
                onClick={onRunLookup}
                className="w-full rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                Detect packaged food
              </button>
            </div>
          ) : null}

          {loggingMethod === "search" ? (
            <div className="space-y-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">Search food</span>
                <input
                  value={searchValue}
                  onChange={(event) => onSearchValue(event.target.value)}
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  placeholder="2 eggs, 6 oz chicken breast, 1 cup rice"
                />
              </label>
              <button
                type="button"
                onClick={onRunLookup}
                className="w-full rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                Detect from search
              </button>
            </div>
          ) : null}

          {loggingMethod === "photo" ? (
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                {photoLabel || "Upload or capture a meal photo to create editable nutrition estimates."}
              </div>
              <button
                type="button"
                onClick={onOpenPhotoPicker}
                className="w-full rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                Analyze meal photo
              </button>
            </div>
          ) : null}

          <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {feedback ??
              "Detected nutrition is always editable before saving. Photo results are estimates and should be reviewed."}
          </div>
        </div>
      </SectionCard>

      {pendingEntries.length ? (
        <SectionCard eyebrow="Confirm detected nutrition" title={`${methodLabel(loggingMethod)} results`}>
          <div className="space-y-4">
            {pendingEntries.map((entry) => (
              <div
                key={entry.id}
                className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.04] p-4"
              >
                <div className="space-y-3">
                  <div className="min-w-0 rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
                    <p className="truncate font-medium text-white">{entry.foodName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        {sourceLabel(entry.source)}
                      </span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                        {Math.round(entry.confidenceScore * 100)}% confidence
                      </span>
                      {entry.isEstimate ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                          Estimate
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                    <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Calories</p>
                      <p className="mt-1 text-base font-semibold text-white">{entry.calories}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Protein</p>
                      <p className="mt-1 text-base font-semibold text-white">{entry.protein}g</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Carbs</p>
                      <p className="mt-1 text-base font-semibold text-white">{entry.carbs}g</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Fat</p>
                      <p className="mt-1 text-base font-semibold text-white">{entry.fat}g</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex min-w-0 flex-col gap-2">
                    <span className="text-sm font-medium text-white">Food name</span>
                    <input
                      value={entry.foodName}
                      onChange={(event) => onEntryChange(entry.id, "foodName", event.target.value)}
                      className="w-full min-w-0 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    />
                  </label>
                  <label className="flex min-w-0 flex-col gap-2">
                    <span className="text-sm font-medium text-white">Serving</span>
                    <div className="grid w-full min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-0 rounded-[22px] border border-white/10 bg-black/20 p-2">
                      <input
                        value={String(entry.servingAmount)}
                        onChange={(event) => onEntryChange(entry.id, "servingAmount", event.target.value)}
                        inputMode="decimal"
                        className="w-full min-w-0 rounded-[16px] border border-transparent bg-transparent px-3 py-3 text-center text-white outline-none"
                      />
                      <div className="min-w-0 border-l border-white/10 pl-1">
                        <div className="relative">
                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                          />
                          <select
                            value={entry.servingUnit}
                            onChange={(event) => onEntryChange(entry.id, "servingUnit", event.target.value)}
                            className="block w-full min-w-0 appearance-none rounded-[16px] border border-transparent bg-transparent px-3 py-3 pr-9 text-white outline-none"
                          >
                            {units.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">Calories</span>
                    <input
                      value={String(entry.calories)}
                      onChange={(event) => onEntryChange(entry.id, "calories", event.target.value)}
                      inputMode="decimal"
                      className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">Protein (g)</span>
                    <input
                      value={String(entry.protein)}
                      onChange={(event) => onEntryChange(entry.id, "protein", event.target.value)}
                      inputMode="decimal"
                      className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">Carbs (g)</span>
                    <input
                      value={String(entry.carbs)}
                      onChange={(event) => onEntryChange(entry.id, "carbs", event.target.value)}
                      inputMode="decimal"
                      className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">Fat (g)</span>
                    <input
                      value={String(entry.fat)}
                      onChange={(event) => onEntryChange(entry.id, "fat", event.target.value)}
                      inputMode="decimal"
                      className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    />
                  </label>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-3 min-[360px]:flex-row">
              <button
                type="button"
                onClick={onSaveEntries}
                className="flex-1 rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                {editingMealId
                  ? "Save detected food"
                  : `Save ${pendingEntries.length} entr${pendingEntries.length === 1 ? "y" : "ies"}`}
              </button>
              <button
                type="button"
                onClick={onCancelEntries}
                className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-zinc-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Daily totals" title={`${dayLabel} macros`}>
        <div className="mb-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Calories</p>
            <p className="mt-2 text-xl font-semibold text-white">{totals.calories}</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Protein</p>
            <p className="mt-2 text-xl font-semibold text-white">{Math.round(totals.protein)}g</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Carbs</p>
            <p className="mt-2 text-xl font-semibold text-white">{Math.round(totals.carbs)}g</p>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Fat</p>
            <p className="mt-2 text-xl font-semibold text-white">{Math.round(totals.fat)}g</p>
          </div>
        </div>

        {meals.length ? (
          <div className="space-y-3">
            {meals.map((meal) => {
              const mealId = meal.id ?? meal.title;
              return (
                <div key={mealId} className="space-y-2">
                  {renderMealCard(meal)}
                  <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => onEditMeal(mealId)}
                      className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"
                    >
                      Edit food
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveMeal(mealId)}
                      className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
                    >
                      <Trash2 size={16} />
                      Remove food
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
            This day is completely blank until you scan, search, or snap your own food.
          </div>
        )}
      </SectionCard>
    </>
  );
}
