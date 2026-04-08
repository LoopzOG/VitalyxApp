export type PageKey =
  | "dashboard"
  | "meal-planner"
  | "recipes"
  | "workout-tracker"
  | "progress"
  | "grocery-budget"
  | "shopping-list"
  | "settings";

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type MealPreview = {
  meal: string;
  title: string;
  calories: number;
  protein: string;
  cost: string;
};

export type WorkoutPreview = {
  title: string;
  focus: string;
  duration: string;
  day: string;
  intensity: string;
};

export type RecipeItem = {
  title: string;
  calories: number;
  protein: string;
  cost: string;
  tags: string[];
  cuisine: string;
  difficulty: string;
};

export type WeeklyMealColumn = {
  day: string;
  meals: PlannerMeal[];
};

export type PlannerMeal = {
  id?: string;
  type: string;
  title: string;
  calories: number;
  protein: string;
  carbs?: string;
  fat?: string;
  cost: string;
  amount?: number;
  unit?: string;
};

export type PlannerDay = WeeklyMealColumn & {
  note: string;
};

export type WorkoutExercise = {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  pr?: string;
};

export type ExerciseCatalogItem = {
  name: string;
  aliases: string[];
  focus: string;
  primaryMuscles: string[];
  equipment: string;
  defaultSets: string;
  defaultReps: string;
  source: string;
};

export type BudgetRow = {
  item: string;
  category: string;
  store: string;
  price: string;
  trend: string;
};

export type ShoppingGroup = {
  category: string;
  totalCost: string;
  items: {
    name: string;
    amount: string;
    source: string;
    checked?: boolean;
  }[];
};

export type SettingField = {
  label: string;
  value: string;
  hint: string;
};

export type PortionUnit = "g" | "oz" | "serving" | "cup" | "tbsp" | "piece";

export type MacroProfile = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodCatalogItem = {
  name: string;
  aliases: string[];
  defaultAmount: number;
  unit: PortionUnit;
  macrosPerDefault: MacroProfile;
};

export const dashboardStats: DashboardStat[] = [
  { label: "Calories Today", value: "2,140", detail: "91% of goal" },
  { label: "Protein", value: "182g", detail: "+14g over target" },
  { label: "Workout Streak", value: "6 days", detail: "Last PR yesterday" },
  { label: "Weekly Grocery Spend", value: "$84.20", detail: "$7 under budget" },
];

export const mealPreview: MealPreview[] = [
  { meal: "Breakfast", title: "Overnight Oats + Whey", calories: 430, protein: "31g", cost: "$2.90" },
  { meal: "Lunch", title: "Chicken Burrito Bowl", calories: 620, protein: "48g", cost: "$6.80" },
  { meal: "Dinner", title: "Salmon Rice Plate", calories: 710, protein: "52g", cost: "$8.40" },
];

export const upcomingWorkouts: WorkoutPreview[] = [
  { title: "Push Day", focus: "Chest, shoulders, triceps", duration: "52 min", day: "Monday", intensity: "Heavy" },
  { title: "Pull Day", focus: "Back, biceps, rear delts", duration: "48 min", day: "Wednesday", intensity: "Moderate" },
  { title: "Leg Day", focus: "Quads, hamstrings, glutes", duration: "60 min", day: "Friday", intensity: "Heavy" },
];

