type RequestLike = {
  method?: string;
};

type ResponseLike = {
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

const MCP_PROTOCOL_VERSION = "2025-11-25";

async function getOpenNutritionStatus() {
  const endpoint = process.env.OPENNUTRITION_MCP_URL?.trim();
  if (!endpoint) {
    return {
      configured: false,
      reachable: false,
      sourceLabel: "OpenNutrition",
      message: "OpenNutrition fallback is not configured.",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: {
            name: "vitalyx-upc-status",
            version: "1.0.0",
          },
        },
      }),
    });

    if (!response.ok && response.status !== 202) {
      throw new Error(`OpenNutrition MCP request failed with status ${response.status}.`);
    }

    return {
      configured: true,
      reachable: true,
      sourceLabel: "OpenNutrition",
      message: "OpenNutrition barcode fallback is active.",
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      sourceLabel: "OpenNutrition",
      message: error instanceof Error ? error.message : "OpenNutrition fallback is configured but unavailable.",
    };
  }
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== "GET") {
    res.setHeader?.("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const openNutrition = await getOpenNutritionStatus();

  return res.status(200).json({
    openNutrition,
    openFoodFacts: {
      sourceLabel: "Open Food Facts",
      message: "Primary UPC product lookup is active.",
    },
    openPrices: {
      sourceLabel: "Open Prices",
      message: "Community price enrichment is active when price records exist.",
    },
  });
}
