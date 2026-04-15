export type OpenFoodFactsNutritionEntry = {
  name: string;
  barcode: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: string;
  calories?: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  source: "openfoodfacts";
};

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  image_small_url?: string;
  image_url?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
    proteins_100g?: number;
    proteins_serving?: number;
  };
};

type OpenFoodFactsProductResponse = {
  code?: string;
  product?: OpenFoodFactsProduct;
  status?: number;
  status_verbose?: string;
};

type OpenFoodFactsSearchResponse = {
  count?: number;
  page?: number;
  page_size?: number;
  products?: OpenFoodFactsProduct[];
};

type OpenFoodFactsNutriments = NonNullable<OpenFoodFactsProduct["nutriments"]>;

const OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.net/api/v2/product";
const OPEN_FOOD_FACTS_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const OPEN_FOOD_FACTS_FIELDS = "code,product_name,brands,serving_size,nutriments,image_front_small_url,image_front_url,image_small_url,image_url";

function toOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function pickNutrient(
  nutriments: OpenFoodFactsNutriments | undefined,
  servingKey: keyof OpenFoodFactsNutriments,
  per100gKey: keyof OpenFoodFactsNutriments,
) {
  return toOptionalNumber(nutriments?.[servingKey]) ?? toOptionalNumber(nutriments?.[per100gKey]);
}

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<OpenFoodFactsProductResponse | null> {
  const cleanBarcode = barcode.replace(/[^\d]/g, "");
  if (!cleanBarcode) {
    return null;
  }

  const url = new URL(`${OPEN_FOOD_FACTS_BASE_URL}/${cleanBarcode}`);
  url.searchParams.set("fields", OPEN_FOOD_FACTS_FIELDS);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Open Food Facts request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OpenFoodFactsProductResponse;
  if (payload.status === 0 || !payload.product) {
    return null;
  }

  return payload;
}

function productToEntry(product: OpenFoodFactsProduct, barcodeOverride?: string): OpenFoodFactsNutritionEntry | null {
  const barcode = (barcodeOverride ?? product.code ?? "").trim();
  const name = product.product_name?.trim();
  if (!name) {
    return null;
  }

  const nutriments = product.nutriments;
  const imageUrl =
    product.image_front_small_url ||
    product.image_small_url ||
    product.image_front_url ||
    product.image_url ||
    undefined;

  return {
    name,
    barcode,
    brand: product.brands?.split(",")[0]?.trim() || undefined,
    imageUrl,
    servingSize: product.serving_size?.trim() || undefined,
    calories: pickNutrient(nutriments, "energy-kcal_serving", "energy-kcal_100g"),
    carbs: pickNutrient(nutriments, "carbohydrates_serving", "carbohydrates_100g"),
    fat: pickNutrient(nutriments, "fat_serving", "fat_100g"),
    protein: pickNutrient(nutriments, "proteins_serving", "proteins_100g"),
    source: "openfoodfacts",
  };
}

export function mapOpenFoodFactsProductToNutritionEntry(
  payload: OpenFoodFactsProductResponse,
): OpenFoodFactsNutritionEntry | null {
  if (!payload.product) {
    return null;
  }
  const entry = productToEntry(payload.product, payload.code);
  if (!entry || !entry.barcode) {
    return null;
  }
  return entry;
}

export type SearchOpenFoodFactsOptions = {
  pageSize?: number;
  signal?: AbortSignal;
};

export async function searchOpenFoodFactsByName(
  query: string,
  options: SearchOpenFoodFactsOptions = {},
): Promise<OpenFoodFactsNutritionEntry[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL(OPEN_FOOD_FACTS_SEARCH_URL);
  url.searchParams.set("search_terms", trimmed);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(options.pageSize ?? 20));
  url.searchParams.set("fields", OPEN_FOOD_FACTS_FIELDS);

  const response = await fetch(url.toString(), { signal: options.signal });
  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as OpenFoodFactsSearchResponse;
  const products = payload.products ?? [];

  const entries: OpenFoodFactsNutritionEntry[] = [];
  for (const product of products) {
    const entry = productToEntry(product);
    if (entry) {
      entries.push(entry);
    }
  }
  return entries;
}

export async function getOpenFoodFactsNutrition(barcode: string): Promise<OpenFoodFactsNutritionEntry | null> {
  const payload = await fetchOpenFoodFactsProduct(barcode);
  if (!payload) {
    return null;
  }

  return mapOpenFoodFactsProductToNutritionEntry(payload);
}
