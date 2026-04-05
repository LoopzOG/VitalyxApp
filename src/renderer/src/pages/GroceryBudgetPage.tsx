import { useEffect, useMemo, useState } from "react";
import {
  budgetRows as initialBudgetRows,
  budgetSummary,
  storeComparison as initialStoreComparison,
  type BudgetRow,
} from "@/data";
import { BudgetCard } from "@/components/BudgetCard";
import { SectionCard } from "@/components/SectionCard";
import { listenForPageActions } from "@/lib/pageActions";

function exportRows(rows: BudgetRow[]) {
  const header = "Item,Category,Store,Price,Trend";
  const body = rows.map((row) => [row.item, row.category, row.store, row.price, row.trend].join(","));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "grocery-budget.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function GroceryBudgetPage() {
  const [rows, setRows] = useState<BudgetRow[]>(initialBudgetRows);
  const [sortBySpend, setSortBySpend] = useState(false);
  const [status, setStatus] = useState("Use Add Price to log a new entry or Export CSV to download the table.");

  const stores = useMemo(() => {
    const list = [...initialStoreComparison];
    if (sortBySpend) {
      list.sort((left, right) => Number.parseFloat(left.spend.slice(1)) - Number.parseFloat(right.spend.slice(1)));
    }
    return list;
  }, [sortBySpend]);

  function addPrice() {
    setRows((current) => [
      {
        item: `Protein Powder ${current.length - initialBudgetRows.length + 1}`,
        category: "Supplements",
        store: "Online",
        price: "$1.98/serving",
        trend: "New",
      },
      ...current,
    ]);
    setStatus("Added a fresh price row to the tracker.");
  }

  function compareStores() {
    setSortBySpend((current) => !current);
    setStatus("Toggled the store comparison order by spend.");
  }

  function exportCsv() {
    exportRows(rows);
    setStatus("Downloaded the grocery budget table as CSV.");
  }

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "grocery-budget") {
          return;
        }
        if (action === "add-price") {
          addPrice();
        }
        if (action === "compare-stores") {
          compareStores();
        }
      }),
    [rows],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {budgetSummary.map((item) => (
          <BudgetCard key={item.label} {...item} />
        ))}
      </section>

      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
        {status}
      </div>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          eyebrow="Price Tracking"
          title="Staple ingredient pricing"
          action={
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Export CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Store</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {rows.map((row) => (
                  <tr key={`${row.item}-${row.store}`}>
                    <td className="py-4 text-white">{row.item}</td>
                    <td className="py-4 text-zinc-300">{row.category}</td>
                    <td className="py-4 text-zinc-300">{row.store}</td>
                    <td className="py-4 text-emerald-300">{row.price}</td>
                    <td className="py-4 text-zinc-400">{row.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard eyebrow="Store Comparison" title="Best current options">
            <div className="space-y-3">
              {stores.map((store, index) => (
                <div
                  key={store.store}
                  className={`rounded-2xl border p-4 ${
                    sortBySpend && index === 0 ? "border-emerald-400/35 bg-emerald-400/8" : "border-white/10 bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{store.store}</p>
                    <span className="text-sm font-medium text-emerald-300">{store.spend}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{store.note}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Trend Cards" title="Ingredient cost movement">
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.slice(0, 4).map((row) => (
                <div key={`${row.item}-trend`} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                  <p className="text-sm text-zinc-400">{row.category}</p>
                  <p className="mt-2 font-medium text-white">{row.item}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-emerald-300">{row.price}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{row.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
