import type { CardioQuickPreset, ExerciseRecord } from "@/lib/exerciseDatabase";

type CardioDraft = {
  exerciseId: string;
  exerciseName: string;
  durationMinutes: string;
  steps: string;
  miles: string;
  pace: string;
};

type CardioEntryFormProps = {
  selectedExercise: ExerciseRecord | null;
  draft: CardioDraft;
  presets: CardioQuickPreset[];
  onDraftChange: (field: keyof CardioDraft, value: string) => void;
  onApplyPreset: (preset: CardioQuickPreset) => void;
  onClear: () => void;
  onSubmit: () => void;
};

export function CardioEntryForm({
  selectedExercise,
  draft,
  presets,
  onDraftChange,
  onApplyPreset,
  onClear,
  onSubmit,
}: CardioEntryFormProps) {
  return (
    <div className="rounded-[24px] border border-sky-400/20 bg-sky-400/8 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200/70">Cardio box</p>
          <h4 className="mt-1 text-base font-semibold text-white">
            {selectedExercise ? selectedExercise.name : "Select a cardio exercise"}
          </h4>
          <p className="mt-2 text-sm text-slate-200/80">
            Steps, miles, optional time, pace, and estimated calories are tracked separately from strength entries.
          </p>
        </div>
        {selectedExercise?.calorieEstimatePerMinute ? (
          <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-100">
            ~{selectedExercise.calorieEstimatePerMinute.toFixed(1)} cal / min
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset)}
            className="rounded-full border border-sky-300/20 bg-slate-950/35 px-3 py-2 text-xs font-medium text-sky-100"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="0"
          step="1"
          value={draft.durationMinutes}
          onChange={(event) => onDraftChange("durationMinutes", event.target.value)}
          placeholder="Duration (min)"
          className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <input
          type="number"
          min="0"
          step="1"
          value={draft.steps}
          onChange={(event) => onDraftChange("steps", event.target.value)}
          placeholder="Steps"
          className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <input
          type="number"
          min="0"
          step="0.1"
          value={draft.miles}
          onChange={(event) => onDraftChange("miles", event.target.value)}
          placeholder="Miles"
          className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <input
          type="text"
          value={draft.pace}
          onChange={(event) => onDraftChange("pace", event.target.value)}
          placeholder="Pace (ex: 9:30 / mi)"
          className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-6 text-sky-100/75">
          Positive numeric values only. Steps and miles can be logged together or separately, and time stays optional.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClear}
            className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-200"
          >
            Remove exercise
          </button>
          <button type="button" onClick={onSubmit} className="rounded-[18px] bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950">
            Add cardio entry
          </button>
        </div>
      </div>
    </div>
  );
}
