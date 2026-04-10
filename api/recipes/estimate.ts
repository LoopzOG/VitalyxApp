import { foodCatalog, type FoodCatalogItem, type PortionUnit } from "../../src/renderer/src/data";

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

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type RecipeEstimateResponse = {
  title: string;
  sourceUrl: string;
  servingAmount: number;
  servingUnit: "serving";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidenceScore: number;
  estimatedFrom: "schema-nutrition" | "ingredients";
  matchedIngredients?: number;
  totalIngredients?: number;
};

type ParsedRecipeContent = {
  title: string;
  servings?: number;
  ingredients: string[];
  nutrition?: {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
  };
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n"),
  )
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean)
    .join("\n");
}

function toOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeUnit(rawUnit?: string): PortionUnit {
  const normalized = (rawUnit ?? "serving").toLowerCase();
  if (normalized === "cups") return "cup";
  if (normalized === "pieces") return "piece";
  if (normalized === "servings") return "serving";
  if (normalized === "tablespoon" || normalized === "tablespoons" || normalized === "tbsp.") return "tbsp";
  if (normalized === "ounce" || normalized === "ounces") return "oz";
  return ["g", "oz", "serving", "cup", "tbsp", "piece"].includes(normalized)
    ? (normalized as PortionUnit)
    : "serving";
}

function parseYield(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = Number.parseFloat(match[1]);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    }
  }

  return 1;
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function roundCalories(value: number) {
  return Math.round(value);
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

function parseIngredient(ingredient: string) {
  const cleaned = cleanText(
    ingredient
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/,/g, " ")
      .replace(/\bof\b/g, " "),
  );

  const compacted = cleaned
    .replace(/^(\d+)\s+(\d+)\/(\d+)\b/, (_, whole, numerator, denominator) =>
      `${Number(whole) + Number(numerator) / Number(denominator)}`,
    )
    .replace(/\bpackage\b/g, "package")
    .replace(/\bpounds?\b/g, "oz");

  const match = compacted.match(
    /^(?<amount>\d+(?:\.\d+)?|\d+\/\d+)?\s*(?<unit>g|gram|grams|oz|ounce|ounces|cup|cups|tbsp|tablespoon|tablespoons|piece|pieces|package)?\s*(?<food>.+)$/i,
  );

  if (!match?.groups?.food) {
    return null;
  }

  const rawAmount = match.groups.amount?.trim();
  const amount = rawAmount?.includes("/")
    ? (() => {
        const [numerator, denominator] = rawAmount.split("/").map(Number);
        return denominator ? numerator / denominator : 1;
      })()
    : Number.parseFloat(rawAmount ?? "1") || 1;

  return {
    amount,
    unit: normalizeUnit(match.groups.unit),
    foodName: cleanText(match.groups.food),
  };
}

function extractBetween(text: string, startMarker: string, endMarker: string) {
  const startIndex = text.indexOf(startMarker);
  if (startIndex < 0) {
    return "";
  }

  const fromStart = text.slice(startIndex + startMarker.length);
  const endIndex = fromStart.indexOf(endMarker);
  return endIndex >= 0 ? fromStart.slice(0, endIndex) : fromStart;
}

