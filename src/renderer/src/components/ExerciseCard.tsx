import type { ExerciseRecord } from "@/lib/exerciseDatabase";

type ExerciseCardProps = {
  exercise: ExerciseRecord;
  isFavorite: boolean;
  onSelect: (exercise: ExerciseRecord) => void;
  onToggleFavorite: (exerciseId: string) => void;
};

export function ExerciseCard({ exercise, isFavorite, onSelect, onToggleFavorite }: ExerciseCardProps) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{exercise.name}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${
                exercise.isCardio ? "bg-sky-400/15 text-sky-200" : "bg-emerald-400/15 text-emerald-200"
              }`}
            >
              {exercise.isCardio ? "Cardio" : exercise.category}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-300">
            Primary: {exercise.primaryMuscle}
            {exercise.secondaryMuscles.length ? ` | Secondary: ${exercise.secondaryMuscles.join(", ")}` : ""}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
            {exercise.movementPattern} | {exercise.difficulty}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(exercise.id)}
          className={`rounded-full border px-3 py-1.5 text-xs ${
            isFavorite ? "border-amber-400/30 bg-amber-400/15 text-amber-200" : "border-white/10 bg-black/20 text-zinc-300"
          }`}
        >
          {isFavorite ? "Favorited" : "Favorite"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {exercise.equipment.map((item) => (
          <span key={item} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-zinc-300">
            {item}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm leading-6 text-zinc-400">{exercise.instructions[0]}</p>

      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className={`mt-4 w-full rounded-[18px] px-4 py-3 text-sm font-semibold ${
          exercise.isCardio ? "bg-sky-400 text-slate-950" : "bg-emerald-400 text-zinc-950"
        }`}
      >
        {exercise.isCardio ? "Use for cardio log" : "Use for strength log"}
      </button>
    </div>
  );
}
