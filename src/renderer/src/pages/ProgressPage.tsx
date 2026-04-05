import { useEffect, useState } from "react";
import { chartCards, progressKpis } from "@/data";
import { ChartCard } from "@/components/ChartCard";
import { StatCard } from "@/components/StatCard";
import { listenForPageActions } from "@/lib/pageActions";

const ranges = ["30D", "90D", "6M", "1Y"];

export function ProgressPage() {
  const [selectedRange, setSelectedRange] = useState("90D");
  const [status, setStatus] = useState("Use the range pills or topbar controls to change the chart window.");

  function changeRange(nextRange?: string) {
    setSelectedRange((current) => {
      if (nextRange) {
        return nextRange;
      }
      const index = ranges.indexOf(current);
      return ranges[(index + 1) % ranges.length];
    });
  }

  function exportReport() {
    setStatus(`Prepared a ${selectedRange} report summary for export.`);
  }

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "progress") {
          return;
        }
        if (action === "change-range") {
          changeRange();
        }
        if (action === "export-report") {
          exportReport();
        }
      }),
    [selectedRange],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-zinc-400">Date Range</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Last {selectedRange}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => changeRange(range)}
              className={`rounded-full px-3 py-2 text-sm ${
                range === selectedRange ? "bg-emerald-400 text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
        {status}
      </div>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {progressKpis.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} detail={item.change} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {chartCards.map((chart) => (
          <ChartCard key={chart.title} {...chart} />
        ))}
      </section>
    </div>
  );
}
