import { useEffect, useMemo, useState } from "react";
import { shoppingGroups, type ShoppingGroup } from "@/data";
import { SectionCard } from "@/components/SectionCard";
import { listenForPageActions } from "@/lib/pageActions";

function parseCurrency(value: string) {
  return Number.parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
}

export function ShoppingListPage() {
  const [groups, setGroups] = useState<ShoppingGroup[]>(() =>
    shoppingGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item })),
    })),
  );
  const [status, setStatus] = useState("Tap any item to mark it for checkout.");

  const totals = useMemo(() => {
    const itemCount = groups.reduce((sum, group) => sum + group.items.length, 0);
    const estimatedTotal = groups.reduce((sum, group) => sum + parseCurrency(group.totalCost), 0);
    return {
      itemCount,
      estimatedTotal,
    };
  }, [groups]);

  function toggleItem(category: string, itemName: string) {
    setGroups((current) =>
      current.map((group) =>
        group.category === category
          ? {
              ...group,
              items: group.items.map((item) =>
                item.name === itemName ? { ...item, checked: !item.checked } : item,
              ),
            }
          : group,
      ),
    );
  }

  function addItem() {
    setGroups((current) =>
      current.map((group, index) =>
        index === 0
          ? {
              ...group,
              items: [
                ...group.items,
                {
                  name: `Protein add-on ${group.items.length + 1}`,
                  amount: "1 pack",
                  source: "Quick add",
                  checked: false,
                },
              ],
            }
          : group,
      ),
    );
    setStatus("Added a quick item to the Protein group.");
  }

  function clearChecked() {
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.checked),
      })),
    );
    setStatus("Removed checked items from the shopping list.");
  }

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "shopping-list") {
          return;
        }
        if (action === "add-item") {
          addItem();
        }
        if (action === "clear-checked") {
          clearChecked();
        }
      }),
    [],
  );

  return (
    <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard
        eyebrow="Shopping List"
        title="Meal-plan generated ingredients"
        action={
          <button
            type="button"
            onClick={addItem}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Add Item
          </button>
        }
      >
        <div className="mb-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {status}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {groups.map((group) => (
            <div key={group.category} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{group.category}</p>
                  <p className="text-sm text-zinc-400">{group.items.length} items</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">
                  {group.totalCost}
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleItem(group.category, item.name)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left"
                  >
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-md border ${
                        item.checked ? "border-emerald-400 bg-emerald-400" : "border-white/15 bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {item.amount} • {item.source}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="space-y-6">
        <SectionCard eyebrow="Cost Summary" title="Checkout overview">
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-sm text-zinc-400">Estimated total</p>
              <p className="mt-2 text-3xl font-semibold text-white">${totals.estimatedTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-sm text-zinc-400">Auto-generated from meal plan</p>
              <p className="mt-2 text-3xl font-semibold text-white">{totals.itemCount} items</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Planner Link" title="Notes">
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm leading-7 text-zinc-400">
            This panel is ready for pantry deduction, quick substitutions, and store-specific sorting without changing the list structure.
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
