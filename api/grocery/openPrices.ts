type OpenPricesProduct = {
  id: number;
  code: string;
  product_name?: string | null;
  brands?: string | null;
  categories_tags?: string[] | null;
  price_count?: number | null;
};

type OpenPricesLocation = {
  id: number;
  osm_name?: string | null;
  osm_brand?: string | null;
  osm_display_name?: string | null;
  osm_address_city?: string | null;
  osm_address_country?: string | null;
  osm_address_country_code?: string | null;
};

type OpenPricesPrice = {
  id: number;
  product_code?: string | null;
  product_name?: string | null;
  price?: number | null;
  price_per?: string | null;
  currency?: string | null;
  date?: string | null;
  location?: OpenPricesLocation | null;
  product?: OpenPricesProduct | null;
};

type OpenPricesPriceListResponse = {
  items?: OpenPricesPrice[];
};

export type OpenPricesLookupPriceRecord = {
  id: string;
  productId: string;
  itemName: string;
  storeName: string;
  price: number;
  quantitySize?: string;
  locationLabel?: string;
  confidenceScore: number;
  source: "open-prices";
  checkedAt: string;
  note?: string;
};

const OPEN_PRICES_BASE_URL = "https://prices.openfoodfacts.org/api/v1";

function cleanBarcode(value: string) {
  return value.replace(/[^\d]/g, "");
}

function latestByStore(records: OpenPricesLookupPriceRecord[]) {
  const map = new Map<string, OpenPricesLookupPriceRecord>();

  for (const record of records) {
    const current = map.get(record.storeName);
    if (!current || new Date(record.checkedAt).getTime() > new Date(current.checkedAt).getTime()) {
      map.set(record.storeName, record);
    }
  }

  return [...map.values()].sort((a, b) => a.price - b.price);
}

function describeLocation(location?: OpenPricesLocation | null) {
  if (!location) {
    return "Open Prices community";
  }

  return (
    location.osm_brand?.trim() ||
    location.osm_name?.trim() ||
    location.osm_display_name?.split(",")[0]?.trim() ||
    "Open Prices community"
  );
}

function describeLocationLabel(location?: OpenPricesLocation | null) {
  if (!location) {
    return "Open Prices community price";
  }

  return [location.osm_address_city, location.osm_address_country].filter(Boolean).join(", ") || describeLocation(location);
}

function describeQuantity(price: OpenPricesPrice) {
  return [price.price_per?.trim(), price.currency?.trim()].filter(Boolean).join(" ") || undefined;
}

async function fetchOpenPricesJson<T>(path: string, searchParams?: Record<string, string | number | undefined>) {
  const url = new URL(`${OPEN_PRICES_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Open Prices request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function getOpenPricesProduct(barcode: string) {
  const cleanCode = cleanBarcode(barcode);
  if (!cleanCode) {
    return null;
  }

  return fetchOpenPricesJson<OpenPricesProduct>(`/products/code/${cleanCode}`);
}

export async function getOpenPricesPriceRecords(barcode: string, itemName?: string) {
  const cleanCode = cleanBarcode(barcode);
  if (!cleanCode) {
    return [];
  }

  const payload = await fetchOpenPricesJson<OpenPricesPriceListResponse>("/prices", {
    product_code: cleanCode,
    ordering: "-date",
    size: 50,
  });

  const records = (payload?.items ?? [])
    .filter((entry): entry is OpenPricesPrice => typeof entry.price === "number" && Number.isFinite(entry.price))
    .map((entry) => {
      const fallbackName =
        entry.product_name?.trim() ||
        entry.product?.product_name?.trim() ||
        itemName?.trim() ||
        `UPC ${cleanCode}`;

      const storeName = describeLocation(entry.location);
      const checkedAt = entry.date ? new Date(`${entry.date}T12:00:00Z`).toISOString() : new Date().toISOString();

      return {
        id: `open-prices-${entry.id}`,
        productId: entry.product?.code?.trim() || entry.product_code?.trim() || cleanCode,
        itemName: fallbackName,
        storeName,
        price: Number((entry.price ?? 0).toFixed(2)),
        quantitySize: describeQuantity(entry),
        locationLabel: describeLocationLabel(entry.location),
        confidenceScore: 0.86,
        source: "open-prices" as const,
        checkedAt,
        note: [entry.currency?.trim(), entry.location?.osm_address_country_code?.trim()].filter(Boolean).join(" | ") || undefined,
      } satisfies OpenPricesLookupPriceRecord;
    });

  return latestByStore(records);
}
