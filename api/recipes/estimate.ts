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

type PortionUnit = "g" | "oz" | "serving" | "cup" | "tbsp" | "piece";

type FoodCatalogItem = {
  name: string;
  aliases: string[];
  defaultAmount: number;
  unit: PortionUnit;
  macrosPerDefault: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

const foodCatalog: FoodCatalogItem[] = [
  { name: "Chicken breast", aliases: ["chicken", "grilled chicken", "chicken breast"], defaultAmount: 4, unit: "oz", macrosPerDefault: { calories: 187, protein: 35, carbs: 0, fat: 4 } },
  { name: "Ground turkey", aliases: ["turkey", "ground turkey"], defaultAmount: 4, unit: "oz", macrosPerDefault: { calories: 170, protein: 22, carbs: 0, fat: 9 } },
  { name: "Salmon", aliases: ["salmon", "atlantic salmon"], defaultAmount: 4, unit: "oz", macrosPerDefault: { calories: 233, protein: 25, carbs: 0, fat: 14 } },
  { name: "White rice", aliases: ["rice", "white rice", "jasmine rice"], defaultAmount: 1, unit: "cup", macrosPerDefault: { calories: 205, protein: 4, carbs: 45, fat: 0.4 } },
  { name: "Brown rice", aliases: ["brown rice"], defaultAmount: 1, unit: "cup", macrosPerDefault: { calories: 216, protein: 5, carbs: 45, fat: 1.8 } },
  { name: "Oats", aliases: ["oats", "rolled oats", "oatmeal"], defaultAmount: 40, unit: "g", macrosPerDefault: { calories: 154, protein: 5, carbs: 27, fat: 3 } },
  { name: "Greek yogurt", aliases: ["greek yogurt", "yogurt"], defaultAmount: 170, unit: "g", macrosPerDefault: { calories: 100, protein: 17, carbs: 6, fat: 0 } },
  { name: "Whole egg", aliases: ["egg", "whole egg", "eggs"], defaultAmount: 1, unit: "piece", macrosPerDefault: { calories: 72, protein: 6, carbs: 0.4, fat: 5 } },
  { name: "Egg whites", aliases: ["egg whites", "egg white"], defaultAmount: 100, unit: "g", macrosPerDefault: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 } },
  { name: "Whey protein", aliases: ["whey", "whey protein", "protein powder"], defaultAmount: 1, unit: "serving", macrosPerDefault: { calories: 120, protein: 24, carbs: 3, fat: 1.5 } },
  { name: "Peanut butter", aliases: ["peanut butter"], defaultAmount: 1, unit: "tbsp", macrosPerDefault: { calories: 95, protein: 4, carbs: 3.5, fat: 8 } },
  { name: "Avocado", aliases: ["avocado"], defaultAmount: 100, unit: "g", macrosPerDefault: { calories: 160, protein: 2, carbs: 9, fat: 15 } },
  { name: "Banana", aliases: ["banana"], defaultAmount: 1, unit: "piece", macrosPerDefault: { calories: 105, protein: 1.3, carbs: 27, fat: 0.3 } },
  { name: "Sweet potato", aliases: ["sweet potato"], defaultAmount: 100, unit: "g", macrosPerDefault: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 } },
  { name: "Broccoli", aliases: ["broccoli"], defaultAmount: 100, unit: "g", macrosPerDefault: { calories: 35, protein: 2.4, carbs: 7, fat: 0.4 } },
  { name: "Pasta", aliases: ["pasta", "penne", "rotini", "spaghetti", "macaroni"], defaultAmount: 2, unit: "oz", macrosPerDefault: { calories: 200, protein: 7, carbs: 42, fat: 1.5 } },
  { name: "Mozzarella", aliases: ["mozzarella", "cheese", "parmesan"], defaultAmount: 1, unit: "oz", macrosPerDefault: { calories: 85, protein: 6, carbs: 1, fat: 6 } },
  { name: "Milk", aliases: ["milk"], defaultAmount: 1, unit: "cup", macrosPerDefault: { calories: 103, protein: 8, carbs: 12, fat: 2.4 } },
  { name: "Butter", aliases: ["butter"], defaultAmount: 1, unit: "tbsp", macrosPerDefault: { calories: 102, protein: 0.1, carbs: 0, fat: 11.5 } },
  { name: "Olive oil", aliases: ["olive oil", "oil"], defaultAmount: 1, unit: "tbsp", macrosPerDefault: { calories: 119, protein: 0, carbs: 0, fat: 13.5 } },
  { name: "Flour", aliases: ["flour", "all-purpose flour"], defaultAmount: 0.25, unit: "cup", macrosPerDefault: { calories: 114, protein: 3, carbs: 24, fat: 0.3 } },
];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6|br|span)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean)
    .join("\n");
}

