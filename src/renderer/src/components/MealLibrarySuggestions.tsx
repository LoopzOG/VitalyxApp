import { useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, Loader2, Tag } from "lucide-react";
import {
  searchOpenFoodFactsByName,
  type OpenFoodFactsNutritionEntry,
} from "@/lib/openFoodFacts";

type MealLibrarySuggestionsProps = {
  query: string;
  onPick: (entry: OpenFoodFactsNutritionEntry) => void;
  className?: string;
};

const MAX_VISIBLE = 8;
const MAX_BRANDS = 12;

export function MealLibrarySuggestions({
  query,
  onPick,
  className = "",
}: MealLibrarySuggestionsProps) {
  const [results, setResults] = useState<OpenFoodFactsNutritionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [showBrands, setShowBrands] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setError(null);
      setLoading(false);
      setBrandFilter(null);
      setShowBrands(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await searchOpenFoodFactsByName(trimmed, {
          signal: controller.signal,
          pageSize: 30,
        });
        if (!controller.signal.aborted) {
          setResults(found);
          setBrandFilter(null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of results) {
      const brand = entry.brand?.trim();
      if (!brand) continue;
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_BRANDS);
  }, [results]);

  const visibleResults = useMemo(() => {
    const filtered = brandFilter
      ? results.filter((entry) => entry.brand?.trim() === brandFilter)
      : results;
    return filtered.slice(0, MAX_VISIBLE);
  }, [results, brandFilter]);

  if (query.trim().length < 2) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin text-emerald-300" />
              <span>Searching the meal library…</span>
            </>
          ) : (
            <span>
              {results.length
                ? `${results.length} match${results.length === 1 ? "" : "es"} from the public meal library`
                : "No matches yet"}
            </span>
          )}
        </div>
        {brands.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowBrands((value) => !value)}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-zinc-200 hover:border-emerald-400/40 hover:text-white"
          >
            <Tag size={12} />
            {showBrands ? "Hide brands" : `Brands (${brands.length})`}
          </button>
        ) : null}
      </div>

      {showBrands && brands.length > 0 ? (
        <div className="rounded-[20px] border border-white/10 bg-zinc-950/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Filter by brand</p>
            {brandFilter ? (
              <button
                type="button"
                onClick={() => setBrandFilter(null)}
                className="text-[11px] text-emerald-300 hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.map(([brand, count]) => {
              const isActive = brand === brandFilter;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setBrandFilter(isActive ? null : brand)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    isActive
                      ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                      : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-emerald-400/40"
                  }`}
                >
                  {brand}
                  <span className="ml-1 text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      {visibleResults.length > 0 ? (
        <ul className="space-y-2">
          {visibleResults.map((entry, index) => (
            <li key={`${entry.barcode || "noupc"}-${index}`}>
              <button
                type="button"
                onClick={() => onPick(entry)}
                className="flex w-full items-start gap-3 rounded-[20px] border border-white/10 bg-black/20 p-3 text-left transition hover:border-emerald-400/40 hover:bg-emerald-400/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  {entry.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt={entry.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageOff size={16} className="text-zinc-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                  <p className="mt-1 truncate text-[11px] text-zinc-400">
                    {entry.brand ? `${entry.brand} • ` : ""}
                    {entry.servingSize || "Serving size unknown"}
                    {entry.calories != null ? ` • ${Math.round(entry.calories)} kcal` : ""}
                  </p>
                  {entry.barcode ? (
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
                      UPC {entry.barcode}
                    </p>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