function parseHtmlFallback(html: string, url: URL): ParsedRecipeContent | null {
  const text = htmlToText(html);
  if (!text) {
    return null;
  }

  const titleMatch =
    text.match(/#?\s*([^\n]+?)\n(?:\d+(?:\.\d+)?\n)?(?:\(\d+\)\n)?\d+\s+Reviews/i) ??
    text.match(/([^\n]+)\nPrep Time:/i);
  const title = cleanText(titleMatch?.[1] ?? url.hostname.replace(/^www\./, ""));

  const servingsMatch =
    text.match(/Servings:\s*(\d+(?:\.\d+)?)/i) ??
    text.match(/Servings Per Recipe\s*(\d+(?:\.\d+)?)/i) ??
    text.match(/yields\s*(\d+(?:\.\d+)?)\s*servings?/i);
  const servings = servingsMatch ? Number.parseFloat(servingsMatch[1]) : undefined;

  const ingredientsBlock = extractBetween(text, "Ingredients", "Directions");
  const ingredients = ingredientsBlock
    .split("\n")
    .map((line) => cleanText(line.replace(/^[*•-]\s*/, "")))
    .filter((line) => {
      if (!line) {
        return false;
      }

      if (/^(1\/2x|1x|2x|oops!|this recipe was developed)/i.test(line)) {
        return false;
      }

      return /^\d/.test(line);
    });

  const nutritionFactsMatch = text.match(
    /Nutrition Facts \(per serving\)\s*(\d+(?:\.\d+)?)\s*Calories\s*(\d+(?:\.\d+)?)g\s*Fat\s*(\d+(?:\.\d+)?)g\s*Carbs\s*(\d+(?:\.\d+)?)g\s*Protein/i,
  );

  const nutrition = nutritionFactsMatch
    ? {
        calories: Number.parseFloat(nutritionFactsMatch[1]),
        fat: Number.parseFloat(nutritionFactsMatch[2]),
        carbs: Number.parseFloat(nutritionFactsMatch[3]),
        protein: Number.parseFloat(nutritionFactsMatch[4]),
      }
    : undefined;

  if (!title && !ingredients.length && !nutrition) {
    return null;
  }

  return {
    title: title || url.hostname.replace(/^www\./, ""),
    servings,
    ingredients,
    nutrition,
  };
}

function extractJsonLdBlocks(html: string) {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  return matches
    .map((block) => {
      const contentMatch = block.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      return contentMatch?.[1]?.trim() ?? "";
    })
    .filter(Boolean);
}

function flattenJsonLd(value: unknown): Array<Record<string, unknown>> {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenJsonLd(entry));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const graphEntries = Array.isArray(record["@graph"]) ? flattenJsonLd(record["@graph"]) : [];
    return [record, ...graphEntries];
  }

  return [];
}

function findRecipeSchema(html: string) {
  const blocks = extractJsonLdBlocks(html);

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block);
      const entries = flattenJsonLd(parsed);
      const recipe = entries.find((entry) => {
        const type = entry["@type"];
        if (typeof type === "string") {
          return type.toLowerCase() === "recipe";
        }

        if (Array.isArray(type)) {
          return type.some((item) => typeof item === "string" && item.toLowerCase() === "recipe");
        }

        return false;
      });

      if (recipe) {
        return recipe;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getRecipeTitle(recipe: Record<string, unknown>, html: string, url: URL) {
  const directName = typeof recipe.name === "string" ? cleanText(recipe.name) : "";
  if (directName) {
    return directName;
  }

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1] ? cleanText(titleMatch[1]) : "";
  return title || url.hostname.replace(/^www\./, "");
}

function estimateFromIngredients(recipe: Record<string, unknown>) {
  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient.filter((entry): entry is string => typeof entry === "string" && cleanText(entry).length > 0)
    : [];

  const servings = parseYield(recipe.recipeYield);
  const totals: MacroTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  let matchedIngredients = 0;

  for (const ingredient of ingredients) {
    const parsed = parseIngredient(ingredient);
    if (!parsed) {
      continue;
    }

    const food = findFood(parsed.foodName);
    if (!food) {
      continue;
    }

    const ratio = convertRatio(parsed.amount, parsed.unit, food);
    if (!ratio) {
      continue;
    }

    matchedIngredients += 1;
    totals.calories += food.macrosPerDefault.calories * ratio;
    totals.protein += food.macrosPerDefault.protein * ratio;
    totals.carbs += food.macrosPerDefault.carbs * ratio;
    totals.fat += food.macrosPerDefault.fat * ratio;
  }

  if (!matchedIngredients) {
    return null;
  }

  return {
    servingAmount: 1,
    servingUnit: "serving" as const,
    calories: roundCalories(totals.calories / servings),
    protein: roundMacro(totals.protein / servings),
    carbs: roundMacro(totals.carbs / servings),
    fat: roundMacro(totals.fat / servings),
    confidenceScore: Math.max(0.45, Math.min(0.84, matchedIngredients / Math.max(ingredients.length, 1))),
    estimatedFrom: "ingredients" as const,
    matchedIngredients,
    totalIngredients: ingredients.length,
  };
}

