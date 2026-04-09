import { getOpenNutritionStatus } from "./openNutrition";

type RequestLike = {
  method?: string;
};

type ResponseLike = {
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

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
