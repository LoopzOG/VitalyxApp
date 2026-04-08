import { FilterChipGroup } from "@/components/FilterChipGroup";
import type { ExerciseCategory, EquipmentTag, ExerciseRecord, ExerciseTab } from "@/lib/exerciseDatabase";
import type { GroupedExerciseResults } from "@/lib/exerciseSearch";

type ExerciseDatabasePanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  tab: ExerciseTab;
  onTabChange: (value: ExerciseTab) => void;
  category: ExerciseCategory | "All";
  onCategoryChange: (value: ExerciseCategory | "All") => void;
  equipment: EquipmentTag | "All";
  onEquipmentChange: (value: EquipmentTag | "All") => void;
  muscle: string | "All";
  onMuscleChange: (value: string | "All") => void;
  groupedResults: GroupedExerciseResults;
  favorites: string[];
  onToggleFavorite: (exerciseId: string) => void;
  onSelectExercise: (exercise: ExerciseRecord) => void;
  recentExercises: ExerciseRecord[];
  dropdownResults: ExerciseRecord[];
  recentSearches: string[];
  onPickRecentSearch: (value: string) => void;
  categoryOptions: string[];
  equipmentOptions: string[];
  muscleOptions: string[];
};

const tabs: Array<{ id: ExerciseTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "strength", label: "Strength" },
  { id: "cardio", label: "Cardio" },
];

export function ExerciseDatabasePanel({
  query,
  onQueryChange,
  tab,
  onTabChange,
  category,
  onCategoryChange,
  equipment,
  onEquipmentChange,
  muscle,
  onMuscleChange,
  groupedResults,
  favorites,
  onToggleFavorite,
  onSelectExercise,
  recentExercises,
  dropdownResults,
  recentSearches,
  onPickRecentSearch,
  categoryOptions,
  equipmentOptions,
  muscleOptions,
}: ExerciseDatabasePanelProps) {
  const hasResults = groupedResults.cardio.length > 0 || groupedResults.strength.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onTabChange(entry.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                tab === entry.id ? "bg-white text-zinc-950" : "border border-white/10 bg-black/20 text-zinc-300"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by exercise, muscle, equipment, alias, or category"
          className="mt-4 w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />

        <div className="mt-3 rounded-[22px] border border-white/8 bg-black/20 p-2">
          {dropdownResults.length ? (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {dropdownResults.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => onSelectExercise(exercise)}
                  className="flex w-full items-start justify-between gap-3 rounded-[18px] px-3 py-3 text-left hover:bg-white/[0.05]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{exercise.name}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                          exercise.isCardio ? "bg-sky-400/15 text-sky-200" : "bg-emerald-400/15 text-emerald-200"
                        }`}
                      >
                        {exercise.isCardio ? "Cardio" : exercise.category}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-400">
                      {exercise.primaryMuscle}
                      {exercise.secondaryMuscles.length ? ` | ${exercise.secondaryMuscles.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      {exercise.equipment.join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(exercise.id);
                      }}
                      className={`rounded-full border px-2.5 py-1 text-[11px] ${
                        favorites.includes(exercise.id)
                          ? "border-amber-400/30 bg-amber-400/15 text-amber-200"
                          : "border-white/10 bg-black/20 text-zinc-300"
                      }`}
                    >
                      {favorites.includes(exercise.id) ? "Saved" : "Save"}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-zinc-500">No matches yet. Try another name, muscle, or equipment tag.</div>
          )}
        </div>

        <div className="mt-4 grid gap-4">
          <FilterChipGroup label="Category" options={categoryOptions} selected={category} onSelect={(value) => onCategoryChange(value as ExerciseCategory | "All")} />
          <FilterChipGroup label="Equipment" options={equipmentOptions} selected={equipment} onSelect={(value) => onEquipmentChange(value as EquipmentTag | "All")} />
          <FilterChipGroup label="Muscle" options={muscleOptions} selected={muscle} onSelect={onMuscleChange} />
        </div>
      </div>

      {recentSearches.length ? (
        <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onPickRecentSearch(value)}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-300"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {recentExercises.length ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recently used</p>
          <div className="grid gap-2">
            {recentExercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => onSelectExercise(exercise)}
                className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{exercise.name}</p>
                  <p className="mt-1 truncate text-xs text-zinc-400">{exercise.primaryMuscle} | {exercise.category}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] ${exercise.isCardio ? "bg-sky-400/15 text-sky-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                  {exercise.isCardio ? "Cardio" : "Lift"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!hasResults ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-zinc-400">
          No exercises matched that combination. Try a broader query, clear one of the filters, or switch between the strength and cardio tabs.
        </div>
      ) : null}
    </div>
  );
}
