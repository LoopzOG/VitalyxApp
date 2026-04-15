import { useState } from "react";
import { Barcode, ScanLine } from "lucide-react";
import type { GroceryUnit } from "@/lib/groceryTypes";
import { mockStores } from "@/lib/groceryMockData";

type AddItemFormProps = {
  onAdd: (input: {
    name: string;
    quantity: number;
    unit: GroceryUnit;
    barcode?: string;
    brand?: string;
    preferredStore?: string;
  }) => void | Promise<void>;
  onBarcodeLookup: (barcode: string) => Promise<{
    name: string;
    barcode: string;
    brand?: string;
    category?: string;
    suggestedUnit: GroceryUnit;
    sourceLabel: string;
  } | null>;
  isPremiumSubscriber: boolean;
  onUpgradeToPremium: () => void;
  onOpenCamera?: () => void;
};

const units: GroceryUnit[] = ["lb", "dozen", "bag", "tub", "head", "piece", "cup", "oz", "serving"];

export function AddItemForm({ onAdd, onBarcodeLookup, isPremiumSubscriber, onUpgradeToPremium, onOpenCamera }: AddItemFormProps) {
  const [entryMode, setEntryMode] = useState<"name" | "barcode">("name");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<GroceryUnit>("lb");
  const [brand, setBrand] = useState("");
  const [preferredStore, setPreferredStore] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);

  async function runBarcodeLookup() {
    const cleaned = barcode.replace(/[^\d]/g, "");
    if (!cleaned) {
      setBarcodeFeedback("Enter a barcode to look up a grocery item.");
      return;
    }

    setIsLookingUpBarcode(true);
    const result = await onBarcodeLookup(cleaned).catch(() => null);
    setIsLookingUpBarcode(false);

    if (!result) {
      setBarcodeFeedback("No barcode match found yet. You can still save it manually and add store prices.");
      return;
    }

    setName(result.name);
    setBrand(result.brand ?? "");
    setUnit(result.suggestedUnit);
    setBarcode(result.barcode);
    setBarcodeFeedback(`Matched from ${result.sourceLabel}. Review quantity and store before saving.`);
  }

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <div className="mb-4">
        <p className="text-sm font-medium text-white">Add grocery item</p>
        <p className="mt-1 text-sm text-zinc-400">
          Add by food name or barcode so Vitalyx can track pricing across stores. Manual barcode entry stays free, while UPC camera scanning is premium.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEntryMode("name")}
          className={`rounded-[18px] px-3 py-3 text-sm font-medium ${
            entryMode === "name"
              ? "bg-emerald-400 text-zinc-950"
              : "border border-white/10 bg-black/20 text-zinc-200"
          }`}
        >
          Add by name
        </button>
        <button
          type="button"
          onClick={() => setEntryMode("barcode")}
          className={`rounded-[18px] px-3 py-3 text-sm font-medium ${
            entryMode === "barcode"
              ? "bg-emerald-400 text-zinc-950"
              : "border border-white/10 bg-black/20 text-zinc-200"
          }`}
        >
          Add by barcode
        </button>
      </div>

      <div className="space-y-3">
        {entryMode === "barcode" ? (
          <>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="relative">
                <Barcode size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  inputMode="numeric"
                  placeholder="Enter barcode"
                  className="w-full rounded-[20px] border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white outline-none"
                />
              </div>
              <button
                type="button"
                onClick={runBarcodeLookup}
                className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-100"
              >
                Lookup
              </button>
            </div>

            {onOpenCamera ? (
              <button
                type="button"
                onClick={onOpenCamera}
                className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300"
              >
                <ScanLine size={16} />
                Scan with camera
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!isPremiumSubscriber) {
                    setBarcodeFeedback("UPC camera scanning is a premium feature. Manual barcode entry and lookup stay available on the free plan.");
                    onUpgradeToPremium();
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"
              >
                <ScanLine size={16} />
                {isPremiumSubscriber ? "Scan UPC" : "Unlock UPC Scanning"}
              </button>
            )}

            <div className="rounded-[20px] border border-white/8 bg-black/20 p-3 text-sm text-zinc-300">
          {isLookingUpBarcode
                ? "Checking barcode..."
                : barcodeFeedback ?? "Use a packaged food barcode to prefill the grocery item. Manual barcode lookup is free, and premium adds tap-to-scan UPC capture."}
            </div>
          </>
        ) : null}

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={entryMode === "barcode" ? "Product name" : "Chicken breast"}
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />

        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-center text-white outline-none"
          />
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as GroceryUnit)}
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          >
            {units.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>

        <input
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          placeholder="Optional brand"
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />

        <select
          value={preferredStore}
          onChange={(event) => setPreferredStore(event.target.value)}
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          <option value="">Any store</option>
          {mockStores.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={async () => {
            if (!name.trim()) return;
            await onAdd({
              name: name.trim(),
              quantity: Number.parseFloat(quantity) || 1,
              unit,
              barcode: barcode.replace(/[^\d]/g, "") || undefined,
              brand: brand.trim() || undefined,
              preferredStore: preferredStore || undefined,
            });
            setName("");
            setQuantity("1");
            setUnit("lb");
            setBrand("");
            setPreferredStore("");
            setBarcode("");
            setBarcodeFeedback(null);
            setEntryMode("name");
          }}
          className="w-full rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
        >
          Add item
        </button>
      </div>
    </div>
  );
}
