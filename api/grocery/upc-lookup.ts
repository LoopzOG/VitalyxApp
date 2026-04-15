import { getOpenFoodFactsNutrition } from "../../src/renderer/src/lib/openFoodFacts";
import { lookupOpenNutritionBarcode } from "./openNutrition";
import { getOpenPricesPriceRecords, getOpenPricesProduct, type OpenPricesLookupPriceRecord } from "./openPrices";
import { readUpcCache, writeUpcCache } from "./upcCache";
import { fetchUpcItemDb } from "./upcItemDb";
import { fetchOpenBeautyFacts } from "./openBeautyFacts";

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
  latestPrices?: OpenPricesLookupPriceRecord[];
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
    // ── Tier 1: Supabase cache + live prices in parallel ──────────────────
    // Cache stores product identity; prices are always fetched fresh.
    const [cached, openPricesPrices] = await Promise.all([
      readUpcCache(barcode).catch(() => null),
      getOpenPricesPriceRecords(barcode).catch(() => []),
    ]);

    if (cached) {
      return res.status(200).json({
        barcode: cached.barcode,
        name: cached.name,
        brand: cached.brand,
        category: cached.category,
        suggestedUnit: "piece",
        sourceLabel: cached.sourceLabel,
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    // ── Tier 2: Open Food Facts + Open Prices product in parallel ─────────
    const [openFoodFacts, openPricesProduct] = await Promise.all([
      getOpenFoodFactsNutrition(barcode).catch(() => null),
      getOpenPricesProduct(barcode).catch(() => null),
    ]);

    if (openFoodFacts) {
      const sourceLabel = openPricesPrices.length ? "Open Food Facts + Open Prices" : "Open Food Facts";
      writeUpcCache({ barcode: openFoodFacts.barcode, name: openFoodFacts.name, brand: openFoodFacts.brand, category: openFoodFacts.category, sourceLabel: "Open Food Facts" });
      return res.status(200).json({
        barcode: openFoodFacts.barcode,
        name: openFoodFacts.name,
        brand: openFoodFacts.brand,
        category: openFoodFacts.category,
        suggestedUnit: "piece",
        sourceLabel,
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    if (openPricesProduct?.code && (openPricesProduct.product_name || openPricesPrices.length)) {
      const name = openPricesProduct.product_name?.trim() || openPricesPrices[0]?.itemName || `UPC ${openPricesProduct.code}`;
      const brand = openPricesProduct.brands?.split(",")[0]?.trim() || undefined;
      const category = openPricesProduct.categories_tags?.[0]?.split(":").at(-1)?.replace(/-/g, " ");
      writeUpcCache({ barcode: openPricesProduct.code, name, brand, category, sourceLabel: "Open Prices" });
      return res.status(200).json({
        barcode: openPricesProduct.code,
        name,
        brand,
        category,
        suggestedUnit: "piece",
        sourceLabel: "Open Prices",
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    // ── Tier 3: Open Beauty Facts (cosmetics, personal care, supplements) ──
    const openBeautyFacts = await fetchOpenBeautyFacts(barcode).catch(() => null);
    if (openBeautyFacts) {
      writeUpcCache({ barcode, name: openBeautyFacts.name, brand: openBeautyFacts.brand, category: openBeautyFacts.category, sourceLabel: "Open Beauty Facts" });
      return res.status(200).json({
        barcode,
        name: openBeautyFacts.name,
        brand: openBeautyFacts.brand,
        category: openBeautyFacts.category,
        suggestedUnit: "piece",
        sourceLabel: "Open Beauty Facts",
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    // ── Tier 4: UPCitemdb (general consumer goods) ────────────────────────
    const upcItemDb = await fetchUpcItemDb(barcode).catch(() => null);
    if (upcItemDb) {
      writeUpcCache({ barcode, name: upcItemDb.name, brand: upcItemDb.brand, category: upcItemDb.category, sourceLabel: "UPCitemdb" });
      return res.status(200).json({
        barcode,
        name: upcItemDb.name,
        brand: upcItemDb.brand,
        category: upcItemDb.category,
        suggestedUnit: "piece",
        sourceLabel: "UPCitemdb",
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    // ── Tier 5: OpenNutrition MCP (optional, configured via env) ──────────
    const openNutrition = await lookupOpenNutritionBarcode(barcode).catch(() => null);
    if (openNutrition) {
      writeUpcCache({ barcode, name: openNutrition.name, brand: openNutrition.brand, category: openNutrition.category, sourceLabel: "OpenNutrition" });
      return res.status(200).json({
        ...openNutrition,
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    // ── Tier 6: Walmart via SerpApi (last resort) ─────────────────────────
    const walmartFallback = await fetchWalmartFallback(barcode).catch(() => null);
    if (walmartFallback) {
      writeUpcCache({ barcode: walmartFallback.barcode, name: walmartFallback.name, brand: walmartFallback.brand, category: walmartFallback.category, sourceLabel: "Walmart via SerpApi" });
      return res.status(200).json({
        ...walmartFallback,
        latestPrices: openPricesPrices,
      } satisfies LookupResponse);
    }

    return res.status(404).json({ error: "No UPC match found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPC lookup failed.";
    return res.status(500).json({ error: message });
  }
}
