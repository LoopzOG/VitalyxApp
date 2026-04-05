import type { NormalizedProduct, PriceRecord } from "@/lib/groceryTypes";

function uid() {
  return crypto.randomUUID();
}

const now = new Date("2026-04-04T12:00:00.000Z");

function isoDaysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function buildHistory(
  productId: string,
  itemName: string,
  storeName: string,
  basePrice: number,
  unitPrice: number,
  quantitySize: string,
  confidenceScore: number,
): PriceRecord[] {
  return [
    {
      id: uid(),
      productId,
      itemName,
      storeName,
      price: Number((basePrice * 1.06).toFixed(2)),
      unitPrice: Number((unitPrice * 1.06).toFixed(2)),
      quantitySize,
      locationLabel: "Local market estimate",
      confidenceScore: Number((confidenceScore - 0.04).toFixed(2)),
      source: "mock",
      checkedAt: isoDaysAgo(14),
    },
    {
      id: uid(),
      productId,
      itemName,
      storeName,
      price: Number((basePrice * 1.03).toFixed(2)),
      unitPrice: Number((unitPrice * 1.03).toFixed(2)),
      quantitySize,
      locationLabel: "Local market estimate",
      confidenceScore: Number((confidenceScore - 0.02).toFixed(2)),
      source: "mock",
      checkedAt: isoDaysAgo(7),
    },
    {
      id: uid(),
      productId,
      itemName,
      storeName,
      price: basePrice,
      unitPrice,
      quantitySize,
      locationLabel: "Local market estimate",
      confidenceScore,
      source: "mock",
      checkedAt: isoDaysAgo(1),
    },
  ];
}

export const mockStores = ["Costco", "Trader Joe's", "Walmart", "Target", "Whole Foods"];

export const groceryProducts: NormalizedProduct[] = [
  { id: "prod-chicken-breast", name: "Chicken breast", barcode: "2011111111111", category: "Protein", aliases: ["chicken breast", "chicken", "boneless chicken breast"], defaultUnit: "lb", nutritionReferenceId: "Chicken breast" },
  { id: "prod-eggs", name: "Eggs", barcode: "2022222222222", category: "Breakfast", aliases: ["eggs", "large eggs", "egg"], defaultUnit: "dozen", nutritionReferenceId: "Whole egg" },
  { id: "prod-rice", name: "Rice", barcode: "2033333333333", category: "Pantry", aliases: ["rice", "white rice", "jasmine rice"], defaultUnit: "lb", nutritionReferenceId: "White rice" },
  { id: "prod-greek-yogurt", name: "Greek yogurt", barcode: "2044444444444", category: "Dairy", aliases: ["greek yogurt", "yogurt"], defaultUnit: "tub", nutritionReferenceId: "Greek yogurt" },
  { id: "prod-ground-beef", name: "Ground beef", barcode: "2055555555555", category: "Protein", aliases: ["ground beef", "lean ground beef", "beef"], defaultUnit: "lb" },
  { id: "prod-oats", name: "Oats", barcode: "2066666666666", category: "Pantry", aliases: ["oats", "rolled oats", "oatmeal"], defaultUnit: "bag", nutritionReferenceId: "Oats" },
  { id: "prod-broccoli", name: "Broccoli", barcode: "2077777777777", category: "Produce", aliases: ["broccoli", "broccoli crown"], defaultUnit: "head", nutritionReferenceId: "Broccoli" },
];

