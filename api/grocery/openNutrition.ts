type OpenNutritionFood = {
  id: string;
  name: string;
  description?: string;
  type?: "everyday" | "grocery" | "prepared" | "restaurant";
  labels?: string[];
  nutrition_100g?: Record<string, number>;
  alternate_names?: string[];
  source?: Array<Record<string, unknown>>;
  serving?: Record<string, unknown>;
  package_size?: Record<string, unknown>;
  ingredient_analysis?: Record<string, unknown>;
  ean_13?: string;
  ingredients?: string;
};

type JsonRpcResult<T> = {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

type OpenNutritionStructuredResult = {
  food?: OpenNutritionFood | null;
};

export type OpenNutritionLookupResult = {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  suggestedUnit: "piece";
  sourceLabel: string;
};

const MCP_PROTOCOL_VERSION = "2025-11-25";

function cleanBarcode(value: string) {
  return value.replace(/[^\d]/g, "");
}

function toEan13(barcode: string) {
  const cleaned = cleanBarcode(barcode);

  if (cleaned.length === 13) {
    return cleaned;
  }

  if (cleaned.length === 12) {
    return `0${cleaned}`;
  }

  return null;
}

function extractFirstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = extractFirstString(entry);
      if (nested) {
        return nested;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      const match = extractFirstString(nested);
      if (match) {
        return match;
      }
    }
  }

  return undefined;
}

async function parseMcpResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as JsonRpcResult<T>;
  }

  if (contentType.includes("text/event-stream")) {
    const body = await response.text();
    const events = body
      .split("\n\n")
      .map((chunk) =>
        chunk
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join(""),
      )
      .filter(Boolean);

    for (let index = events.length - 1; index >= 0; index -= 1) {
      try {
        return JSON.parse(events[index]) as JsonRpcResult<T>;
      } catch {
        continue;
      }
    }
  }

  throw new Error(`Unsupported MCP response type: ${contentType || "unknown"}.`);
}

async function postMcpMessage<T>(
  endpoint: string,
  message: Record<string, unknown>,
  sessionId?: string,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
      ...(sessionId ? { "MCP-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(message),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`OpenNutrition MCP request failed with status ${response.status}.`);
  }

  const nextSessionId = response.headers.get("MCP-Session-Id") ?? sessionId ?? undefined;

  if (response.status === 202) {
    return {
      sessionId: nextSessionId,
      payload: null,
    };
  }

  return {
    sessionId: nextSessionId,
    payload: await parseMcpResponse<T>(response),
  };
}

export async function lookupOpenNutritionBarcode(barcode: string): Promise<OpenNutritionLookupResult | null> {
  const endpoint = process.env.OPENNUTRITION_MCP_URL?.trim();
  if (!endpoint) {
    return null;
  }

  const ean13 = toEan13(barcode);
  if (!ean13) {
    return null;
  }

  const initialize = await postMcpMessage<{
    protocolVersion?: string;
  }>(endpoint, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "vitalyx-upc-lookup",
        version: "1.0.0",
      },
    },
  });

  const sessionId = initialize.sessionId;

  await postMcpMessage(endpoint, {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  }, sessionId);

  const toolResult = await postMcpMessage<{
    structuredContent?: OpenNutritionStructuredResult;
  }>(endpoint, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "get-food-by-ean13",
      arguments: {
        ean_13: ean13,
      },
    },
  }, sessionId);

  const food = toolResult.payload?.result?.structuredContent?.food;
  if (!food?.name) {
    return null;
  }

  return {
    barcode: food.ean_13 ?? ean13,
    name: food.name.trim(),
    brand: extractFirstString(food.source),
    category: food.type ? food.type[0].toUpperCase() + food.type.slice(1) : undefined,
    suggestedUnit: "piece",
    sourceLabel: "OpenNutrition",
  };
}

export async function getOpenNutritionStatus() {
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
    const initialize = await postMcpMessage<{
      protocolVersion?: string;
    }>(endpoint, {
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
    });

    if (!initialize.payload?.result) {
      throw new Error("No initialize result returned.");
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
