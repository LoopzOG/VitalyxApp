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

  return {
    name,
    barcode,
    servingSize: product.serving_size?.trim() || undefined,
    calories: pickNutrient(nutriments, "energy-kcal_serving", "energy-kcal_100g"),
    carbs: pickNutrient(nutriments, "carbohydrates_serving", "carbohydrates_100g"),
    fat: pickNutrient(nutriments, "fat_serving", "fat_100g"),
    protein: pickNutrient(nutriments, "proteins_serving", "proteins_100g"),
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
