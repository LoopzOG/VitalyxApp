import { useState } from "react";
import { mockStores } from "@/lib/groceryMockData";
import type { GroceryListItem, GroceryUnit } from "@/lib/groceryTypes";

type ManualPriceFormProps = {
  item: GroceryListItem;
  onSave: (input: {
    storeName: string;
    price: number;
    sizeAmount: number;
    unit: GroceryUnit;
    note?: string;
  }) => void;
};

export function ManualPriceForm({ item, onSave }: ManualPriceFormProps) {
  const [storeName, setStoreName] = useState(item.preferredStore ?? mockStores[0]);
  const [price, setPrice] = useState("");
  const [sizeAmount, setSizeAmount] = useState(String(item.quantity || 1));
  const [unit, setUnit] = useState<GroceryUnit>(item.unit);
  const [note, setNote] = useState("");

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <div className="mb-4">
        <p className="text-sm font-medium text-white">Manual price update</p>
        <p className="mt-1 text-sm text-zinc-400">Add your own store check to improve the current estimate.</p>
      </div>

      <div className="space-y-3">
        <select
          value={storeName}
          onChange={(event) => setStoreName(event.target.value)}
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          {mockStores.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            placeholder="Price"
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
          <input
            value={sizeAmount}
            onChange={(event) => setSizeAmount(event.target.value)}
            inputMode="decimal"
            placeholder="Size"
            className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
        </div>

        <select
          value={unit}
          onChange={(event) => setUnit(event.target.value as GroceryUnit)}
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          {["lb", "dozen", "bag", "tub", "head", "piece", "cup", "oz", "serving"].map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Optional note"
          className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />

        <button
          type="button"
          onClick={() => {
            const parsedPrice = Number.parseFloat(price);
            const parsedSize = Number.parseFloat(sizeAmount);
            if (!storeName || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isFinite(parsedSize) || parsedSize <= 0) {
              return;
            }
            onSave({
              storeName,
              price: parsedPrice,
              sizeAmount: parsedSize,
              unit,
              note: note.trim() || undefined,
            });
            setPrice("");
            setNote("");
          }}
          className="w-full rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
        >
          Save price update
        </button>
      </div>
    </div>
  );
}
