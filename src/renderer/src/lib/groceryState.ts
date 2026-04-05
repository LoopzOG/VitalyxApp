import type { GroceryList, GroceryListItem, PriceRecord } from "@/lib/groceryTypes";

function uid() {
  return crypto.randomUUID();
}

export function createInitialGroceryLists(): GroceryList[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      name: "Weekly grocery list",
      createdAt: now,
      updatedAt: now,
      items: [],
    },
  ];
}

export function normalizeGroceryLists(value: GroceryList[] | null | undefined): GroceryList[] {
  if (!value?.length) {
    return createInitialGroceryLists();
  }

  return value.map((list) => ({
    id: list.id ?? uid(),
    name: list.name?.trim() || "Weekly grocery list",
    createdAt: list.createdAt ?? new Date().toISOString(),
    updatedAt: list.updatedAt ?? new Date().toISOString(),
    items: (list.items ?? []).map((item) => normalizeGroceryItem(item)),
  }));
}

export function normalizeManualPriceRecords(value: PriceRecord[] | null | undefined) {
  return (value ?? []).map((record) => ({
    ...record,
    id: record.id ?? uid(),
    checkedAt: record.checkedAt ?? new Date().toISOString(),
    source: record.source ?? "manual",
  }));
}

function normalizeGroceryItem(item: GroceryListItem): GroceryListItem {
  return {
    ...item,
    id: item.id ?? uid(),
    normalizedName: item.normalizedName ?? item.name.trim().toLowerCase(),
    quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
    unit: item.unit ?? "piece",
    pricingMode: item.pricingMode ?? (item.barcode ? "item" : "unit"),
    latestPrices: normalizeManualPriceRecords(item.latestPrices),
  };
}
