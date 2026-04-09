import { getOpenFoodFactsNutrition } from "../../src/renderer/src/lib/openFoodFacts";

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

type LookupResponse = {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  suggestedUnit: "piece";
  sourceLabel: string;
};

type SerpApiSearchResponse = {
  organic_results?: Array<{
    product_id?: string;
    us_item_id?: string;
    title?: string;
    primary_offer?: {
      offer_id?: string;
    };
  }>;
  error?: string;
};

type SerpApiProductResponse = {
  product_result?: {
    upc?: string;
    title?: string;
    brand?: string;
    category_path?: string;
  };
  error?: string;
};

const SERPAPI_BASE_URL = "https://serpapi.com/search.json";

function cleanBarcode(value: string) {
  return value.replace(/[^\d]/g, "");
}

async function fetchSerpApiJson<T>(params: Record<string, string>) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const url = new URL(SERPAPI_BASE_URL);
  Object.entries({
    ...params,
    api_key: apiKey,
    device: "mobile",
    no_cache: "true",
    output: "json",
  }).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`SerpApi Walmart request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as T & { error?: string };
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

async function fetchWalmartFallback(barcode: string): Promise<LookupResponse | null> {
  const searchPayload = await fetchSerpApiJson<SerpApiSearchResponse>({
    engine: "walmart",
    query: barcode,
  });

  const topResult = searchPayload?.organic_results?.[0];
  const productId = topResult?.product_id || topResult?.us_item_id;
  if (!productId) {
    return null;
  }

  const detailPayload = await fetchSerpApiJson<SerpApiProductResponse>({
    engine: "walmart_product",
    product_id: productId,
  });

  const product = detailPayload?.product_result;
  const title = product?.title?.trim() || topResult?.title?.trim();
  if (!title) {
    return null;
  }

  return {
    barcode: cleanBarcode(product?.upc || barcode),
    name: title,
    brand: product?.brand?.trim() || undefined,
    category: product?.category_path?.split("/").map((value) => value.trim()).filter(Boolean).at(-1),
    suggestedUnit: "piece",
    sourceLabel: "Walmart via SerpApi",
  };
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
    const openFoodFacts = await getOpenFoodFactsNutrition(barcode).catch(() => null);
    if (openFoodFacts) {
      return res.status(200).json({
        barcode: openFoodFacts.barcode,
        name: openFoodFacts.name,
        brand: openFoodFacts.brand,
        category: openFoodFacts.category,
        suggestedUnit: "piece",
        sourceLabel: "Open Food Facts",
      } satisfies LookupResponse);
    }

    const walmartFallback = await fetchWalmartFallback(barcode).catch(() => null);
    if (walmartFallback) {
      return res.status(200).json(walmartFallback);
    }

    return res.status(404).json({ error: "No UPC match found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPC lookup failed.";
    return res.status(500).json({ error: message });
  }
}
