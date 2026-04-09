import { useState } from "react";
import { Barcode, ScanLine } from "lucide-react";
import type { GroceryUnit } from "@/lib/groceryTypes";
import { mockStores } from "@/lib/groceryMockData";
import { LiveBarcodeScanner } from "@/components/LiveBarcodeScanner";

type AddItemFormProps = {
  onAdd: (input: {
    name: string;
    quantity: number;
    unit: GroceryUnit;
    barcode?: string;
    brand?: string;
    category?: string;
    matchedProductId?: string;
    preferredStore?: string;
  }) => void | Promise<void>;
  onBarcodeLookup: (barcode: string) => Promise<{
    name: string;
    barcode: string;
    brand?: string;
    category?: string;
    matchedProductId?: string;
    suggestedUnit: GroceryUnit;
    sourceLabel: string;
  } | null>;
  isPremiumSubscriber: boolean;
  canUseLiveScanner?: boolean;
  canComparePrices?: boolean;
  onUpgradeToPremium: () => void;
  storeOptions?: string[];
};

const units: GroceryUnit[] = ["lb", "dozen", "bag", "tub", "head", "piece", "cup", "oz", "serving"];

export function AddItemForm({
  onAdd,
  onBarcodeLookup,
  isPremiumSubscriber,
  canUseLiveScanner = false,
  canComparePrices = false,
  onUpgradeToPremium,
  storeOptions,
}: AddItemFormProps) {
  const availableStores = storeOptions?.length ? storeOptions : mockStores;
  const [entryMode, setEntryMode] = useState<"name" | "barcode">("name");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<GroceryUnit>("lb");
  const [brand, setBrand] = useState("");
  const [preferredStore, setPreferredStore] = useState("");
  const [barcode, setBarcode] = useState("");
  const [matchedProductId, setMatchedProductId] = useState<string | undefined>(undefined);
  const [detectedCategory, setDetectedCategory] = useState<string | undefined>(undefined);
  const [barcodeFeedback, setBarcodeFeedback] = useState<string | null>(null);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  async function runBarcodeLookup(nextBarcode = barcode) {
    const cleaned = nextBarcode.replace(/[^\d]/g, "");
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
    setMatchedProductId(result.matchedProductId);
    setDetectedCategory(result.category);
    setBarcodeFeedback(`Matched from ${result.sourceLabel}. Review quantity and store before saving.`);
  }

  async function handleLiveBarcodeDetected(detectedBarcode: string) {
    setIsScanningBarcode(true);
    setBarcodeFeedback(`Detected ${detectedBarcode}. Looking up the product now...`);
    setBarcode(detectedBarcode);
    try {
      const result = await onBarcodeLookup(detectedBarcode).catch(() => null);

      if (!result) {
        setBarcodeFeedback("UPC detected, but no product match was found yet. Try another angle, better lighting, or use manual entry.");
        return;
      }

      setName(result.name);
      setBrand(result.brand ?? "");
      setUnit(result.suggestedUnit);
      setBarcode(result.barcode);
      setMatchedProductId(result.matchedProductId);
      setDetectedCategory(result.category);
      setBarcodeFeedback(`Matched from ${result.sourceLabel}. Review quantity and store before saving.`);
    } finally {
      setIsScanningBarcode(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <LiveBarcodeScanner
        open={isScannerOpen}
        onDetected={handleLiveBarcodeDetected}
        onClose={() => {
          setIsScannerOpen(false);
          setIsScanningBarcode(false);
        }}
      />
      <div className="mb-4">
        <p className="text-sm font-medium text-white">Add grocery item</p>
        <p className="mt-1 text-sm text-zinc-400">
          Add groceries by name or UPC barcode, then save your own price checks. Live product scanning is on, while store comparison stays paused until the retailer feed is ready.
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
                  onChange={(event) => {
                    setBarcode(event.target.value);
                    setMatchedProductId(undefined);
                  }}
                  inputMode="numeric"
                  placeholder="Enter barcode"
                  className="w-full rounded-[20px] border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  void runBarcodeLookup();
                }}
                className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-100"
              >
                Lookup
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!canUseLiveScanner) {
                  setBarcodeFeedback("Live UPC scanning is not available on this plan yet. You can still type the barcode manually.");
                  if (!isPremiumSubscriber) {
                    onUpgradeToPremium();
                  }
                  return;
                }

                setBarcodeFeedback("Opening the live UPC scanner...");
                setIsScanningBarcode(true);
                setIsScannerOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"
            >
              <ScanLine size={16} />
              {isScanningBarcode ? "Scanner live..." : canUseLiveScanner ? "Scan UPC Live" : "Unlock UPC Scanning"}
            </button>

            {!canComparePrices ? (
              <div className="rounded-[20px] border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                UPC scanning is enabled for product tracking. Store-by-store price comparison will return once the live retailer feed is connected.
              </div>
            ) : null}

            <div className="rounded-[20px] border border-white/8 bg-black/20 p-3 text-sm text-zinc-300">
          {isScanningBarcode
                ? "Reading the UPC from your live camera..."
                : isLookingUpBarcode
                ? "Checking barcode..."
                : barcodeFeedback ?? "Use a packaged food barcode to prefill the grocery item. Live scanning identifies the product, and manual prices stay available while comparison is paused."}
            </div>
          </>
        ) : null}

        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setMatchedProductId(undefined);
          }}
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
          onChange={(event) => {
            setBrand(event.target.value);
            setMatchedProductId(undefined);
          }}
          placeholder="Optional brand"
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />

        <select
          value={preferredStore}
          onChange={(event) => setPreferredStore(event.target.value)}
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          <option value="">Any store</option>
          {availableStores.map((store) => (
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
              category: detectedCategory,
              matchedProductId,
              preferredStore: preferredStore || undefined,
            });
            setName("");
            setQuantity("1");
            setUnit("lb");
            setBrand("");
            setPreferredStore("");
            setBarcode("");
            setMatchedProductId(undefined);
            setDetectedCategory(undefined);
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
