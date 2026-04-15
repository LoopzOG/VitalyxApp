// Open Beauty Facts — community barcode database for cosmetics, personal care,
// supplements, and household products not covered by Open Food Facts.
// Free, no API key required. https://world.openbeautyfacts.org

type OpenBeautyFactsResponse = {
  code?: string;
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    categories?: string;
  };
};

export type OpenBeautyFactsProduct = {
  name: string;
  brand?: string;
  category?: string;
};

export async function fetchOpenBeautyFacts(barcode: string): Promise<OpenBeautyFactsProduct | null> {
  const cleanCode = barcode.replace(/[^\d]/g, "");
  if (!cleanCode) {
    return null;
  }

  const url = `https://world.openbeautyfacts.org/api/v2/product/${cleanCode}?fields=code,product_name,brands,categories`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Open Beauty Facts request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OpenBeautyFactsResponse;

  if (payload.status === 0 || !payload.product) {
    return null;
  }

  const name = payload.product.product_name?.trim();
  if (!name) {
    return null;
  }

  return {
    name,
    brand: payload.product.brands?.split(",")[0]?.trim() || undefined,
    category: payload.product.categories?.split(",")[0]?.trim() || undefined,
  };
}
