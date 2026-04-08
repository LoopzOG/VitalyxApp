import { getDailyVerseSelection, type VerseTheme } from "../../../shared/dailyVerseSelection";

export type { VerseTheme };

export type DailyVerse = {
  id: string;
  reference: string;
  text: string;
  themes: VerseTheme[];
  priorityScore: number;
  translation: "KJV";
  attribution: string;
};

let verseTextPromise: Promise<Record<string, string>> | null = null;

function cleanVerseText(text: string) {
  return text
    .replace(/^#\s*/, "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadVerseTextMap() {
  if (!verseTextPromise) {
    verseTextPromise = import("kjv/json/verses-1769.json").then((module) => module.default as Record<string, string>);
  }

  return verseTextPromise;
}

export async function getDailyVerse(dateKey: string) {
  const [selection, verseMap] = await Promise.all([
    getDailyVerseSelection(dateKey),
    loadVerseTextMap(),
  ]);

  const verseText = verseMap[selection.reference];
  if (!verseText) {
    throw new Error("Unable to find today's verse text.");
  }

  return {
    id: selection.id,
    reference: selection.reference,
    text: cleanVerseText(verseText),
    themes: selection.themes,
    priorityScore: selection.priorityScore,
    translation: "KJV",
    attribution: "Scripture text from the public domain King James Version.",
  } satisfies DailyVerse;
}
