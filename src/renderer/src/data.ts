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
  return `Add your own foods for ${day} and MoreX will keep the daily totals updated as you go.`;
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