export const mockPriceHistory: Record<string, PriceRecord[]> = {
  "prod-chicken-breast": [
    ...buildHistory("prod-chicken-breast", "Chicken breast", "Costco", 3.29, 3.29, "1 lb", 0.94),
    ...buildHistory("prod-chicken-breast", "Chicken breast", "Trader Joe's", 4.49, 4.49, "1 lb", 0.88),
    ...buildHistory("prod-chicken-breast", "Chicken breast", "Walmart", 3.67, 3.67, "1 lb", 0.91),
    ...buildHistory("prod-chicken-breast", "Chicken breast", "Target", 4.12, 4.12, "1 lb", 0.83),
    ...buildHistory("prod-chicken-breast", "Chicken breast", "Whole Foods", 5.19, 5.19, "1 lb", 0.79),
  ],
  "prod-eggs": [
    ...buildHistory("prod-eggs", "Eggs", "Costco", 6.79, 1.13, "6 dozen", 0.93),
    ...buildHistory("prod-eggs", "Eggs", "Trader Joe's", 3.19, 3.19, "1 dozen", 0.89),
    ...buildHistory("prod-eggs", "Eggs", "Walmart", 2.98, 2.98, "1 dozen", 0.92),
    ...buildHistory("prod-eggs", "Eggs", "Target", 3.39, 3.39, "1 dozen", 0.84),
    ...buildHistory("prod-eggs", "Eggs", "Whole Foods", 4.49, 4.49, "1 dozen", 0.77),
  ],
  "prod-rice": [
    ...buildHistory("prod-rice", "Rice", "Costco", 11.99, 0.6, "20 lb", 0.9),
    ...buildHistory("prod-rice", "Rice", "Trader Joe's", 2.49, 1.25, "2 lb", 0.86),
    ...buildHistory("prod-rice", "Rice", "Walmart", 7.84, 0.78, "10 lb", 0.93),
    ...buildHistory("prod-rice", "Rice", "Target", 3.99, 1.33, "3 lb", 0.82),
    ...buildHistory("prod-rice", "Rice", "Whole Foods", 4.79, 1.6, "3 lb", 0.74),
  ],
  "prod-greek-yogurt": [
    ...buildHistory("prod-greek-yogurt", "Greek yogurt", "Costco", 6.99, 3.5, "2 tubs", 0.9),
    ...buildHistory("prod-greek-yogurt", "Greek yogurt", "Trader Joe's", 5.49, 5.49, "1 tub", 0.88),
    ...buildHistory("prod-greek-yogurt", "Greek yogurt", "Walmart", 4.98, 4.98, "1 tub", 0.92),
    ...buildHistory("prod-greek-yogurt", "Greek yogurt", "Target", 5.29, 5.29, "1 tub", 0.83),
    ...buildHistory("prod-greek-yogurt", "Greek yogurt", "Whole Foods", 6.29, 6.29, "1 tub", 0.76),
  ],
  "prod-ground-beef": [
    ...buildHistory("prod-ground-beef", "Ground beef", "Costco", 4.69, 4.69, "1 lb", 0.92),
    ...buildHistory("prod-ground-beef", "Ground beef", "Trader Joe's", 5.49, 5.49, "1 lb", 0.86),
    ...buildHistory("prod-ground-beef", "Ground beef", "Walmart", 4.88, 4.88, "1 lb", 0.91),
    ...buildHistory("prod-ground-beef", "Ground beef", "Target", 5.19, 5.19, "1 lb", 0.82),
    ...buildHistory("prod-ground-beef", "Ground beef", "Whole Foods", 6.49, 6.49, "1 lb", 0.74),
  ],
  "prod-oats": [
    ...buildHistory("prod-oats", "Oats", "Costco", 7.99, 2.0, "4 bag", 0.87),
    ...buildHistory("prod-oats", "Oats", "Trader Joe's", 3.49, 3.49, "1 bag", 0.83),
    ...buildHistory("prod-oats", "Oats", "Walmart", 3.18, 3.18, "1 bag", 0.9),
    ...buildHistory("prod-oats", "Oats", "Target", 3.79, 3.79, "1 bag", 0.81),
    ...buildHistory("prod-oats", "Oats", "Whole Foods", 4.29, 4.29, "1 bag", 0.71),
  ],
  "prod-broccoli": [
    ...buildHistory("prod-broccoli", "Broccoli", "Costco", 4.99, 1.66, "3 head", 0.88),
    ...buildHistory("prod-broccoli", "Broccoli", "Trader Joe's", 2.29, 2.29, "1 head", 0.84),
    ...buildHistory("prod-broccoli", "Broccoli", "Walmart", 2.12, 2.12, "1 head", 0.9),
    ...buildHistory("prod-broccoli", "Broccoli", "Target", 2.39, 2.39, "1 head", 0.79),
    ...buildHistory("prod-broccoli", "Broccoli", "Whole Foods", 2.89, 2.89, "1 head", 0.73),
  ],
};
