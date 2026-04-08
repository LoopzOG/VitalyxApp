import type { ExerciseCategory, EquipmentTag, ExerciseRecord, ExerciseTab } from "@/lib/exerciseDatabase";

export type ExerciseSearchFilters = {
  query: string;
  tab: ExerciseTab;
  category: ExerciseCategory | "All";
  equipment: EquipmentTag | "All";
  muscle: string | "All";
};

export type GroupedExerciseResults = {
  strength: Array<{ category: string; exercises: ExerciseRecord[] }>;
  cardio: ExerciseRecord[];
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= b.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function buildSearchIndex(exercise: ExerciseRecord) {
  return [
    exercise.name,
    ...exercise.aliases,
    exercise.primaryMuscle,
    ...exercise.secondaryMuscles,
    ...exercise.equipment,
    exercise.category,
    exercise.movementPattern,
    exercise.difficulty,
  ].map(normalize);
}

function scoreExercise(exercise: ExerciseRecord, query: string) {
  if (!query) {
    return exercise.isPopular ? 200 : 0;
  }

  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const searchTerms = buildSearchIndex(exercise);

  let score = 0;

  for (const term of searchTerms) {
    if (term === normalizedQuery) score += 240;
    if (term.startsWith(normalizedQuery)) score += 160;
    if (term.includes(normalizedQuery)) score += 100;

    for (const token of tokens) {
      if (!token) continue;
      if (term === token) score += 80;
      if (term.startsWith(token)) score += 50;
      if (term.includes(token)) score += 30;

      if (token.length >= 4) {
        const distance = levenshtein(term.slice(0, Math.min(term.length, token.length + 2)), token);
        if (distance <= 1) score += 25;
        if (distance === 2) score += 10;
      }
    }
  }

  if (exercise.isPopular) {
    score += 6;
  }

  return score;
}

export function getMuscleOptions(exercises: ExerciseRecord[]) {
  return Array.from(
    new Set(exercises.flatMap((exercise) => [exercise.primaryMuscle, ...exercise.secondaryMuscles])),
  ).sort((left, right) => left.localeCompare(right));
}

export function getPopularExercises(exercises: ExerciseRecord[], tab: ExerciseTab) {
  return exercises.filter((exercise) => {
    if (tab === "strength") return !exercise.isCardio && exercise.isPopular;
    if (tab === "cardio") return exercise.isCardio && exercise.isPopular;
    return exercise.isPopular;
  });
}

export function searchExercises(exercises: ExerciseRecord[], filters: ExerciseSearchFilters) {
  return exercises
    .filter((exercise) => {
      if (filters.tab === "strength" && exercise.isCardio) return false;
      if (filters.tab === "cardio" && !exercise.isCardio) return false;
      if (filters.category !== "All" && exercise.category !== filters.category) return false;
      if (filters.equipment !== "All" && !exercise.equipment.includes(filters.equipment)) return false;
      if (filters.muscle !== "All" && exercise.primaryMuscle !== filters.muscle && !exercise.secondaryMuscles.includes(filters.muscle)) return false;
      return true;
    })
    .map((exercise) => ({ exercise, score: scoreExercise(exercise, filters.query) }))
    .filter(({ score }) => !filters.query || score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.exercise.name.localeCompare(right.exercise.name);
    })
    .map(({ exercise }) => exercise);
}

export function groupExerciseResults(exercises: ExerciseRecord[]): GroupedExerciseResults {
  const strengthGroups = Array.from(
    exercises
      .filter((exercise) => !exercise.isCardio)
      .reduce((groups, exercise) => {
        const current = groups.get(exercise.category) ?? [];
        current.push(exercise);
        groups.set(exercise.category, current);
        return groups;
      }, new Map<string, ExerciseRecord[]>()),
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, groupedExercises]) => ({
      category,
      exercises: groupedExercises.sort((left, right) => left.name.localeCompare(right.name)),
    }));

  return {
    strength: strengthGroups,
    cardio: exercises.filter((exercise) => exercise.isCardio),
  };
}

export function getExerciseMap(exercises: ExerciseRecord[]) {
  return new Map(exercises.map((exercise) => [exercise.id, exercise]));
}

export function formatExerciseSearch(query: string) {
  return normalize(query);
}