function roundCalories(value: number) {
  return Math.round(value);
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeUnit(rawUnit?: string): PortionUnit {
  const normalized = (rawUnit ?? "serving").toLowerCase();
  if (normalized === "grams" || normalized === "gram") return "g";
  if (normalized === "ounces" || normalized === "ounce" || normalized === "lb" || normalized === "lbs") return "oz";
  if (normalized === "cups") return "cup";
  if (normalized === "tablespoon" || normalized === "tablespoons") return "tbsp";
  if (normalized === "pieces") return "piece";
  if (normalized === "servings") return "serving";
  return ["g", "oz", "serving", "cup", "tbsp", "piece"].includes(normalized) ? (normalized as PortionUnit) : "serving";
}

function findFood(value: string) {
  const normalized = cleanText(value.toLowerCase());
  if (!normalized) {
    return null;
  }

  return (
    foodCatalog.find((food) => food.name.toLowerCase() === normalized || food.aliases.some((alias) => alias.toLowerCase() === normalized)) ??
    foodCatalog.find(
      (food) =>
        food.name.toLowerCase().includes(normalized) ||
        normalized.includes(food.name.toLowerCase()) ||
        food.aliases.some((alias) => alias.toLowerCase().includes(normalized) || normalized.includes(alias.toLowerCase())),
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
    return (amount * 28.35) / food.defaultAmount;
  }
  return null;
}

function extractJsonLd(html: string) {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const match of matches) {
    const content = match.replace(/^.*?>/, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(content) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const type = record["@type"];
          if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
            return record;
          }
          const graph = record["@graph"];
          if (Array.isArray(graph)) {
            for (const graphItem of graph) {
              if (graphItem && typeof graphItem === "object") {
                const graphRecord = graphItem as Record<string, unknown>;
                const graphType = graphRecord["@type"];
                if (graphType === "Recipe" || (Array.isArray(graphType) && graphType.includes("Recipe"))) {
                  return graphRecord;
                }
              }
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function parseNutritionFromText(text: string) {
  const match = text.match(
    /Nutrition Facts(?:\s*\(per serving\))?\s*(\d+(?:\.\d+)?)\s*Calories\s*(\d+(?:\.\d+)?)g\s*Fat\s*(\d+(?:\.\d+)?)g\s*Carbs\s*(\d+(?:\.\d+)?)g\s*Protein/i,
  );

  if (!match) {
    return null;
  }

  return {
    calories: Number.parseFloat(match[1]),
    fat: Number.parseFloat(match[2]),
    carbs: Number.parseFloat(match[3]),
    protein: Number.parseFloat(match[4]),
  };
}

function parseServings(text: string) {
  const match =
    text.match(/Servings:\s*(\d+(?:\.\d+)?)/i) ??
    text.match(/Servings Per Recipe\s*(\d+(?:\.\d+)?)/i) ??
    text.match(/recipeYield["':\s\[]+(\d+(?:\.\d+)?)/i) ??
    text.match(/yields?\s*(\d+(?:\.\d+)?)\s*servings?/i);
  return match ? Number.parseFloat(match[1]) : 1;
}

function parseIngredientsFromSchema(schema: Record<string, unknown>) {
  return Array.isArray(schema.recipeIngredient)
    ? schema.recipeIngredient.filter((entry): entry is string => typeof entry === "string" && cleanText(entry).length > 0)
    : [];
}

function parseIngredientsFromText(text: string) {
  const ingredientsBlockStart = text.indexOf("Ingredients");
  const directionsBlockStart = text.indexOf("Directions");
  if (ingredientsBlockStart < 0 || directionsBlockStart < 0 || directionsBlockStart <= ingredientsBlockStart) {
    return [];
  }

  return text
    .slice(ingredientsBlockStart + "Ingredients".length, directionsBlockStart)
    .split("\n")
    .map((line) => cleanText(line.replace(/^[*•-]\s*/, "")))
    .filter((line) => /^\d/.test(line));
}

async function fetchRecipePage(url: string) {
  const directResponse = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; VitalyxRecipeBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (directResponse.ok) {
    return {
      body: await directResponse.text(),
      fetchedVia: "direct" as const,
    };
  }

  if (directResponse.status !== 403) {
    throw new Error(`Recipe page request failed with status ${directResponse.status}.`);
  }

  const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      Accept: "text/plain",
    },
  });

  if (!jinaResponse.ok) {
    throw new Error(`Recipe page request failed with status ${directResponse.status}, and reader fallback failed with status ${jinaResponse.status}.`);
  }

  return {
    body: await jinaResponse.text(),
    fetchedVia: "reader" as const,
  };
}

function parseIngredientLine(line: string) {
  const normalizedLine = cleanText(
    line
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/,/g, " ")
      .replace(/\bpackages?\b/g, "serving")
      .replace(/\bpounds?\b/g, "oz")
      .replace(/\bounces?\b/g, "oz")
      .replace(/\btablespoons?\b/g, "tbsp")
      .replace(/\bcups?\b/g, "cup")
      .replace(/\bpieces?\b/g, "piece"),
  ).replace(/^(\d+)\s+(\d+)\/(\d+)\b/, (_, whole, numerator, denominator) =>
    `${Number(whole) + Number(numerator) / Number(denominator)}`,
  );

  const match = normalizedLine.match(
    /^(?<amount>\d+(?:\.\d+)?|\d+\/\d+)?\s*(?<unit>g|oz|serving|cup|tbsp|piece)?\s*(?<food>.+)$/i,
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

function estimateFromIngredients(ingredients: string[], servings: number) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let matched = 0;

  for (const line of ingredients) {
    const parsed = parseIngredientLine(line);
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

    matched += 1;
    calories += food.macrosPerDefault.calories * ratio;
    protein += food.macrosPerDefault.protein * ratio;
    carbs += food.macrosPerDefault.carbs * ratio;
    fat += food.macrosPerDefault.fat * ratio;
  }

  if (!matched) {
    return null;
  }

  return {
    calories: roundCalories(calories / Math.max(servings, 1)),
    protein: roundMacro(protein / Math.max(servings, 1)),
    carbs: roundMacro(carbs / Math.max(servings, 1)),
    fat: roundMacro(fat / Math.max(servings, 1)),
    confidenceScore: Math.max(0.42, Math.min(0.8, matched / Math.max(ingredients.length, 1))),
    estimatedFrom: "ingredients" as const,
    matchedIngredients: matched,
    totalIngredients: ingredients.length,
  };
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "GET") {
    res.setHeader?.("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const input = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const sourceUrl = String(input ?? "").trim();
  if (!sourceUrl) {
    return res.status(400).json({ error: "A recipe URL is required." });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return res.status(400).json({ error: "Enter a valid recipe URL." });
  }

  try {
    const page = await fetchRecipePage(parsedUrl.toString());
    const html = page.body;
    const text = htmlToText(html);
    const schema = extractJsonLd(html);
    const title =
      (schema && typeof schema.name === "string" ? cleanText(schema.name) : "") ||
      cleanText(text.match(/^([^\n]+)/)?.[1] ?? "") ||
      parsedUrl.hostname.replace(/^www\./, "");
    const servings = schema && typeof schema.recipeYield === "string"
      ? parseServings(schema.recipeYield)
      : parseServings(text);

    const schemaNutrition =
      schema && schema.nutrition && typeof schema.nutrition === "object"
        ? (() => {
            const nutrition = schema.nutrition as Record<string, unknown>;
            const calories = Number.parseFloat(String(nutrition.calories ?? "").replace(/[^\d.]/g, "")) || 0;
            const fat = Number.parseFloat(String(nutrition.fatContent ?? "").replace(/[^\d.]/g, "")) || 0;
            const carbs = Number.parseFloat(String(nutrition.carbohydrateContent ?? "").replace(/[^\d.]/g, "")) || 0;
            const protein = Number.parseFloat(String(nutrition.proteinContent ?? "").replace(/[^\d.]/g, "")) || 0;
            return calories || fat || carbs || protein
              ? { calories: roundCalories(calories), fat: roundMacro(fat), carbs: roundMacro(carbs), protein: roundMacro(protein) }
              : null;
          })()
        : null;

    const textNutrition = parseNutritionFromText(text);
    const ingredients = schema ? parseIngredientsFromSchema(schema) : parseIngredientsFromText(text);
    const ingredientEstimate = estimateFromIngredients(ingredients, servings);

    const nutrition = schemaNutrition ?? textNutrition;
    if (!nutrition && !ingredientEstimate) {
      return res.status(422).json({ error: "Recipe data was found, but there was not enough nutrition or ingredient detail to estimate macros." });
    }

    if (nutrition) {
      return res.status(200).json({
        title,
        sourceUrl: parsedUrl.toString(),
        servingAmount: 1,
        servingUnit: "serving",
        calories: roundCalories(nutrition.calories ?? 0),
        protein: roundMacro(nutrition.protein ?? 0),
        carbs: roundMacro(nutrition.carbs ?? 0),
        fat: roundMacro(nutrition.fat ?? 0),
        confidenceScore: 0.92,
        estimatedFrom: "schema-nutrition",
      });
    }

    return res.status(200).json({
      title,
      sourceUrl: parsedUrl.toString(),
      servingAmount: 1,
      servingUnit: "serving",
        calories: ingredientEstimate!.calories,
        protein: ingredientEstimate!.protein,
        carbs: ingredientEstimate!.carbs,
        fat: ingredientEstimate!.fat,
        confidenceScore: page.fetchedVia === "reader"
          ? Math.max(0.4, ingredientEstimate!.confidenceScore - 0.06)
          : ingredientEstimate!.confidenceScore,
        estimatedFrom: "ingredients",
        matchedIngredients: ingredientEstimate!.matchedIngredients,
        totalIngredients: ingredientEstimate!.totalIngredients,
      });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to estimate this recipe right now.";
    return res.status(500).json({ error: message });
  }
}
