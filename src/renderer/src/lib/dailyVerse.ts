export type VerseTheme = "Physical Health" | "Mental Health" | "Spiritual Strength";

export type DailyVerse = {
  id: string;
  reference: string;
  text: string;
  themes: VerseTheme[];
  priorityScore: number;
  translation: "NIV";
  attribution: string;
};

type VerseCatalogEntry = DailyVerse & {
  translation: never;
  attribution: never;
  weight: never;
};

type VerseSelectionEntry = {
  id: string;
  reference: string;
  text: string;
  themes: VerseTheme[];
  priorityScore: number;
  weight: number;
};

const themeMatchers: Array<{ theme: VerseTheme; patterns: RegExp[] }> = [
  {
    theme: "Physical Health",
    patterns: [
      /\bheal(?:ed|eth|ing)?\b/i,
      /\bhealth\b/i,
      /\bwhole\b/i,
      /\bstrength(?:en|ened)?\b/i,
      /\bstrong\b/i,
      /\bbody\b/i,
      /\bbones?\b/i,
      /\bflesh\b/i,
      /\brest\b/i,
      /\bsleep\b/i,
      /\bweary\b/i,
      /\bfaint\b/i,
      /\bphysician\b/i,
      /\brun\b/i,
      /\bwalk\b/i,
    ],
  },
  {
    theme: "Mental Health",
    patterns: [
      /\bmind\b/i,
      /\bheart\b/i,
      /\bpeace\b/i,
      /\bjoy\b/i,
      /\bhope\b/i,
      /\bcourage\b/i,
      /\bfear(?: not)?\b/i,
      /\banx(?:ious|iety)\b/i,
      /\btroubled\b/i,
      /\bmeditat(?:e|ion)\b/i,
      /\bwisdom\b/i,
      /\bunderstanding\b/i,
      /\bquiet\b/i,
      /\bcomfort\b/i,
      /\bsoul\b/i,
    ],
  },
  {
    theme: "Spiritual Strength",
    patterns: [
      /\bfaith\b/i,
      /\btrust\b/i,
      /\bpray(?:er)?\b/i,
      /\bspirit\b/i,
      /\bgrace\b/i,
      /\bmercy\b/i,
      /\blove\b/i,
      /\bhope\b/i,
      /\bstrength\b/i,
      /\brefuge\b/i,
      /\bsalvation\b/i,
      /\bbless(?:ed|ing)?\b/i,
    ],
  },
];

let verseCatalogPromise: Promise<VerseSelectionEntry[]> | null = null;
const apiBibleKey = import.meta.env.VITE_API_BIBLE_KEY?.trim() ?? "";
const nivBibleId = import.meta.env.VITE_API_BIBLE_BIBLE_ID?.trim() ?? "";

function cleanVerseText(text: string) {
  return text
    .replace(/^#\s*/, "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreVerse(text: string) {
  let priorityScore = 0;
  const themes: VerseTheme[] = [];

  for (const matcher of themeMatchers) {
    const matchCount = matcher.patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
    if (!matchCount) {
      continue;
    }

    themes.push(matcher.theme);
    priorityScore += matcher.theme === "Spiritual Strength" ? matchCount : matchCount * 2;
  }

  return {
    priorityScore,
    themes,
  };
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildVerseCatalog(rawVerses: Record<string, string>): VerseSelectionEntry[] {
  return Object.entries(rawVerses).map(([reference, verseText]) => {
    const text = cleanVerseText(verseText);
    const { priorityScore, themes } = scoreVerse(text);

    return {
      id: reference,
      reference,
      text,
      themes,
      priorityScore,
      // Every verse remains eligible; wellness-related verses are simply weighted higher.
      weight: 1 + priorityScore * 6,
    };
  });
}

async function loadVerseCatalog() {
  if (!verseCatalogPromise) {
    verseCatalogPromise = import("kjv/json/verses-1769.json").then((module) =>
      buildVerseCatalog(module.default as Record<string, string>),
    );
  }

  return verseCatalogPromise;
}

function extractPlainTextFromHtml(html: string) {
  if (typeof DOMParser === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

async function fetchNivVerse(reference: string) {
  if (!apiBibleKey || !nivBibleId) {
    throw new Error("NIV verse service is not configured yet. Add the API.Bible key and NIV Bible ID to your environment variables.");
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
    throw new Error("NIV verse service could not be reached right now.");
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

function pickWeightedVerse(entries: VerseSelectionEntry[], seed: string) {
  const totalWeight = entries.reduce((total, entry) => total + entry.weight, 0);
  const target = hashSeed(seed) % totalWeight;
  let runningWeight = 0;

  for (const entry of entries) {
    runningWeight += entry.weight;
    if (target < runningWeight) {
      return entry;
    }
  }

  return entries[0];
}

export async function getDailyVerse(dateKey: string) {
  const verseCatalog = await loadVerseCatalog();
  const selectedVerse = pickWeightedVerse(verseCatalog, dateKey);
  const nivVerse = await fetchNivVerse(selectedVerse.reference);

  return {
    id: selectedVerse.id,
    reference: nivVerse.reference,
    text: nivVerse.text,
    themes: selectedVerse.themes,
    priorityScore: selectedVerse.priorityScore,
    translation: "NIV",
    attribution: "Scripture text delivered via API.Bible. NIV is a trademark of Biblica.",
  } satisfies DailyVerse;
}