function estimateFromParsedIngredients(parsedRecipe: ParsedRecipeContent) {
  const ingredients = parsedRecipe.ingredients;
  const servings = parsedRecipe.servings && parsedRecipe.servings > 0 ? parsedRecipe.servings : 1;
  const totals: MacroTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  let matchedIngredients = 0;

  for (const ingredient of ingredients) {
    const parsed = parseIngredient(ingredient);
    if (!parsed) {
      continue;
    }

    const food = findFood(parsed.foodName);
    if (!food) {
      continue;
    }

    const ratio = convertRatio(parsed.amount, parsed.unit, food);
    if (!ratio) {
      continue;
    }

    matchedIngredients += 1;
    totals.calories += food.macrosPerDefault.calories * ratio;
    totals.protein += food.macrosPerDefault.protein * ratio;
    totals.carbs += food.macrosPerDefault.carbs * ratio;
    totals.fat += food.macrosPerDefault.fat * ratio;
  }

  if (!matchedIngredients) {
    return null;
  }

  return {
    servingAmount: 1,
    servingUnit: "serving" as const,
    calories: roundCalories(totals.calories / servings),
    protein: roundMacro(totals.protein / servings),
    carbs: roundMacro(totals.carbs / servings),
    fat: roundMacro(totals.fat / servings),
    confidenceScore: Math.max(0.42, Math.min(0.8, matchedIngredients / Math.max(ingredients.length, 1))),
    estimatedFrom: "ingredients" as const,
    matchedIngredients,
    totalIngredients: ingredients.length,
  };
}

function estimateFromParsedNutrition(parsedRecipe: ParsedRecipeContent) {
  const nutrition = parsedRecipe.nutrition;
  if (!nutrition) {
    return null;
  }

  return {
    servingAmount: 1,
    servingUnit: "serving" as const,
    calories: roundCalories(nutrition.calories ?? 0),
    protein: roundMacro(nutrition.protein ?? 0),
    carbs: roundMacro(nutrition.carbs ?? 0),
    fat: roundMacro(nutrition.fat ?? 0),
    confidenceScore: 0.92,
    estimatedFrom: "schema-nutrition" as const,
  };
}

function estimateFromSchemaNutrition(recipe: Record<string, unknown>) {
  const nutrition = recipe.nutrition;
  if (!nutrition || typeof nutrition !== "object") {
    return null;
  }

  const record = nutrition as Record<string, unknown>;
  const calories = toOptionalNumber(record.calories);
  const protein = toOptionalNumber(record.proteinContent);
  const carbs = toOptionalNumber(record.carbohydrateContent);
  const fat = toOptionalNumber(record.fatContent);

  if ([calories, protein, carbs, fat].every((value) => value == null)) {
    return null;
  }

  return {
    servingAmount: 1,
    servingUnit: "serving" as const,
    calories: roundCalories(calories ?? 0),
    protein: roundMacro(protein ?? 0),
    carbs: roundMacro(carbs ?? 0),
    fat: roundMacro(fat ?? 0),
    confidenceScore: 0.9,
    estimatedFrom: "schema-nutrition" as const,
  };
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "GET") {
    res.setHeader?.("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const urlInput = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const sourceUrl = String(urlInput ?? "").trim();

  if (!sourceUrl) {
    return res.status(400).json({ error: "A recipe URL is required." });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return res.status(400).json({ error: "Enter a valid recipe URL." });
  }

  if (!/^https?:$/i.test(parsedUrl.protocol)) {
    return res.status(400).json({ error: "Only http and https recipe URLs are supported." });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Vitalyx recipe importer/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Recipe page request failed with status ${response.status}.`);
    }

    const html = await response.text();
    const recipe = findRecipeSchema(html);
    const parsedRecipe = recipe ? null : parseHtmlFallback(html, parsedUrl);

    if (!recipe && !parsedRecipe) {
      return res.status(404).json({ error: "No recipe data was found on that page." });
    }

    const title = recipe
      ? getRecipeTitle(recipe, html, parsedUrl)
      : parsedRecipe?.title ?? parsedUrl.hostname.replace(/^www\./, "");
    const schemaEstimate = recipe
      ? estimateFromSchemaNutrition(recipe)
      : estimateFromParsedNutrition(parsedRecipe!);
    const ingredientEstimate = recipe
      ? estimateFromIngredients(recipe)
      : estimateFromParsedIngredients(parsedRecipe!);
    const estimate = schemaEstimate ?? ingredientEstimate;

    if (!estimate) {
      return res.status(422).json({ error: "Recipe data was found, but there was not enough nutrition or ingredient detail to estimate macros." });
    }

    return res.status(200).json({
      title,
      sourceUrl: parsedUrl.toString(),
      ...estimate,
    } satisfies RecipeEstimateResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to estimate this recipe right now.";
    return res.status(500).json({ error: message });
  }
}
