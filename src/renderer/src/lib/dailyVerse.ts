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

export async function getDailyVerse(dateKey: string) {
  const response = await fetch(`/api/daily-verse?date=${encodeURIComponent(dateKey)}`);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Unable to load the NIV verse right now.");
  }

  return (await response.json()) as DailyVerse;
}
