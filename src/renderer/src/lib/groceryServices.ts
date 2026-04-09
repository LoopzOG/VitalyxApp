import { groceryProducts, mockPriceHistory, mockStores } from "@/lib/groceryMockData";
import { getOpenFoodFactsNutrition } from "@/lib/openFoodFacts";
import type {
  GroceryList,
  GroceryListItem,
  NormalizedProduct,
  PerItemBestPrice,
  PriceComparisonResult,
  PriceLookupResult,
  PriceRecord,
} from "@/lib/groceryTypes";

function uid() {
  return crypto.randomUUID();
}

function toCurrency(value: number) {
  return Number(value.toFixed(2));
}

function latestByStore(records: PriceRecord[]) {
  const map = new Map<string, PriceRecord>();
  records.forEach((record) => {
    const current = map.get(record.storeName);
    if (!current || new Date(record.checkedAt).getTime() > new Date(current.checkedAt).getTime()) {
      map.set(record.storeName, record);
    }
  });
  return [...map.values()].sort((a, b) => a.price - b.price);
}

function compareScore(needle: string, product: NormalizedProduct) {
  const exactName = product.name.toLowerCase() === needle ? 100 : 0;
  const exactAlias = product.aliases.some((alias) => alias.toLowerCase() === needle) ? 95 : 0;
  const containsName = product.name.toLowerCase().includes(needle) || needle.includes(product.name.toLowerCase()) ? 78 : 0;
  const aliasHit = product.aliases.some((alias) => alias.toLowerCase().includes(needle) || needle.includes(alias.toLowerCase())) ? 72 : 0;
  return Math.max(exactName, exactAlias, containsName, aliasHit);
}

function cleanBarcode(value: string) {
  return value.replace(/[^\d]/g, "");
}

