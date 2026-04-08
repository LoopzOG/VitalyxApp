import { HeartPulse } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import type { DailyVerse } from "@/lib/dailyVerse";

type VerseOfTheDayCardProps = {
  verse: DailyVerse | null;
  isLoading: boolean;
};

export function VerseOfTheDayCard({ verse, isLoading }: VerseOfTheDayCardProps) {
  return (
    <SectionCard eyebrow="Daily encouragement" title="Verse of the day">
      <div className="rounded-[24px] border border-emerald-400/15 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.16),rgba(11,15,18,0.94)_68%)] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-emerald-200">
            <HeartPulse size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Wellness-focused scripture</p>
            <p className="mt-1 text-sm text-emerald-100/75">
              A new verse is selected every day, with extra weight given to peace, strength, healing, and resilience.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/8 bg-black/20 p-5">
          {isLoading ? (
            <p className="text-sm leading-7 text-zinc-400">Loading today&apos;s verse...</p>
          ) : verse ? (
            <>
              <p className="text-base leading-8 text-zinc-100">&ldquo;{verse.text}&rdquo;</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                  {verse.reference}
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-100">
                  {verse.translation}
                </span>
                {verse.themes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-zinc-200"
                  >
                    {theme}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-zinc-500">{verse.attribution}</p>
            </>
          ) : (
            <p className="text-sm leading-7 text-zinc-400">
              Today&apos;s NIV verse could not be loaded right now. Add the API.Bible credentials for NIV, then refresh and the section will try again.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
