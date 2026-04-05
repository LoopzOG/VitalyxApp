import { useEffect, useMemo, useState } from "react";
import { workoutExercises, workoutSplit } from "@/data";
import { SectionCard } from "@/components/SectionCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { listenForPageActions } from "@/lib/pageActions";

export function WorkoutTrackerPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [highlightSplit, setHighlightSplit] = useState(false);
  const [status, setStatus] = useState("Start a workout to begin the logging flow.");

  const activeWorkout = useMemo(
    () => (sessionStarted ? "Push Day in progress" : "Ready to begin Push Day"),
    [sessionStarted],
  );

  function startWorkout() {
    setSessionStarted(true);
    setStatus("Workout timer started. You can now save this session.");
  }

  function saveSession() {
    const nextSavedAt = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    setSavedAt(nextSavedAt);
    setSessionStarted(false);
    setStatus(`Session saved at ${nextSavedAt}.`);
  }

  function viewSplit() {
    setHighlightSplit(true);
    setStatus("Workout split highlighted for review.");
  }

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "workout-tracker") {
          return;
        }
        if (action === "start-workout") {
          startWorkout();
        }
        if (action === "view-split") {
          viewSplit();
        }
      }),
    [],
  );

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.8fr_1.2fr_0.7fr]">
      <SectionCard eyebrow="Workout Split" title="Weekly structure">
        <div className="space-y-3">
          {workoutSplit.map((workout) => (
            <div
              key={workout.title}
              className={highlightSplit ? "rounded-[28px] ring-2 ring-emerald-400/35" : ""}
            >
              <WorkoutCard
                title={workout.title}
                focus={workout.summary}
                duration="45-60 min"
                day={workout.day}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Workout Logger"
        title={activeWorkout}
        action={
          <button
            type="button"
            onClick={saveSession}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Save Session
          </button>
        }
      >
        <div className="mb-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {status}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-3 font-medium">Exercise</th>
                <th className="pb-3 font-medium">Sets</th>
                <th className="pb-3 font-medium">Reps</th>
                <th className="pb-3 font-medium">Weight</th>
                <th className="pb-3 font-medium">PR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {workoutExercises.map((exercise) => (
                <tr key={exercise.name}>
                  <td className="py-4 pr-4 text-white">{exercise.name}</td>
                  <td className="py-4 pr-4 text-zinc-300">{exercise.sets}</td>
                  <td className="py-4 pr-4 text-zinc-300">{exercise.reps}</td>
                  <td className="py-4 pr-4">
                    <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-zinc-200">
                      {exercise.weight}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    {exercise.pr ? (
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        {exercise.pr}
                      </span>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Session Detail" title="Current workout">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <p className="text-sm text-zinc-400">Focus</p>
            <p className="mt-2 font-medium text-white">Upper push hypertrophy with one heavy top set.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <p className="text-sm text-zinc-400">Notes</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              Keep rest periods tight on accessory work. Highlight any rep PRs and shoulder fatigue before final pressing volume.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-zinc-400">
            {savedAt ? `Most recent save: ${savedAt}.` : "Reserved for set-by-set history, exercise swap tools, and previous-session comparisons."}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