export const recipes: RecipeItem[] = [
  { title: "High Protein Pasta", calories: 580, protein: "42g", cost: "$5.30", tags: ["Dinner", "Budget"], cuisine: "Italian", difficulty: "Easy" },
  { title: "Anabolic French Toast", calories: 460, protein: "33g", cost: "$3.70", tags: ["Breakfast", "High Protein"], cuisine: "American", difficulty: "Easy" },
  { title: "Chicken Burrito Bowl", calories: 620, protein: "48g", cost: "$6.80", tags: ["Meal Prep", "Gym"], cuisine: "Mexican", difficulty: "Medium" },
  { title: "Greek Yogurt Parfait", calories: 320, protein: "24g", cost: "$2.80", tags: ["Snack", "Quick"], cuisine: "Mediterranean", difficulty: "Easy" },
  { title: "Honey Chili Turkey Wrap", calories: 510, protein: "39g", cost: "$4.95", tags: ["Lunch"], cuisine: "Fusion", difficulty: "Easy" },
  { title: "Teriyaki Beef Rice Bowl", calories: 690, protein: "46g", cost: "$7.45", tags: ["Dinner", "Performance"], cuisine: "Asian", difficulty: "Medium" },
];

export const weeklyPlanner: WeeklyMealColumn[] = [
  { day: "Monday", meals: [] },
  { day: "Tuesday", meals: [] },
  { day: "Wednesday", meals: [] },
  { day: "Thursday", meals: [] },
  { day: "Friday", meals: [] },
  { day: "Saturday", meals: [] },
  { day: "Sunday", meals: [] },
];

export function buildPlannerNote(day: string) {
  return `Add your own foods for ${day} and Vitalyx will keep the daily totals updated as you go.`;
}

export function createInitialPlanner(): PlannerDay[] {
  return weeklyPlanner.map((day) => ({
    ...day,
    meals: [],
    note: buildPlannerNote(day.day),
  }));
}

const legacySeededMealTitles = new Set([
  "Overnight Oats",
  "Chicken Burrito Bowl",
  "Salmon Rice Plate",
  "Greek Yogurt Parfait",
  "Turkey Wrap",
  "High Protein Pasta",
  "Egg White Toast Stack",
  "Protein Smoothie",
  "Greek Chicken Plate",
  "Anabolic French Toast",
  "Parfait Bowl",
  "Beef Rice Bowl",
  "Homemade Sushi Bake",
  "Recovery Oats",
  "Meal Prep Reset",
  "Teriyaki Beef Bowl",
]);

export function isLegacySeededPlanner(planner: PlannerDay[]) {
  return planner.some((day) => day.meals.some((meal) => legacySeededMealTitles.has(meal.title)));
}

export function normalizePlanner(planner: PlannerDay[] | null | undefined): PlannerDay[] {
  if (!planner || planner.length !== weeklyPlanner.length || isLegacySeededPlanner(planner)) {
    return createInitialPlanner();
  }

  return weeklyPlanner.map((day, index) => ({
    day: planner[index]?.day ?? day.day,
    note: planner[index]?.note ?? buildPlannerNote(day.day),
    meals: (planner[index]?.meals ?? []).map((meal) => ({
      ...meal,
      id: meal.id ?? crypto.randomUUID(),
      carbs: meal.carbs ?? "0g",
      fat: meal.fat ?? "0g",
      amount: meal.amount ?? 1,
      unit: meal.unit ?? "serving",
    })),
  }));
}

