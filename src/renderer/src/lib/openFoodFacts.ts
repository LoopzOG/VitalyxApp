export type OpenFoodFactsNutritionEntry = {
  name: string;
  barcode: string;
  servingSize?: string;
  calories?: number;
  carbs?: number;
  fat?: number;
  protein?: number;
  source: "openfoodfacts";
};

type OpenFoodFactsProductResponse = {
  code?: string;
  product?: {
    product_name?: string;
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
  status?: number;
  status_verbose?: string;
};

type OpenFoodFactsNutriments = NonNullable<NonNullable<OpenFoodFactsProductResponse["product"]>["nutriments"]>;

const OPEN_FOOD_FACTS_BASE_URL = "https://world.openfoodfacts.net/api/v2/product";
const OPEN_FOOD_FACTS_FIELDS = "code,product_name,serving_size,nutriments";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

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

function hasServingNutrients(nutriments: OpenFoodFactsNutriments | undefined): boolean {
  return (
    toOptionalNumber(nutriments?.["energy-kcal_serving"]) != null ||
    toOptionalNumber(nutriments?.["carbohydrates_serving"]) != null ||
    toOptionalNumber(nutriments?.["fat_serving"]) != null ||
    toOptionalNumber(nutriments?.["proteins_serving"]) != null
  );
}

export async function fetchOpenFoodFactsProduct(barcode: string): Promise<OpenFoodFactsProductResponse | null> {
  const cleanBarcode = barcode.replace(/[^\d]/g, "");
  if (!cleanBarcode) {
    return null;
  }

  const url = new URL(`${OPEN_FOOD_FACTS_BASE_URL}/${cleanBarcode}`);
  url.searchParams.set("fields", OPEN_FOOD_FACTS_FIELDS);

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Open Food Facts request failed with status ${response.status}`);
      }
      const payload = (await response.json()) as OpenFoodFactsProductResponse;
      if (payload.status === 0 || !payload.product) {
        return null;
      }
      return payload;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Barcode lookup timed out. Check your connection and try again.");
      }
      lastError = error;
      if (attempt >= MAX_RETRIES) {
        throw lastError;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

export function mapOpenFoodFactsProductToNutritionEntry(
  payload: OpenFoodFactsProductResponse,
): OpenFoodFactsNutritionEntry | null {
  const product = payload.product;
  const barcode = payload.code?.trim();
  const name = product?.product_name?.trim();

  if (!barcode || !name || !product) {
    return null;
  }

  const nutriments = product.nutriments;

  // Only use per-serving nutrients when the product actually has them — if we fall
  // back to _100g values we must also set the serving size to "100g" so the numbers
  // shown to the user match what they represent.
  const useServing = hasServingNutrients(nutriments);
  const servingSize = useServing ? (product.serving_size?.trim() || undefined) : "100g";

  return {
    name,
    barcode,
    servingSize,
    calories: useServing
      ? pickNutrient(nutriments, "energy-kcal_serving", "energy-kcal_100g")
      : toOptionalNumber(nutriments?.["energy-kcal_100g"]),
    carbs: useServing
      ? pickNutrient(nutriments, "carbohydrates_serving", "carbohydrates_100g")
      : toOptionalNumber(nutriments?.["carbohydrates_100g"]),
    fat: useServing
      ? pickNutrient(nutriments, "fat_serving", "fat_100g")
      : toOptionalNumber(nutriments?.["fat_100g"]),
    protein: useServing
      ? pickNutrient(nutriments, "proteins_serving", "proteins_100g")
      : toOptionalNumber(nutriments?.["proteins_100g"]),
    source: "openfoodfacts",
  };
}

export async function getOpenFoodFactsNutrition(barcode: string): Promise<OpenFoodFactsNutritionEntry | null> {
  const payload = await fetchOpenFoodFactsProduct(barcode);
  if (!payload) {
    return null;
  }

  return mapOpenFoodFactsProductToNutritionEntry(payload);
}