function expandBarcodeCandidates(value: string) {
  const cleaned = cleanBarcode(value);
  if (!cleaned) {
    return [];
  }

  const candidates = new Set<string>([cleaned]);

  // Some mobile scanners emit UPC-A codes as EAN-13 with a leading zero.
  if (cleaned.length === 13 && cleaned.startsWith("0")) {
    candidates.add(cleaned.slice(1));
  }

  // Some catalogs store UPC-A as EAN-13.
  if (cleaned.length === 12) {
    candidates.add(`0${cleaned}`);
  }

  return [...candidates];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBrand(value?: string) {
  return normalizeText(value ?? "");
}

function compareProductMatch(item: { name?: string; brand?: string }, product: NormalizedProduct) {
  const normalizedName = normalizeText(item.name ?? "");
  const normalizedBrand = normalizeBrand(item.brand);
  const normalizedProductBrand = normalizeBrand(product.brand);
  let score = compareScore(normalizedName, product);

  if (normalizedBrand && normalizedProductBrand) {
    if (normalizedBrand === normalizedProductBrand) {
      score += 24;
    } else if (
      normalizedBrand.includes(normalizedProductBrand) ||
      normalizedProductBrand.includes(normalizedBrand)
    ) {
      score += 14;
    }
  }

  if (normalizedBrand) {
    const brandInName = normalizedName.includes(normalizedBrand);
    const productBrandInName = normalizedProductBrand && normalizedName.includes(normalizedProductBrand);
    if (brandInName || productBrandInName) {
      score += 8;
    }
  }

  return score;
}

function estimateItemTotal(item: GroceryListItem, record: PriceRecord) {
  if (item.pricingMode === "item") {
    return toCurrency(item.quantity * record.price);
  }
  if (record.unitPrice) {
    return toCurrency(item.quantity * record.unitPrice);
  }
  return toCurrency(item.quantity * record.price);
}

export abstract class BasePriceProvider {
  abstract readonly name: string;
  abstract getPricesForProduct(product: NormalizedProduct, item: GroceryListItem): PriceRecord[];
  abstract getPriceHistory(product: NormalizedProduct, storeName?: string): PriceRecord[];
}

export class MockPriceProvider extends BasePriceProvider {
  readonly name = "mock";

  getPricesForProduct(product: NormalizedProduct, _item: GroceryListItem) {
    return latestByStore(mockPriceHistory[product.id] ?? []);
  }

  getPriceHistory(product: NormalizedProduct, storeName?: string) {
    const records = mockPriceHistory[product.id] ?? [];
    return records
      .filter((record) => !storeName || record.storeName === storeName)
      .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
  }
}

export class RetailerApiProvider extends BasePriceProvider {
  readonly name = "retailer-api";

  getPricesForProduct() {
    return [];
  }

  getPriceHistory() {
    return [];
  }
}

export class UserSubmittedPriceProvider extends BasePriceProvider {
  readonly name = "user-submitted";

  constructor(private readonly manualRecords: PriceRecord[]) {
    super();
  }

  getPricesForProduct(product: NormalizedProduct) {
    const records = this.manualRecords.filter((record) => record.productId === product.id);
    return latestByStore(records);
  }

  getPriceHistory(product: NormalizedProduct, storeName?: string) {
    return this.manualRecords
      .filter((record) => record.productId === product.id && (!storeName || record.storeName === storeName))
      .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
  }
}

export class ProductMatchingService {
  normalizeItemName(name: string) {
    return normalizeText(name);
  }

  matchItemToProduct(item: Pick<GroceryListItem, "name" | "brand" | "barcode" | "matchedProductId">) {
    if (item.matchedProductId) {
      const directMatch = groceryProducts.find((product) => product.id === item.matchedProductId);
      if (directMatch) {
        return directMatch;
      }
    }

    const barcode = cleanBarcode(item.barcode ?? "");
    if (barcode) {
      const barcodeMatch = groceryProducts.find((product) => expandBarcodeCandidates(barcode).includes(product.barcode ?? ""));
      if (barcodeMatch) {
        return barcodeMatch;
      }
    }

    const ranked = groceryProducts
      .map((product) => ({ product, score: compareProductMatch(item, product) }))
      .filter((entry) => entry.score >= 70)
      .sort((a, b) => b.score - a.score);

    return ranked[0]?.product ?? null;
  }

  getSuggestedMatches(item: Pick<GroceryListItem, "name" | "brand" | "barcode" | "matchedProductId">) {
    if (item.matchedProductId) {
      const directMatch = groceryProducts.find((product) => product.id === item.matchedProductId);
      if (directMatch) {
        return [directMatch];
      }
    }

    const barcode = cleanBarcode(item.barcode ?? "");
    if (barcode) {
      const barcodeMatch = groceryProducts.find((product) => expandBarcodeCandidates(barcode).includes(product.barcode ?? ""));
      if (barcodeMatch) {
        return [barcodeMatch];
      }
    }

    return groceryProducts
      .map((product) => ({ product, score: compareProductMatch(item, product) }))
      .filter((entry) => entry.score >= 45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.product);
  }
}

export class StoreComparisonService {
  calculateStoreTotals(list: GroceryList): PriceComparisonResult[] {
    return mockStores
      .map((storeName) => {
        let totalCost = 0;
        const matchedItems: string[] = [];
        const unmatchedItems: string[] = [];
        let lastUpdated = "";

        list.items.forEach((item) => {
          const record = item.latestPrices.find((entry) => entry.storeName === storeName);
          if (!record) {
            unmatchedItems.push(item.name);
            return;
          }

          matchedItems.push(item.name);
          totalCost += estimateItemTotal(item, record);
          if (!lastUpdated || new Date(record.checkedAt).getTime() > new Date(lastUpdated).getTime()) {
            lastUpdated = record.checkedAt;
          }
        });

        return {
          storeName,
          totalCost: toCurrency(totalCost),
          matchedItems,
          unmatchedItems,
          lastUpdated: lastUpdated || new Date().toISOString(),
        };
      })
      .sort((a, b) => {
        if (!a.matchedItems.length && b.matchedItems.length) return 1;
        if (!b.matchedItems.length && a.matchedItems.length) return -1;
        return a.totalCost - b.totalCost;
      });
  }

  getCheapestStore(list: GroceryList) {
    return this.calculateStoreTotals(list).find((result) => result.matchedItems.length > 0) ?? null;
  }

  getPerItemBestPrices(list: GroceryList): PerItemBestPrice[] {
    return list.items
      .map((item) => {
        const bestRecord = [...item.latestPrices].sort(
          (a, b) => estimateItemTotal(item, a) - estimateItemTotal(item, b),
        )[0];

        if (!bestRecord) {
          return null;
        }

        return {
          itemId: item.id,
          itemName: item.name,
          storeName: bestRecord.storeName,
          totalCost: estimateItemTotal(item, bestRecord),
          record: bestRecord,
        } satisfies PerItemBestPrice;
      })
      .filter((entry): entry is PerItemBestPrice => Boolean(entry));
  }
}

export class GroceryPriceService {
  constructor(
    private readonly matchingService: ProductMatchingService,
    private readonly comparisonService: StoreComparisonService,
  ) {}

  async lookupBarcode(barcode: string) {
    const normalizedBarcode = cleanBarcode(barcode);
    if (!normalizedBarcode) {
      return null;
    }

    const barcodeCandidates = expandBarcodeCandidates(normalizedBarcode);
    let offProduct = null;

    for (const candidate of barcodeCandidates) {
      offProduct = await getOpenFoodFactsNutrition(candidate).catch(() => null);
      if (offProduct) {
        break;
      }
    }

    const matchedMockProduct = groceryProducts.find((product) => barcodeCandidates.includes(product.barcode ?? ""));
    const matchedCatalogProduct =
      matchedMockProduct ??
      (offProduct
        ? this.matchingService.matchItemToProduct({
            name: offProduct.name,
            brand: offProduct.brand,
            barcode: offProduct.barcode,
          })
        : null);

    if (offProduct) {
      return {
        barcode: matchedCatalogProduct?.barcode ?? barcodeCandidates[0] ?? normalizedBarcode,
        name: offProduct.name,
        brand: offProduct.brand ?? matchedCatalogProduct?.brand,
        category: matchedCatalogProduct?.category ?? offProduct.category ?? "Packaged grocery",
        suggestedUnit: "piece" as const,
        matchedProductId: matchedCatalogProduct?.id,
        sourceLabel: matchedCatalogProduct ? "Open Food Facts + Vitalyx match" : "Open Food Facts",
      };
    }

    if (matchedCatalogProduct) {
      return {
        barcode: matchedCatalogProduct.barcode ?? normalizedBarcode,
        name: matchedCatalogProduct.name,
        brand: matchedCatalogProduct.brand,
        category: matchedCatalogProduct.category,
        suggestedUnit: "piece" as const,
        matchedProductId: matchedCatalogProduct.id,
        sourceLabel: "Vitalyx mock catalog",
      };
    }

    return null;
  }

  private providers(manualRecords: PriceRecord[]) {
    return [new UserSubmittedPriceProvider(manualRecords), new MockPriceProvider(), new RetailerApiProvider()];
  }

  getPricesForItem(item: GroceryListItem, manualRecords: PriceRecord[] = []): PriceLookupResult {
    const normalizedName = this.matchingService.normalizeItemName(item.name);
    const matchedProduct = this.matchingService.matchItemToProduct(item);
    const suggestedMatches = this.matchingService.getSuggestedMatches(item);

    if (!matchedProduct) {
      const latestPrices = latestByStore(
        manualRecords.filter((record) => normalizeText(record.itemName) === normalizedName),
      );

      return {
        item: {
          ...item,
          normalizedName,
          latestPrices,
        },
        matchedProduct: null,
        suggestedMatches,
        latestPrices,
      };
    }

    const latestPrices = latestByStore(
      this.providers(manualRecords).flatMap((provider) => provider.getPricesForProduct(matchedProduct, item)),
    );

    return {
      item: {
        ...item,
        normalizedName,
        matchedProductId: matchedProduct.id,
        category: item.category ?? matchedProduct.category,
        latestPrices,
      },
      matchedProduct,
      suggestedMatches,
      latestPrices,
    };
  }

  getPricesForList(items: GroceryListItem[], manualRecords: PriceRecord[] = []) {
    return items.map((item) => this.getPricesForItem(item, manualRecords).item);
  }

  compareStores(items: GroceryListItem[], manualRecords: PriceRecord[] = []) {
    const hydratedList: GroceryList = {
      id: "comparison-list",
      name: "Comparison list",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: this.getPricesForList(items, manualRecords),
    };
    return this.comparisonService.calculateStoreTotals(hydratedList);
  }

  saveManualPriceUpdate(
    priceRecord: Omit<PriceRecord, "id" | "checkedAt" | "source">,
    existing: PriceRecord[] = [],
  ) {
    return [
      ...existing,
      {
        ...priceRecord,
        id: uid(),
        checkedAt: new Date().toISOString(),
        source: "manual" as const,
      },
    ];
  }

  getPriceHistory(itemName: string, storeName: string, manualRecords: PriceRecord[] = []) {
    const product = this.matchingService.matchItemToProduct({ name: itemName });
    if (!product) {
      return manualRecords
        .filter((record) => normalizeText(record.itemName) === normalizeText(itemName) && (!storeName || record.storeName === storeName))
        .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
    }

    return this.providers(manualRecords)
      .flatMap((provider) => provider.getPriceHistory(product, storeName))
      .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
  }

  estimateItemTotal(item: GroceryListItem, record: PriceRecord) {
    return estimateItemTotal(item, record);
  }
}

export const productMatchingService = new ProductMatchingService();
export const storeComparisonService = new StoreComparisonService();
export const groceryPriceService = new GroceryPriceService(productMatchingService, storeComparisonService);
