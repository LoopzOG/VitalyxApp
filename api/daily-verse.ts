import { getDailyVerseSelection } from "../src/shared/dailyVerseSelection";

type DailyVerseResponse = {
  id: string;
  reference: string;
  text: string;
  themes: Array<"Physical Health" | "Mental Health" | "Spiritual Strength">;
  priorityScore: number;
  translation: "NIV";
  attribution: string;
};

function extractPlainTextFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchNivVerse(reference: string) {
  const apiBibleKey = process.env.API_BIBLE_KEY?.trim() ?? "";
  const nivBibleId = process.env.API_BIBLE_BIBLE_ID?.trim() ?? "";

  if (!apiBibleKey || !nivBibleId) {
    throw new Error("NIV verse service is not configured yet. Add API_BIBLE_KEY and API_BIBLE_BIBLE_ID in Vercel.");
  }

  const response = await fetch(
    `https://api.scripture.api.bible/v1/bibles/${encodeURIComponent(nivBibleId)}/search?query=${encodeURIComponent(reference)}`,
    {
      headers: {
        "api-key": apiBibleKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`NIV verse service request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: {
      passages?: Array<{
        reference: string;
        content: string;
      }>;
    };
  };

  const passage = payload.data?.passages?.[0];
  if (!passage?.content) {
    throw new Error("No NIV verse content was returned for today's reference.");
  }

  return {
    reference: passage.reference || reference,
    text: extractPlainTextFromHtml(passage.content),
  };
}

export default async function handler(req: { query?: { date?: string } }, res: {
  status: (code: number) => { json: (payload: unknown) => void };
}) {
  try {
    const dateKey =
      typeof req.query?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : new Date().toISOString().slice(0, 10);

    const selection = await getDailyVerseSelection(dateKey);
    const nivVerse = await fetchNivVerse(selection.reference);

    const payload: DailyVerseResponse = {
      id: selection.id,
      reference: nivVerse.reference,
      text: nivVerse.text,
      themes: selection.themes,
      priorityScore: selection.priorityScore,
      translation: "NIV",
      attribution: "Scripture text delivered via API.Bible. NIV is a trademark of Biblica.",
    };

    res.status(200).json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the NIV verse right now.";
    res.status(500).json({
      error: message,
    });
  }
}
