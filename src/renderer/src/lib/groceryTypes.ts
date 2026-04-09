export type GroceryUnit =
  | "lb"
  | "oz"
  | "g"
  | "kg"
  | "piece"
  | "dozen"
  | "cup"
  | "bag"
  | "tub"
  | "head"
  | "pack"
  | "serving";

export type PriceSource = "mock" | "manual" | "retailer-api" | "user-submitted";

export type GroceryList = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: GroceryListItem[];
};

export type GroceryListItem = {
  id: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: GroceryUnit;
  barcode?: string;
  pricingMode?: "item" | "unit";
  brand?: string;
  category?: string;
  preferredStore?: string;
  matchedProductId?: string;
  latestPrices: PriceRecord[];
};

export type ManualBarcodeEntry = {
  id: string;
  barcode: string;
  name: string;
  normalizedName: string;
  brand?: string;
  category?: string;
  suggestedUnit: GroceryUnit;
  matchedProductId?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
};

export type PriceRecord = {
  id: string;
  productId: string;
  itemName: string;
  storeName: string;
  price: number;
  unitPrice?: number;
  quantitySize?: string;
  zipCode?: string;
  locationLabel?: string;
  confidenceScore?: number;
  source: PriceSource;
  checkedAt: string;
  note?: string;
};

export type NormalizedProduct = {
  id: string;
  name: string;
  barcode?: string;
  brand?: string;
  category: string;
  aliases: string[];
  defaultUnit: GroceryUnit;
  nutritionReferenceId?: string;
};

export type PriceComparisonResult = {
  storeName: string;
  totalCost: number;
  matchedItems: string[];
  unmatchedItems: string[];
  lastUpdated: string;
};

export type PriceLookupResult = {
  item: GroceryListItem;
  matchedProduct: NormalizedProduct | null;
  suggestedMatches: NormalizedProduct[];
  latestPrices: PriceRecord[];
};

export type PerItemBestPrice = {
  itemId: string;
  itemName: string;
  storeName: string;
  totalCost: number;
  record: PriceRecord;
};
