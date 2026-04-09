import { getOpenPricesPriceRecords } from "./openPrices";

type RequestLike = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

function cleanBarcode(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "GET") {
    res.setHeader?.("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const barcodeInput = Array.isArray(req.query.barcode) ? req.query.barcode[0] : req.query.barcode;
  const barcode = cleanBarcode(String(barcodeInput ?? ""));

  if (!barcode) {
    return res.status(400).json({ error: "A UPC barcode is required." });
  }

  try {
    const latestPrices = await getOpenPricesPriceRecords(barcode);
    return res.status(200).json({
      barcode,
      latestPrices,
      source: "open-prices",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Open Prices data.";
    return res.status(500).json({ error: message });
  }
}
