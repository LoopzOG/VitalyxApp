export type VerseTheme = "Physical Health" | "Mental Health" | "Spiritual Strength";

export type DailyVerse = {
  id: string;
  reference: string;
  text: string;
  themes: VerseTheme[];
  priorityScore: number;
};

type VerseCatalogEntry = DailyVerse & {
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

let verseCatalogPromise: Promise<VerseCatalogEntry[]> | null = null;

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

function buildVerseCatalog(rawVerses: Record<string, string>) {
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

function pickWeightedVerse(entries: VerseCatalogEntry[], seed: string) {
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

  return {
    id: selectedVerse.id,
    reference: selectedVerse.reference,
    text: selectedVerse.text,
    themes: selectedVerse.themes,
    priorityScore: selectedVerse.priorityScore,
  } satisfies DailyVerse;
}
