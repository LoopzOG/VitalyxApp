// UPCitemdb — 1.5M+ general consumer goods (grocery, electronics, hardware, etc.)
// Free trial: 100 req/day, no key needed.
// Paid: set UPCITEMDB_API_KEY to unlock higher quotas.
// https://www.upcitemdb.com/api/explorer

type UpcItemDbResponse = {
  code: string;
  total?: number;
  items?: Array<{
    ean?: string;
    title?: string;
    brand?: string;
    category?: string;
    description?: string;
  }>;
  message?: string;
};

export type UpcItemDbProduct = {
  name: string;
  brand?: string;
  category?: string;
};

export async function fetchUpcItemDb(barcode: string): Promise<UpcItemDbProduct | null> {
  const apiKey = process.env.UPCITEMDB_API_KEY?.trim();

  const url = apiKey
    ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}`
    : `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) {
    headers["user_key"] = apiKey;
    headers["key_type"] = "3scale";
  }

  const response = await fetch(url, { headers });

  // 429 = rate limited, 403 = over free quota — skip silently, not an error.
  if (response.status === 429 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`UPCitemdb request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as UpcItemDbResponse;
  const item = payload.items?.[0];
  const name = item?.title?.trim();

  if (!name) {
    return null;
  }

  return {
    name,
    brand: item?.brand?.trim() || undefined,
    category: item?.category?.trim() || undefined,
  };
}
