import { foodCatalog, type FoodCatalogItem, type MacroProfile, type PortionUnit } from "@/data";

export type MacroEstimate = {
  food: FoodCatalogItem;
  macros: MacroProfile | null;
  message: string;
};

export function parseNumber(value: string) {
  return Number.parseFloat(value) || 0;
}

export function parseMacroString(value: string) {
  return Number.parseFloat(value.replace(/[^\d.]/g, "")) || 0;
}

export function formatMacro(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}g`;
}

export function findBestFoodMatch(query: string) {
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

export function estimateMacros(title: string, amount: string, unit: PortionUnit): MacroEstimate | null {
  const food = findBestFoodMatch(title);
  if (!food) {
    return null;
  }

  const ratio = convertRatio(parseNumber(amount), unit, food);
  if (!ratio) {
    return {
      food,
      macros: null,
      message: `Detected ${food.name}. Use ${food.unit} for the best estimate.`,
    };
  }

  return {
    food,
    macros: {
      calories: food.macrosPerDefault.calories * ratio,
      protein: food.macrosPerDefault.protein * ratio,
      carbs: food.macrosPerDefault.carbs * ratio,
      fat: food.macrosPerDefault.fat * ratio,
    },
    message: `Auto-detected from ${food.name} using ${amount} ${unit}.`,
  };
}
