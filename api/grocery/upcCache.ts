import { createClient } from "@supabase/supabase-js";

export type UpcCacheProduct = {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  sourceLabel: string;
};

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function readUpcCache(barcode: string): Promise<UpcCacheProduct | null> {
  try {
    const supabase = getServiceClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("upc_cache")
      .select("barcode, name, brand, category, source_label")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      barcode: data.barcode as string,
      name: data.name as string,
      brand: (data.brand as string | null) ?? undefined,
      category: (data.category as string | null) ?? undefined,
      sourceLabel: data.source_label as string,
    };
  } catch {
    return null;
  }
}

// Fire-and-forget: never awaited on the response path.
export function writeUpcCache(product: UpcCacheProduct): void {
  const supabase = getServiceClient();
  if (!supabase) {
    return;
  }

  void (async () => {
    await supabase.from("upc_cache").upsert(
      {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand ?? null,
        category: product.category ?? null,
        source_label: product.sourceLabel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode" },
    );
  })().catch(() => {
    // Best-effort: never block a response for a cache write.
  });
}
