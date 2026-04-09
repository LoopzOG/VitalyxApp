import { groceryProducts, mockPriceHistory, mockStores } from "@/lib/groceryMockData";
import type {
  GroceryList,
  GroceryListItem,
  ManualBarcodeEntry,
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

type BarcodeLookupProviderMatch = {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  suggestedUnit: "piece";
  sourceLabel: string;
  latestPrices?: PriceRecord[];
};

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

function getPersistedExternalPriceRecords(item: GroceryListItem) {
  return item.latestPrices.filter((record) => record.source !== "manual");
}

export abstract class BasePriceProvider {
  abstract readonly name: string;
  abstract getPricesForProduct(product: NormalizedProduct, item: GroceryListItem): PriceRecord[];
  abstract getPriceHistory(product: NormalizedProduct, storeName?: string, item?: GroceryListItem): PriceRecord[];
}

export class MockPriceProvider extends BasePriceProvider {
  readonly name = "mock";

  getPricesForProduct(product: NormalizedProduct, _item?: GroceryListItem) {
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

  getPricesForProduct(_product: NormalizedProduct, item?: GroceryListItem) {
    return item ? latestByStore(getPersistedExternalPriceRecords(item)) : [];
  }

  getPriceHistory(_product: NormalizedProduct, storeName?: string, item?: GroceryListItem) {
    return (item ? getPersistedExternalPriceRecords(item) : [])
      .filter((record) => !storeName || record.storeName === storeName)
      .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
  }
}

export class UserSubmittedPriceProvider extends BasePriceProvider {
  readonly name = "user-submitted";

  constructor(private readonly manualRecords: PriceRecord[]) {
    super();
  }

  getPricesForProduct(product: NormalizedProduct, _item?: GroceryListItem) {
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

  async lookupBarcode(barcode: string, manualBarcodeEntries: ManualBarcodeEntry[] = []) {
    const normalizedBarcode = cleanBarcode(barcode);
    if (!normalizedBarcode) {
      return null;
    }

    const barcodeCandidates = expandBarcodeCandidates(normalizedBarcode);
    const manualMatch = manualBarcodeEntries.find((entry) => barcodeCandidates.includes(cleanBarcode(entry.barcode)));
    if (manualMatch) {
      return {
        barcode: manualMatch.barcode,
        name: manualMatch.name,
        brand: manualMatch.brand,
        category: manualMatch.category ?? "Saved grocery item",
        suggestedUnit: manualMatch.suggestedUnit,
        matchedProductId: manualMatch.matchedProductId,
        sourceLabel: "Your Vitalyx UPC memory",
        latestPrices: [],
      };
    }

    let providerMatch: BarcodeLookupProviderMatch | null = null;

    for (const candidate of barcodeCandidates) {
      const response = await fetch(`/api/grocery/upc-lookup?barcode=${encodeURIComponent(candidate)}`);
      if (!response.ok) {
        continue;
      }

      providerMatch = (await response.json()) as BarcodeLookupProviderMatch;
      if (providerMatch) {
        break;
      }
    }

    const matchedMockProduct = groceryProducts.find((product) => barcodeCandidates.includes(product.barcode ?? ""));
    const matchedCatalogProduct =
      matchedMockProduct ??
      (providerMatch
        ? this.matchingService.matchItemToProduct({
            name: providerMatch.name,
            brand: providerMatch.brand,
            barcode: providerMatch.barcode,
          })
        : null);

    if (providerMatch) {
      return {
        barcode: matchedCatalogProduct?.barcode ?? providerMatch.barcode ?? barcodeCandidates[0] ?? normalizedBarcode,
        name: providerMatch.name,
        brand: providerMatch.brand ?? matchedCatalogProduct?.brand,
        category: matchedCatalogProduct?.category ?? providerMatch.category ?? "Packaged grocery",
        suggestedUnit: "piece" as const,
        matchedProductId: matchedCatalogProduct?.id,
        sourceLabel: matchedCatalogProduct ? `${providerMatch.sourceLabel} + Vitalyx match` : providerMatch.sourceLabel,
        latestPrices: "latestPrices" in providerMatch && Array.isArray(providerMatch.latestPrices) ? providerMatch.latestPrices : [],
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
        latestPrices: [],
      };
    }

    return null;
  }

  private providers(manualRecords: PriceRecord[]) {
    return [new UserSubmittedPriceProvider(manualRecords), new RetailerApiProvider()];
  }

  getPricesForItem(item: GroceryListItem, manualRecords: PriceRecord[] = []): PriceLookupResult {
    const normalizedName = this.matchingService.normalizeItemName(item.name);
    const matchedProduct = this.matchingService.matchItemToProduct(item);
    const suggestedMatches = this.matchingService.getSuggestedMatches(item);
    const persistedExternalPrices = getPersistedExternalPriceRecords(item);

    if (!matchedProduct) {
      const latestPrices = latestByStore(
        [
          ...persistedExternalPrices,
          ...manualRecords.filter((record) => normalizeText(record.itemName) === normalizedName),
        ],
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

  async fetchLivePricesForBarcode(barcode: string) {
    const normalizedBarcode = cleanBarcode(barcode);
    if (!normalizedBarcode) {
      return [];
    }

    const response = await fetch(`/api/grocery/prices?barcode=${encodeURIComponent(normalizedBarcode)}`);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { latestPrices?: PriceRecord[] };
    return Array.isArray(payload.latestPrices) ? payload.latestPrices : [];
  }

  estimateItemTotal(item: GroceryListItem, record: PriceRecord) {
    return estimateItemTotal(item, record);
  }
}

export const productMatchingService = new ProductMatchingService();
export const storeComparisonService = new StoreComparisonService();
export const groceryPriceService = new GroceryPriceService(productMatchingService, storeComparisonService);