export const foodCatalog: FoodCatalogItem[] = [
  {
    name: "Chicken breast",
    aliases: ["chicken", "grilled chicken", "chicken breast"],
    defaultAmount: 4,
    unit: "oz",
    macrosPerDefault: { calories: 187, protein: 35, carbs: 0, fat: 4 },
  },
  {
    name: "Ground turkey",
    aliases: ["turkey", "ground turkey"],
    defaultAmount: 4,
    unit: "oz",
    macrosPerDefault: { calories: 170, protein: 22, carbs: 0, fat: 9 },
  },
  {
    name: "Salmon",
    aliases: ["salmon", "atlantic salmon"],
    defaultAmount: 4,
    unit: "oz",
    macrosPerDefault: { calories: 233, protein: 25, carbs: 0, fat: 14 },
  },
  {
    name: "White rice",
    aliases: ["rice", "white rice", "jasmine rice"],
    defaultAmount: 1,
    unit: "cup",
    macrosPerDefault: { calories: 205, protein: 4, carbs: 45, fat: 0.4 },
  },
  {
    name: "Brown rice",
    aliases: ["brown rice"],
    defaultAmount: 1,
    unit: "cup",
    macrosPerDefault: { calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  },
  {
    name: "Oats",
    aliases: ["oats", "rolled oats", "oatmeal"],
    defaultAmount: 40,
    unit: "g",
    macrosPerDefault: { calories: 154, protein: 5, carbs: 27, fat: 3 },
  },
  {
    name: "Greek yogurt",
    aliases: ["greek yogurt", "yogurt"],
    defaultAmount: 170,
    unit: "g",
    macrosPerDefault: { calories: 100, protein: 17, carbs: 6, fat: 0 },
  },
  {
    name: "Whole egg",
    aliases: ["egg", "whole egg", "eggs"],
    defaultAmount: 1,
    unit: "piece",
    macrosPerDefault: { calories: 72, protein: 6, carbs: 0.4, fat: 5 },
  },
  {
    name: "Egg whites",
    aliases: ["egg whites", "egg white"],
    defaultAmount: 100,
    unit: "g",
    macrosPerDefault: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  },
  {
    name: "Whey protein",
    aliases: ["whey", "whey protein", "protein powder"],
    defaultAmount: 1,
    unit: "serving",
    macrosPerDefault: { calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  },
  {
    name: "Peanut butter",
    aliases: ["peanut butter"],
    defaultAmount: 1,
    unit: "tbsp",
    macrosPerDefault: { calories: 95, protein: 4, carbs: 3.5, fat: 8 },
  },
  {
    name: "Avocado",
    aliases: ["avocado"],
    defaultAmount: 100,
    unit: "g",
    macrosPerDefault: { calories: 160, protein: 2, carbs: 9, fat: 15 },
  },
  {
    name: "Banana",
    aliases: ["banana"],
    defaultAmount: 1,
    unit: "piece",
    macrosPerDefault: { calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  },
  {
    name: "Sweet potato",
    aliases: ["sweet potato"],
    defaultAmount: 100,
    unit: "g",
    macrosPerDefault: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  },
  {
    name: "Broccoli",
    aliases: ["broccoli"],
    defaultAmount: 100,
    unit: "g",
    macrosPerDefault: { calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  },
];

export const workoutSplit = [
  { day: "Mon", title: "Push Day", summary: "Heavy bench, incline press, cable flys" },
  { day: "Wed", title: "Pull Day", summary: "Rows, pull-ups, curls, rear delt work" },
  { day: "Fri", title: "Leg Day", summary: "Squats, RDLs, split squats, calves" },
  { day: "Sat", title: "Conditioning", summary: "Incline walk, sled pushes, mobility" },
];

export const workoutExercises: WorkoutExercise[] = [
  { name: "Bench Press", sets: "4", reps: "5-8", weight: "225 lb", pr: "PR +10" },
  { name: "Incline Dumbbell Press", sets: "3", reps: "8-10", weight: "80 lb" },
  { name: "Cable Fly", sets: "3", reps: "12-15", weight: "35 lb" },
  { name: "Seated Shoulder Press", sets: "3", reps: "8-10", weight: "70 lb" },
  { name: "Rope Pushdown", sets: "3", reps: "12-15", weight: "55 lb" },
];

export const exerciseCatalog: ExerciseCatalogItem[] = [
  {
    name: "Bench Press",
    aliases: ["bench", "bench press", "barbell bench press"],
    focus: "Heavy horizontal pressing",
    primaryMuscles: ["Chest", "Front delts", "Triceps"],
    equipment: "Barbell and bench",
    defaultSets: "4",
    defaultReps: "5-8",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Incline Dumbbell Press",
    aliases: ["incline dumbbell press", "incline press", "incline db press"],
    focus: "Upper-chest pressing",
    primaryMuscles: ["Upper chest", "Shoulders", "Triceps"],
    equipment: "Adjustable bench and dumbbells",
    defaultSets: "3",
    defaultReps: "8-10",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Overhead Press",
    aliases: ["overhead press", "shoulder press", "barbell overhead press", "ohp"],
    focus: "Vertical pressing strength",
    primaryMuscles: ["Shoulders", "Triceps", "Upper chest"],
    equipment: "Barbell or dumbbells",
    defaultSets: "4",
    defaultReps: "5-8",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Cable Fly",
    aliases: ["cable fly", "cable crossover", "fly"],
    focus: "Chest isolation and stretch",
    primaryMuscles: ["Chest", "Front delts"],
    equipment: "Cable machine",
    defaultSets: "3",
    defaultReps: "12-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Lateral Raise",
    aliases: ["lateral raise", "dumbbell lateral raise", "side raise"],
    focus: "Shoulder width and isolation",
    primaryMuscles: ["Side delts"],
    equipment: "Dumbbells or cables",
    defaultSets: "3",
    defaultReps: "12-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Rope Pushdown",
    aliases: ["rope pushdown", "triceps pushdown", "pushdown"],
    focus: "Triceps lockout work",
    primaryMuscles: ["Triceps"],
    equipment: "Cable machine",
    defaultSets: "3",
    defaultReps: "10-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Pull-Up",
    aliases: ["pull-up", "pull up", "chin over bar"],
    focus: "Vertical pulling strength",
    primaryMuscles: ["Lats", "Upper back", "Biceps"],
    equipment: "Pull-up bar",
    defaultSets: "3",
    defaultReps: "6-10",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Chin-Up",
    aliases: ["chin-up", "chin up", "underhand pull-up"],
    focus: "Lats and biceps pulling",
    primaryMuscles: ["Lats", "Biceps", "Upper back"],
    equipment: "Pull-up bar",
    defaultSets: "3",
    defaultReps: "6-10",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Barbell Row",
    aliases: ["barbell row", "bent-over barbell row", "barbell bent over row"],
    focus: "Back thickness and pulling strength",
    primaryMuscles: ["Lats", "Rhomboids", "Rear delts", "Biceps"],
    equipment: "Barbell",
    defaultSets: "4",
    defaultReps: "6-10",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Single-Arm Dumbbell Row",
    aliases: ["single-arm row", "single arm dumbbell row", "one-arm row"],
    focus: "Unilateral back development",
    primaryMuscles: ["Lats", "Rhomboids", "Biceps"],
    equipment: "Bench and dumbbell",
    defaultSets: "3",
    defaultReps: "8-12",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Face Pull",
    aliases: ["face pull", "cable face pull"],
    focus: "Rear-delt and upper-back balance",
    primaryMuscles: ["Rear delts", "Upper back", "Rotator cuff"],
    equipment: "Cable machine and rope",
    defaultSets: "3",
    defaultReps: "12-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Hammer Curl",
    aliases: ["hammer curl", "dumbbell hammer curl"],
    focus: "Biceps and brachialis growth",
    primaryMuscles: ["Biceps", "Brachialis", "Forearms"],
    equipment: "Dumbbells",
    defaultSets: "3",
    defaultReps: "10-12",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Romanian Deadlift",
    aliases: ["romanian deadlift", "rdl", "barbell rdl"],
    focus: "Posterior-chain hinge strength",
    primaryMuscles: ["Hamstrings", "Glutes", "Lower back"],
    equipment: "Barbell or dumbbells",
    defaultSets: "4",
    defaultReps: "6-10",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Deadlift",
    aliases: ["deadlift", "conventional deadlift", "barbell deadlift"],
    focus: "Full-body pulling strength",
    primaryMuscles: ["Hamstrings", "Glutes", "Back", "Core"],
    equipment: "Barbell",
    defaultSets: "3",
    defaultReps: "3-6",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Front Squat",
    aliases: ["front squat", "barbell front squat"],
    focus: "Quad-dominant squat pattern",
    primaryMuscles: ["Quadriceps", "Glutes", "Core"],
    equipment: "Barbell",
    defaultSets: "4",
    defaultReps: "5-8",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Bulgarian Split Squat",
    aliases: ["bulgarian split squat", "rear foot elevated split squat", "split squat"],
    focus: "Single-leg strength and stability",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: "Bench and dumbbells",
    defaultSets: "3",
    defaultReps: "8-12",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Walking Lunge",
    aliases: ["walking lunge", "dumbbell walking lunge"],
    focus: "Single-leg volume and conditioning",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: "Body weight or dumbbells",
    defaultSets: "2",
    defaultReps: "10-12",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Leg Extension",
    aliases: ["leg extension", "machine leg extension", "quad extension"],
    focus: "Quad isolation",
    primaryMuscles: ["Quadriceps"],
    equipment: "Machine",
    defaultSets: "3",
    defaultReps: "12-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Leg Curl",
    aliases: ["leg curl", "lying leg curl", "seated leg curl"],
    focus: "Hamstring isolation",
    primaryMuscles: ["Hamstrings"],
    equipment: "Machine",
    defaultSets: "3",
    defaultReps: "10-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Hip Thrust",
    aliases: ["hip thrust", "barbell hip thrust", "glute thrust"],
    focus: "Glute strength and lockout power",
    primaryMuscles: ["Glutes", "Hamstrings"],
    equipment: "Barbell and bench",
    defaultSets: "4",
    defaultReps: "8-12",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Standing Calf Raise",
    aliases: ["standing calf raise", "calf raise machine", "calf raises"],
    focus: "Calf strength and endurance",
    primaryMuscles: ["Calves"],
    equipment: "Machine, dumbbells, or body weight",
    defaultSets: "4",
    defaultReps: "12-20",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Seated Calf Raise",
    aliases: ["seated calf raise", "seated calf machine"],
    focus: "Soleus-focused calf work",
    primaryMuscles: ["Calves"],
    equipment: "Machine",
    defaultSets: "3",
    defaultReps: "15-20",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Plank",
    aliases: ["plank", "front plank"],
    focus: "Core bracing endurance",
    primaryMuscles: ["Core", "Shoulders"],
    equipment: "Body weight",
    defaultSets: "3",
    defaultReps: "30-60 sec",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Hanging Knee Raise",
    aliases: ["hanging knee raise", "knee raise", "captains chair raise"],
    focus: "Lower-ab and hip-flexor control",
    primaryMuscles: ["Abs", "Hip flexors"],
    equipment: "Pull-up bar or captain's chair",
    defaultSets: "3",
    defaultReps: "10-15",
    source: "Vitalyx strength exercise library",
  },
  {
    name: "Squat",
    aliases: ["bodyweight squat", "squat exercise", "squat"],
    focus: "Lower body strength",
    primaryMuscles: ["Quadriceps", "Hamstrings", "Glutes"],
    equipment: "Body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Lunge",
    aliases: ["stationary lunge", "traveling lunge", "lunge exercise", "lunge"],
    focus: "Single-leg lower body work",
    primaryMuscles: ["Quadriceps", "Hamstrings", "Glutes"],
    equipment: "Body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Modified Pushup",
    aliases: ["modified pushup", "pushup", "push-up"],
    focus: "Upper-body pressing",
    primaryMuscles: ["Chest", "Shoulders", "Triceps"],
    equipment: "Body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Step-Up",
    aliases: ["step-up exercise", "step up", "step-up"],
    focus: "Leg drive and balance",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: "Bench or box",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Bent-Over Row",
    aliases: ["bent-over row", "bent over row", "row"],
    focus: "Upper-back pulling",
    primaryMuscles: ["Lats", "Rhomboids", "Biceps"],
    equipment: "Resistance band or dumbbell",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Biceps Curl",
    aliases: ["biceps curl", "curl"],
    focus: "Arm flexion",
    primaryMuscles: ["Biceps", "Forearms"],
    equipment: "Resistance band, dumbbell, barbell, or machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Hamstring Curl",
    aliases: ["hamstring curl", "leg curl"],
    focus: "Posterior-chain accessory work",
    primaryMuscles: ["Hamstrings"],
    equipment: "Resistance band or machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Hip Abduction Walk",
    aliases: ["hip abduction walk", "band walk", "lateral walk"],
    focus: "Hip stability",
    primaryMuscles: ["Glute medius", "Glutes"],
    equipment: "Resistance band",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Standing Hip Abduction",
    aliases: ["standing hip abduction", "hip abduction"],
    focus: "Hip and glute control",
    primaryMuscles: ["Glutes", "Hip stabilizers"],
    equipment: "Resistance band",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Chest Press",
    aliases: ["chest press", "dumbbell chest press", "machine chest press"],
    focus: "Horizontal press",
    primaryMuscles: ["Chest", "Shoulders", "Triceps"],
    equipment: "Dumbbell or machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Reverse Fly",
    aliases: ["reverse fly", "rear delt fly"],
    focus: "Upper-back and rear shoulder work",
    primaryMuscles: ["Rear delts", "Upper back"],
    equipment: "Dumbbell",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Calf Raise",
    aliases: ["calf raise", "standing calf raise"],
    focus: "Lower-leg strength",
    primaryMuscles: ["Calves"],
    equipment: "Dumbbell or body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Triceps Extension",
    aliases: ["triceps extension", "overhead triceps extension"],
    focus: "Arm extension",
    primaryMuscles: ["Triceps"],
    equipment: "Dumbbell or machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Lat Pull-Down",
    aliases: ["lat pull-down", "lat pulldown", "pulldown"],
    focus: "Vertical pulling",
    primaryMuscles: ["Lats", "Upper back", "Biceps"],
    equipment: "Machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Seated Row",
    aliases: ["seated row", "machine row"],
    focus: "Back thickness",
    primaryMuscles: ["Lats", "Rhomboids", "Biceps"],
    equipment: "Machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Knee Extension",
    aliases: ["knee extension", "leg extension"],
    focus: "Quad isolation",
    primaryMuscles: ["Quadriceps"],
    equipment: "Machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Seated Leg Press",
    aliases: ["seated leg press", "leg press"],
    focus: "Compound leg press",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: "Machine",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic strength-training videos",
  },
  {
    name: "Abdominal Crunch",
    aliases: ["abdominal crunch", "crunch"],
    focus: "Core flexion",
    primaryMuscles: ["Abs"],
    equipment: "Body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic core-strength guidance",
  },
  {
    name: "Bridge",
    aliases: ["bridge", "glute bridge"],
    focus: "Core and glute stability",
    primaryMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: "Body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic core-strength guidance",
  },
  {
    name: "Modified Plank",
    aliases: ["modified plank", "plank"],
    focus: "Core stability",
    primaryMuscles: ["Core", "Shoulders"],
    equipment: "Body weight",
    defaultSets: "1",
    defaultReps: "12",
    source: "Mayo Clinic core-strength guidance",
  },
];

export const progressKpis = [
  { label: "Body Weight", value: "187.4 lb", change: "-1.2 lb month" },
  { label: "Bench PR", value: "225 x 5", change: "+10 lb" },
  { label: "Calorie Adherence", value: "89%", change: "+6%" },
  { label: "Avg Grocery Spend", value: "$92 / week", change: "-$8" },
];

export const chartCards = [
  { title: "Body Weight Trend", subtitle: "Weekly average body weight across the last 12 weeks" },
  { title: "Strength Progress", subtitle: "Top-set progression for bench, squat, and pull day compounds" },
  { title: "Calorie Consistency", subtitle: "Daily intake versus target with adherence bands" },
  { title: "Grocery Spend Trends", subtitle: "Store totals and weekly cost drift across staples" },
];

export const budgetSummary = [
  { label: "Monthly Budget", value: "$420", detail: "Current target" },
  { label: "Projected Spend", value: "$388", detail: "Based on active plan" },
  { label: "Savings", value: "$32", detail: "Versus target" },
  { label: "Price Alerts", value: "6", detail: "Staples moved this week" },
];

export const budgetRows: BudgetRow[] = [
  { item: "Chicken Breast", category: "Protein", store: "Costco", price: "$3.29/lb", trend: "-4%" },
  { item: "Eggs", category: "Breakfast", store: "Trader Joe's", price: "$2.89/dozen", trend: "+2%" },
  { item: "Greek Yogurt", category: "Dairy", store: "Walmart", price: "$4.49/tub", trend: "-1%" },
  { item: "Rice", category: "Pantry", store: "Target", price: "$1.12/lb", trend: "Stable" },
  { item: "Salmon", category: "Protein", store: "Whole Foods", price: "$8.99/lb", trend: "+3%" },
];

export const storeComparison = [
  { store: "Costco", spend: "$118", note: "Best protein pricing" },
  { store: "Trader Joe's", spend: "$84", note: "Best produce and snacks" },
  { store: "Target", spend: "$96", note: "Convenient pantry refill" },
];

export const shoppingGroups: ShoppingGroup[] = [
  {
    category: "Protein",
    totalCost: "$31.20",
    items: [
      { name: "Chicken Breast", amount: "4 lb", source: "Meal plan", checked: true },
      { name: "Salmon Fillets", amount: "2 lb", source: "Dinner rotation" },
      { name: "Greek Yogurt", amount: "2 tubs", source: "Breakfast and snacks" },
    ],
  },
  {
    category: "Produce",
    totalCost: "$18.45",
    items: [
      { name: "Blueberries", amount: "2 cartons", source: "Breakfast" },
      { name: "Bell Peppers", amount: "6 count", source: "Burrito bowls", checked: true },
      { name: "Spinach", amount: "2 bags", source: "Lunch prep" },
    ],
  },
  {
    category: "Pantry",
    totalCost: "$22.10",
    items: [
      { name: "Jasmine Rice", amount: "10 lb", source: "Core staple" },
      { name: "Rolled Oats", amount: "1 large bag", source: "Breakfast prep" },
      { name: "Honey Chili Sauce", amount: "1 bottle", source: "Wraps" },
    ],
  },
];

export const profileSettings: SettingField[] = [
  { label: "Display Name", value: "Dana Rivers", hint: "Shown across plans and exports" },
  { label: "Default Workspace", value: "Performance Dashboard", hint: "Landing page when the app opens" },
  { label: "Time Zone", value: "Eastern Time", hint: "Used for logs and scheduling" },
];

export const nutritionSettings: SettingField[] = [
  { label: "Daily Calories", value: "2,350 kcal", hint: "Lean bulk target" },
  { label: "Protein Goal", value: "168 g", hint: "High priority nutrition target" },
  { label: "Meal Prep Days", value: "Sunday / Wednesday", hint: "Used for meal planner reminders" },
];

export const fitnessSettings: SettingField[] = [
  { label: "Primary Goal", value: "Build muscle", hint: "Shapes your workout emphasis" },
  { label: "Training Days", value: "4 days / week", hint: "Current split structure" },
  { label: "Preferred Log Style", value: "Table + detail panel", hint: "Optimized for larger screens while staying mobile-friendly" },
];

export const budgetSettings: SettingField[] = [
  { label: "Weekly Grocery Cap", value: "$105", hint: "Soft warning above this level" },
  { label: "Preferred Stores", value: "Costco, Trader Joe's, Target", hint: "Used for price comparisons" },
  { label: "Price Alert Threshold", value: "5%", hint: "Highlight meaningful price swings" },
];
