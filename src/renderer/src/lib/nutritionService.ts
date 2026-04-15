import { foodCatalog, type FoodCatalogItem, type PortionUnit } from "@/data";
import {
  getOpenFoodFactsNutrition,
  type OpenFoodFactsNutritionEntry,
} from "@/lib/openFoodFacts";

export type NutritionSource = "openfoodfacts" | "search" | "photo";

export type NutritionEntry = {
  id: string;
  foodName: string;
  servingAmount: number;
  servingUnit: PortionUnit;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  source: NutritionSource;
  confidenceScore: number;
  isEstimate?: boolean;
};

type ParsedSearch = {
  amount: number;
  unit: PortionUnit;
  foodName: string;
};

function uid() {
  return crypto.randomUUID();
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function roundCalories(value: number) {
  return Math.round(value);
}

function parseServingSize(servingSize?: string) {
  if (!servingSize) {
    return null;
  }

  const match = servingSize.trim().toLowerCase().match(
    /(?<amount>\d+(?:\.\d+)?)\s*(?<unit>g|oz|serving|servings|cup|cups|tbsp|piece|pieces)/i,
  );

  if (!match?.groups) {
    return null;
  }

  const rawUnit = match.groups.unit.toLowerCase();
  const normalizedUnit =
    rawUnit === "servings"
      ? "serving"
      : rawUnit === "cups"
        ? "cup"
        : rawUnit === "pieces"
          ? "piece"
          : (rawUnit as PortionUnit);

  return {
    amount: Number.parseFloat(match.groups.amount) || 1,
    unit: normalizedUnit,
  };
}

function convertRatio(amount: number, unit: PortionUnit, food: FoodCatalogItem) {
  if (amount <= 0) {
    return null;
  }
  if (unit === food.unit) {
    return amount / food.defaultAmount;
  }
  if (unit === "g" && food.unit === "oz") {
    return amount / 28.35 / food.defaultAmount;
  }
  if (unit === "oz" && food.unit === "g") {
    return amount * 28.35 / food.defaultAmount;
  }
  return null;
}

function findFood(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    foodCatalog.find(
      (food) =>
        food.name.toLowerCase() === normalized || food.aliases.some((alias) => alias.toLowerCase() === normalized),
    ) ??
    foodCatalog.find(
      (food) =>
        food.name.toLowerCase().includes(normalized) ||
        normalized.includes(food.name.toLowerCase()) ||
        food.aliases.some(
          (alias) => alias.toLowerCase().includes(normalized) || normalized.includes(alias.toLowerCase()),
        ),
    ) ??
    null
  );
}

function entryFromFood(
  food: FoodCatalogItem,
  amount: number,
  unit: PortionUnit,
  source: NutritionSource,
  confidenceScore: number,
  isEstimate = false,
): NutritionEntry | null {
  const ratio = convertRatio(amount, unit, food);
  if (!ratio) {
    return null;
  }

  return {
    id: uid(),
    foodName: food.name,
    servingAmount: amount,
    servingUnit: unit,
    calories: roundCalories(food.macrosPerDefault.calories * ratio),
    carbs: roundMacro(food.macrosPerDefault.carbs * ratio),
    fat: roundMacro(food.macrosPerDefault.fat * ratio),
    protein: roundMacro(food.macrosPerDefault.protein * ratio),
    source,
    confidenceScore,
    isEstimate,
  };
}

function parseNaturalLanguage(query: string): ParsedSearch {
  const trimmed = query.trim().toLowerCase();
  const match = trimmed.match(
    /^(?<amount>\d+(?:\.\d+)?)\s*(?<unit>g|oz|serving|servings|cup|cups|tbsp|piece|pieces)?\s*(?<food>.+)$/i,
  );

  if (!match?.groups) {
    return {
      amount: 1,
      unit: "serving",
      foodName: query.trim(),
    };
  }

  const rawUnit = (match.groups.unit ?? "serving").toLowerCase();
  const normalizedUnit =
    rawUnit === "servings"
      ? "serving"
      : rawUnit === "cups"
        ? "cup"
        : rawUnit === "pieces"
          ? "piece"
          : (rawUnit as PortionUnit);

  return {
    amount: Number.parseFloat(match.groups.amount ?? "1") || 1,
    unit: normalizedUnit,
    foodName: (match.groups.food ?? query).trim(),
  };
}

