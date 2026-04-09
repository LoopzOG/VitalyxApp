const INSTACART_BASE_URL = "https://connect.instacart.com/idp/v1/retailers";

type RequestLike = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

type InstacartRetailerResponse = {
  retailers?: Array<{
    retailer_key?: string;
    name?: string;
    retailer_logo_url?: string;
  }>;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.INSTACART_API_KEY;
  const postalCode = String(req.query.postal_code ?? process.env.INSTACART_DEFAULT_POSTAL_CODE ?? "").trim();
  const countryCode = String(req.query.country_code ?? process.env.INSTACART_DEFAULT_COUNTRY_CODE ?? "US").trim().toUpperCase();

  if (!apiKey) {
    return res.status(200).json({
      retailers: [],
      source: "disabled",
      message: "Instacart API key is not configured.",
    });
  }

  if (!postalCode) {
    return res.status(200).json({
      retailers: [],
      source: "disabled",
      message: "Instacart postal code is not configured.",
    });
  }

  const url = new URL(INSTACART_BASE_URL);
  url.searchParams.set("postal_code", postalCode);
  url.searchParams.set("country_code", countryCode);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return res.status(response.status).json({
        retailers: [],
        source: "instacart",
        error: `Instacart request failed with status ${response.status}.`,
        detail: body.slice(0, 300),
      });
    }

    const payload = (await response.json()) as InstacartRetailerResponse;
    const retailers = (payload.retailers ?? [])
      .map((retailer) => ({
        id: retailer.retailer_key ?? "",
        name: retailer.name ?? "",
        logoUrl: retailer.retailer_logo_url ?? undefined,
      }))
      .filter((retailer) => retailer.id && retailer.name);

    return res.status(200).json({
      retailers,
      source: "instacart",
      postalCode,
      countryCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Instacart error.";
    return res.status(500).json({
      retailers: [],
      source: "instacart",
      error: message,
    });
  }
}