function mockPhotoLabels(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.includes("breakfast")) {
    return [
      { name: "Egg whites", amount: 150, unit: "g" as PortionUnit },
      { name: "Oats", amount: 40, unit: "g" as PortionUnit },
      { name: "Banana", amount: 1, unit: "piece" as PortionUnit },
    ];
  }

  if (normalized.includes("rice") || normalized.includes("bowl")) {
    return [
      { name: "Chicken breast", amount: 6, unit: "oz" as PortionUnit },
      { name: "White rice", amount: 1, unit: "cup" as PortionUnit },
      { name: "Broccoli", amount: 100, unit: "g" as PortionUnit },
    ];
  }

  return [
    { name: "Chicken breast", amount: 4, unit: "oz" as PortionUnit },
    { name: "White rice", amount: 1, unit: "cup" as PortionUnit },
    { name: "Avocado", amount: 50, unit: "g" as PortionUnit },
  ];
}

export class NutritionService {
  async fromBarcode(barcode: string): Promise<NutritionEntry | null> {
    const cleanBarcode = barcode.replace(/[^\d]/g, "");
    if (!cleanBarcode) {
      return null;
    }

    const product = await getOpenFoodFactsNutrition(cleanBarcode);
    if (!product) {
      return null;
    }

    const parsedServing = parseServingSize(product.servingSize);

    return {
      id: uid(),
      foodName: product.name,
      servingAmount: parsedServing?.amount ?? 1,
      servingUnit: parsedServing?.unit ?? "serving",
      calories: roundCalories(product.calories ?? 0),
      carbs: roundMacro(product.carbs ?? 0),
      fat: roundMacro(product.fat ?? 0),
      protein: roundMacro(product.protein ?? 0),
      source: "openfoodfacts",
      confidenceScore: product.calories != null || product.carbs != null || product.fat != null || product.protein != null ? 0.96 : 0.7,
    };
  }

  async fromSearch(query: string): Promise<NutritionEntry | null> {
    const parsed = parseNaturalLanguage(query);
    const food = findFood(parsed.foodName);

    if (!food) {
      return null;
    }

    return entryFromFood(food, parsed.amount, parsed.unit, "search", 0.88);
  }

  fromOpenFoodFactsEntry(product: OpenFoodFactsNutritionEntry): NutritionEntry {
    const parsedServing = parseServingSize(product.servingSize);
    const hasNutrition =
      product.calories != null || product.carbs != null || product.fat != null || product.protein != null;
    const displayName = product.brand ? `${product.brand} ${product.name}` : product.name;

    return {
      id: uid(),
      foodName: displayName,
      servingAmount: parsedServing?.amount ?? 1,
      servingUnit: parsedServing?.unit ?? "serving",
      calories: roundCalories(product.calories ?? 0),
      carbs: roundMacro(product.carbs ?? 0),
      fat: roundMacro(product.fat ?? 0),
      protein: roundMacro(product.protein ?? 0),
      source: "openfoodfacts",
      confidenceScore: hasNutrition ? 0.94 : 0.7,
      isEstimate: !hasNutrition,
    };
  }

  async fromPhoto(image: File): Promise<NutritionEntry[]> {
    const labels = mockPhotoLabels(image.name);

    return labels
      .map((label) => {
        const food = findFood(label.name);
        if (!food) {
          return null;
        }
        return entryFromFood(food, label.amount, label.unit, "photo", 0.62, true);
      })
      .filter((entry): entry is NutritionEntry => Boolean(entry));
  }
}

export const nutritionService = new NutritionService();
