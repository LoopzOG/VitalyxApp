import { useEffect, useRef, useState } from "react";
import { Apple, Dumbbell, Footprints, Goal, Repeat, RotateCcw, Settings2, Wallet } from "lucide-react";
import {
  createInitialPlanner,
  exerciseCatalog,
  fitnessSettings,
  nutritionSettings,
  profileSettings,
  progressKpis,
  workoutSplit,
  type ExerciseCatalogItem,
  type PlannerMeal,
} from "@/data";
import { AddItemForm } from "@/components/AddItemForm";
import { UpcScanner } from "@/components/UpcScanner";
import { AuthScreen } from "@/components/AuthScreen";
import { GroceryDashboardWidget } from "@/components/GroceryDashboardWidget";
import { GroceryItemRow } from "@/components/GroceryItemRow";
import { GroceryListCard } from "@/components/GroceryListCard";
import { ManualPriceForm } from "@/components/ManualPriceForm";
import { MealCard } from "@/components/MealCard";
import { MobileAppShell } from "@/components/MobileAppShell";
import { NutritionLogger, type LoggingMethod } from "@/components/NutritionLogger";
import { PriceBadge } from "@/components/PriceBadge";
import { PriceConfidenceIndicator } from "@/components/PriceConfidenceIndicator";
import { PriceHistoryCard } from "@/components/PriceHistoryCard";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { StoreComparisonCard } from "@/components/StoreComparisonCard";
import { TotalCostCard } from "@/components/TotalCostCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import {
  clearSession,
  loadSession,
  loadUserData,
  loadPromoCodes,
  registerAccount,
  authenticateAccount,
  saveSession,
  saveUserData,
  generatePremiumPromoCode,
  redeemPromoCode,
  updateAccountSubscription,
  type PromoCodeRecord,
  type SessionUser,
  type UserAppData,
  type WorkoutLogEntry,
  type WorkoutPlanEntry,
} from "@/lib/storage";
import { createInitialGroceryLists } from "@/lib/groceryState";
import { groceryPriceService, productMatchingService, storeComparisonService } from "@/lib/groceryServices";
import { formatMacro, parseMacroString, parseNumber } from "@/lib/macroEstimator";
import { nutritionService, type NutritionEntry } from "@/lib/nutritionService";
import type { GroceryList, GroceryListItem, GroceryUnit, PriceRecord } from "@/lib/groceryTypes";
import type { MobileTab } from "@/components/BottomNav";
const tabMeta: Record<MobileTab, { title: string; subtitle: string }> = {
  home: { title: "Vitalyx", subtitle: "Blank by default, customizable every day." },
  meals: { title: "Meals", subtitle: "Scan, search, or snap food and confirm the nutrition before saving." },
  track: { title: "Track", subtitle: "Keep workout logging simple and fast." },
  more: { title: "More", subtitle: "Track grocery prices, compare stores, and manage your setup." },
};

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date());
}

function mealTotals(meals: PlannerMeal[]) {
  return meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += parseMacroString(meal.protein);
      acc.carbs += parseMacroString(meal.carbs ?? "0g");
      acc.fat += parseMacroString(meal.fat ?? "0g");
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function nutritionEntryToMeal(entry: NutritionEntry, id?: string): PlannerMeal {
  return {
    id: id ?? entry.id ?? crypto.randomUUID(),
    type: "Meal",
    title: entry.foodName,
    calories: Math.round(entry.calories),
    protein: formatMacro(entry.protein),
    carbs: formatMacro(entry.carbs),
    fat: formatMacro(entry.fat),
    cost: "$0.00",
    amount: entry.servingAmount,
    unit: entry.servingUnit,
  };
}

function mealToNutritionEntry(meal: PlannerMeal): NutritionEntry {
  return {
    id: meal.id ?? crypto.randomUUID(),
    foodName: meal.title,
    servingAmount: meal.amount ?? 1,
    servingUnit: (meal.unit as NutritionEntry["servingUnit"]) ?? "serving",
    calories: meal.calories,
    carbs: parseMacroString(meal.carbs ?? "0g"),
    fat: parseMacroString(meal.fat ?? "0g"),
    protein: parseMacroString(meal.protein),
    source: "search",
    confidenceScore: 0.8,
  };
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function relativeDateLabel(value?: string) {
  if (!value) {
    return "No updates yet";
  }
  return `Updated ${new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function timeKey() {
  return new Date().toTimeString().slice(0, 5);
}

function dateKeyFromValue(dateValue: Date) {
  const year = dateValue.getFullYear();
  const month = `${dateValue.getMonth() + 1}`.padStart(2, "0");
  const day = `${dateValue.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeKeyFromValue(dateValue: Date) {
  return `${dateValue.getHours()}`.padStart(2, "0") + ":" + `${dateValue.getMinutes()}`.padStart(2, "0");
}

function weekdayLabel(dateValue: string) {
  if (!dateValue) {
    return "Unassigned";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
}

function formatShortDateTime(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return "No time selected";
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = (timeValue || "00:00").split(":").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function abbreviateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function normalizeExerciseValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function findExerciseCatalogItem(value: string) {
  const normalizedValue = normalizeExerciseValue(value);
  if (!normalizedValue) {
    return null;
  }

  return (
    exerciseCatalog.find((exercise) => {
      const values = [exercise.name, ...exercise.aliases];
      return values.some((option) => normalizeExerciseValue(option) === normalizedValue);
    }) ?? null
  );
}

function matchesExerciseCatalogItem(exercise: ExerciseCatalogItem, query: string) {
  const normalizedQuery = normalizeExerciseValue(query);
  if (!normalizedQuery) {
    return true;
  }

  return [exercise.name, ...exercise.aliases].some((option) => normalizeExerciseValue(option).includes(normalizedQuery));
}

function calculateUsageStreak(usageDates: string[]) {
  const uniqueDates = Array.from(new Set(usageDates)).sort();
  if (!uniqueDates.length) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let index = 0; index < uniqueDates.length; index += 1) {
    const expectedKey = cursor.toISOString().slice(0, 10);
    const currentKey = uniqueDates[uniqueDates.length - 1 - index];
    if (currentKey !== expectedKey) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function hydrateGroceryLists(lists: GroceryList[], manualPriceRecords: PriceRecord[]) {
  return lists.map((list) => ({
    ...list,
    updatedAt: new Date().toISOString(),
    items: groceryPriceService.getPricesForList(list.items, manualPriceRecords),
  }));
}

function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [appData, setAppData] = useState<UserAppData | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [liftSets, setLiftSets] = useState("");
  const [liftWeight, setLiftWeight] = useState("");
  const [liftReps, setLiftReps] = useState("");
  const [plannedWorkoutTitle, setPlannedWorkoutTitle] = useState("");
  const [plannedWorkoutFocus, setPlannedWorkoutFocus] = useState("");
  const [plannedWorkoutDay, setPlannedWorkoutDay] = useState(todayLabel());
  const [plannedWorkoutDate, setPlannedWorkoutDate] = useState(todayKey());
  const [plannedWorkoutTime, setPlannedWorkoutTime] = useState("18:00");
  const [loggingMethod, setLoggingMethod] = useState<LoggingMethod>("search");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [photoLabel, setPhotoLabel] = useState("");
  const [pendingEntries, setPendingEntries] = useState<NutritionEntry[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showUpcScanner, setShowUpcScanner] = useState(false);
  const [showGroceryUpcScanner, setShowGroceryUpcScanner] = useState(false);
  const [selectedGroceryItemId, setSelectedGroceryItemId] = useState<string | null>(null);
  const [showStoreComparison, setShowStoreComparison] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const session = loadSession();
    setPromoCodes(loadPromoCodes());
    if (session) {
      setUser(session);
      const nextData = loadUserData(session.id);
      const currentDay = todayKey();
      const usageDates = nextData.usageDates.includes(currentDay) ? nextData.usageDates : [...nextData.usageDates, currentDay];
      const hydratedData = { ...nextData, usageDates };
      setAppData(hydratedData);
      saveUserData(session.id, hydratedData);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (user && appData) {
      saveUserData(user.id, appData);
    }
  }, [user, appData]);

  const planner = appData?.planner ?? createInitialPlanner();
  const groceryLists = appData?.groceryLists ?? createInitialGroceryLists();
  const manualPriceRecords = appData?.manualPriceRecords ?? [];
  const workoutLog = appData?.workoutLog ?? [];
  const workoutPlans = appData?.workoutPlans ?? [];
  const usageStreak = calculateUsageStreak(appData?.usageDates ?? []);
  const weeklyWorkoutEntries = workoutLog.filter((entry) => {
    const entryDate = new Date(entry.loggedAt);
    const now = new Date();
    const startOfWindow = new Date(now);
    startOfWindow.setHours(0, 0, 0, 0);
    startOfWindow.setDate(startOfWindow.getDate() - 6);
    return entryDate >= startOfWindow;
  });
  const weeklyWeightLifted = weeklyWorkoutEntries.reduce((total, entry) => total + entry.weight * entry.reps * entry.sets, 0);
  const weeklyReps = weeklyWorkoutEntries.reduce((total, entry) => total + entry.reps * entry.sets, 0);
  const totalSetsLogged = workoutLog.reduce((total, entry) => total + entry.sets, 0);
  const sortedWorkoutPlans = [...workoutPlans].sort((a, b) =>
    `${a.plannedDate}T${a.plannedTime}`.localeCompare(`${b.plannedDate}T${b.plannedTime}`),
  );
  const todayIndex = Math.max(planner.findIndex((day) => day.day === todayLabel()), 0);
  const todayMeals = planner[todayIndex]?.meals ?? [];
  const totals = mealTotals(todayMeals);
  const activeGroceryList = groceryLists[0] ?? createInitialGroceryLists()[0];
  const pricedGroceryList = {
    ...activeGroceryList,
    items: groceryPriceService.getPricesForList(activeGroceryList.items, manualPriceRecords),
  };
  const comparisonResults = storeComparisonService.calculateStoreTotals(pricedGroceryList);
  const cheapestStoreResult = storeComparisonService.getCheapestStore(pricedGroceryList);
  const perItemBestPrices = storeComparisonService.getPerItemBestPrices(pricedGroceryList);
  const mixAndMatchTotal = perItemBestPrices.reduce((total, entry) => total + entry.totalCost, 0);
  const selectedGroceryItem =
    pricedGroceryList.items.find((item) => item.id === selectedGroceryItemId) ?? pricedGroceryList.items[0] ?? null;
  const selectedStoreName = selectedGroceryItem?.preferredStore ?? selectedGroceryItem?.latestPrices[0]?.storeName ?? "";
  const selectedItemHistory = selectedGroceryItem
    ? groceryPriceService.getPriceHistory(selectedGroceryItem.name, selectedStoreName, manualPriceRecords)
    : [];
  const weeklyEstimate = cheapestStoreResult?.totalCost ?? mixAndMatchTotal;
  const stapleChanges = ["Chicken breast", "Eggs", "Rice"]
    .map((name) => {
      const history = groceryPriceService.getPriceHistory(name, cheapestStoreResult?.storeName ?? "Walmart", manualPriceRecords);
      if (history.length < 2) return null;
      const latest = history.at(-1)?.price ?? 0;
      const prior = history.at(-2)?.price ?? 0;
      const delta = latest - prior;
      const prefix = delta > 0 ? "+" : "";
      return { item: name, change: `${prefix}$${Math.abs(delta).toFixed(2)}` };
    })
    .filter((entry): entry is { item: string; change: string } => Boolean(entry));
  const matchedExercise = findExerciseCatalogItem(exerciseName);
  const exerciseSuggestions = exerciseCatalog.filter((exercise) => matchesExerciseCatalogItem(exercise, exerciseName)).slice(0, 6);
  const quickExerciseSuggestions = exerciseCatalog.slice(0, 6);

  function updatePlanner(updater: (value: UserAppData["planner"]) => UserAppData["planner"]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        usageDates: [todayKey()],
      };
      return { ...base, planner: updater(base.planner) };
    });
  }

  function updateGroceryLists(updater: (lists: GroceryList[]) => GroceryList[]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        usageDates: [todayKey()],
      };
      const nextLists = hydrateGroceryLists(updater(base.groceryLists), base.manualPriceRecords);
      return { ...base, groceryLists: nextLists };
    });
  }

  function updateManualPriceRecords(updater: (records: PriceRecord[]) => PriceRecord[]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        usageDates: [todayKey()],
      };
      const manualPriceRecords = updater(base.manualPriceRecords);
      return {
        ...base,
        manualPriceRecords,
        groceryLists: hydrateGroceryLists(base.groceryLists, manualPriceRecords),
      };
    });
  }

  function updateWorkoutLog(updater: (entries: WorkoutLogEntry[]) => WorkoutLogEntry[]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        usageDates: [todayKey()],
      };
      return { ...base, workoutLog: updater(base.workoutLog) };
    });
  }

  function updateWorkoutPlans(updater: (entries: WorkoutPlanEntry[]) => WorkoutPlanEntry[]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        usageDates: [todayKey()],
      };
      return { ...base, workoutPlans: updater(base.workoutPlans) };
    });
  }

  function addWorkoutEntry() {
    const exercise = exerciseName.trim();
    const sets = liftSets.trim() ? Number(liftSets) : 1;
    const weight = Number(liftWeight);
    const reps = Number(liftReps);
    const loggedAt = new Date();
    const selectedDay = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(loggedAt);
    const selectedDate = dateKeyFromValue(loggedAt);
    const selectedTime = timeKeyFromValue(loggedAt);

    if (!exercise || !Number.isFinite(sets) || sets <= 0 || !Number.isFinite(weight) || weight <= 0 || !Number.isFinite(reps) || reps <= 0) {
      setFeedback("Enter an exercise name plus valid sets, weight, and reps before adding your workout.");
      return;
    }

    const nextEntry: WorkoutLogEntry = {
      id: crypto.randomUUID(),
      exercise,
      workoutDay: selectedDay,
      loggedDate: selectedDate,
      loggedTime: selectedTime,
      sets,
      weight,
      reps,
      loggedAt: loggedAt.toISOString(),
    };

    updateWorkoutLog((current) => [nextEntry, ...current]);
    setSessionStarted(true);
    setCompletedSets((current) => current + sets);
    setSavedAt(
      new Date(nextEntry.loggedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    );
    setExerciseName("");
    setLiftSets("");
    setLiftWeight("");
    setLiftReps("");
    setFeedback(`${exercise} added with ${sets} set${sets === 1 ? "" : "s"} for ${selectedDay} at ${selectedTime}.`);
  }

  function applyExerciseSuggestion(exercise: ExerciseCatalogItem) {
    setExerciseName(exercise.name);
    setLiftSets((current) => current || exercise.defaultSets);
    setLiftReps((current) => current || exercise.defaultReps);
    setFeedback(`${exercise.name} selected. Autofilled ${exercise.defaultSets} set and ${exercise.defaultReps} reps for ${exercise.focus.toLowerCase()}.`);
  }

  function handleExerciseNameChange(value: string) {
    setExerciseName(value);

    const matchedCatalogItem = findExerciseCatalogItem(value);
    if (!matchedCatalogItem) {
      return;
    }

    setLiftSets((current) => current || matchedCatalogItem.defaultSets);
    setLiftReps((current) => current || matchedCatalogItem.defaultReps);
  }

  function removeWorkoutEntry(entryId: string) {
    updateWorkoutLog((current) => current.filter((entry) => entry.id !== entryId));
    setFeedback("Workout entry removed.");
  }

  function addWorkoutPlan() {
    const title = plannedWorkoutTitle.trim();
    const focus = plannedWorkoutFocus.trim() || "Planned training session";
    const selectedDate = plannedWorkoutDate || todayKey();
    const selectedDay = plannedWorkoutDay.trim() || weekdayLabel(selectedDate);
    const selectedTime = plannedWorkoutTime || "18:00";

    if (!title) {
      setFeedback("Add a workout title before saving a planned session.");
      return;
    }

    updateWorkoutPlans((current) => [
      {
        id: crypto.randomUUID(),
        title,
        focus,
        workoutDay: selectedDay,
        plannedDate: selectedDate,
        plannedTime: selectedTime,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setPlannedWorkoutTitle("");
    setPlannedWorkoutFocus("");
    setFeedback(`${title} planned for ${selectedDay} at ${selectedTime}.`);
  }

  function removeWorkoutPlan(planId: string) {
    updateWorkoutPlans((current) => current.filter((entry) => entry.id !== planId));
    setFeedback("Planned workout removed.");
  }

  function handleSignIn(input: { email: string; password: string }) {
    try {
      const next = authenticateAccount(input);
      saveSession(next);
      setUser(next);
      setAppData(loadUserData(next.id));
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  function handleRegister(input: { name: string; email: string; password: string }) {
    try {
      if (!input.name.trim() || !input.email.trim() || !input.password.trim()) throw new Error("Name, email, and password are required.");
      const next = registerAccount(input);
      saveSession(next);
      setUser(next);
      setAppData(loadUserData(next.id));
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to create account.");
    }
  }

  function handleSignOut() {
    clearSession();
    setUser(null);
    setAppData(null);
    setActiveTab("home");
  }

  function refreshPromoCodes() {
    setPromoCodes(loadPromoCodes());
  }

  function handleUpgradeToPremium() {
    if (!user) {
      return;
    }

    if (user.subscriptionTier === "premium") {
      setFeedback("Premium UPC scanning is already active on this account.");
      return;
    }

    const nextAccount = updateAccountSubscription(user.id, "premium");
    if (!nextAccount) {
      setFeedback("Unable to update the subscription right now.");
      return;
    }

    const nextUser: SessionUser = {
      id: nextAccount.id,
      name: nextAccount.name,
      email: nextAccount.email,
      role: nextAccount.role,
      subscriptionTier: nextAccount.subscriptionTier,
    };

    saveSession(nextUser);
    setUser(nextUser);
    setFeedback("Premium unlocked. UPC camera scanning is now available on this account.");
  }

  function handleGeneratePromoCode() {
    if (!user) {
      return;
    }

    const nextCode = generatePremiumPromoCode(user.id);
    refreshPromoCodes();
    setFeedback(`Premium promo code generated: ${nextCode.code}`);
  }

  function handleRedeemPromoCode() {
    if (!user) {
      return;
    }

    try {
      const result = redeemPromoCode({ code: promoCodeInput, userId: user.id });
      const nextUser: SessionUser = {
        id: result.account.id,
        name: result.account.name,
        email: result.account.email,
        role: result.account.role,
        subscriptionTier: result.account.subscriptionTier,
      };

      saveSession(nextUser);
      setUser(nextUser);
      setPromoCodeInput("");
      refreshPromoCodes();
      setFeedback(`Promo code applied. ${result.promoCode.subscriptionTier === "premium" ? "Premium" : "Subscription"} is now active.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to redeem that promo code.");
    }
  }

  function resetDetectionState() {
    setPendingEntries([]);
    setFeedback(null);
    setEditingMealId(null);
  }

  async function runLookup() {
    let result: NutritionEntry | NutritionEntry[] | null = null;
    setIsLookingUp(true);
    try {
      if (loggingMethod === "barcode") {
        const { entry, found } = await nutritionService.fromBarcodeWithStatus(barcodeValue);
        result = entry;
        if (!found) {
          setFeedback("No product found for that barcode. Check the number and try again, or add it manually.");
        } else if (!entry) {
          setFeedback("Product found but nutrition data isn't available yet. You can fill in the macros manually.");
        } else if (entry.isEstimate) {
          setFeedback("Product found but nutrition is incomplete — shown as an estimate. Review before saving.");
        } else {
          setFeedback("Open Food Facts nutrition found. Double-check the serving size before saving.");
        }
      } else if (loggingMethod === "search") {
        result = await nutritionService.fromSearch(foodSearchQuery);
        setFeedback(
          result
            ? "Search matched a food profile. Review and edit if needed before saving."
            : "No food match found. Try wording like '2 eggs' or '6 oz chicken breast', or use the meal library below.",
        );
      }

      setPendingEntries(result ? (Array.isArray(result) ? result : [result]) : []);
    } catch (error) {
      setPendingEntries([]);
      setFeedback(error instanceof Error ? error.message : "Nutrition lookup failed. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handlePhotoSelected(file: File) {
    const result = await nutritionService.fromPhoto(file);
    setPhotoLabel(file.name);
    setFeedback(
      result.length
        ? "Photo results are estimates. Review each item and portion before saving."
        : "No food estimates were returned from this photo.",
    );
    setPendingEntries(result);
  }

  async function handleEntryChange(entryId: string, field: keyof NutritionEntry, value: string) {
    const currentEntry = pendingEntries.find((entry) => entry.id === entryId);
    if (!currentEntry) {
      return;
    }

    const nextEntry: NutritionEntry = {
      ...currentEntry,
      [field]:
        field === "servingAmount" || field === "calories" || field === "carbs" || field === "fat" || field === "protein" || field === "confidenceScore"
          ? parseNumber(value)
          : value,
    } as NutritionEntry;

    if (field === "foodName" || field === "servingAmount" || field === "servingUnit") {
      const recalculated = await nutritionService.fromSearch(
        `${nextEntry.servingAmount} ${nextEntry.servingUnit} ${nextEntry.foodName}`,
      );

      if (recalculated) {
        nextEntry.calories = recalculated.calories;
        nextEntry.carbs = recalculated.carbs;
        nextEntry.fat = recalculated.fat;
        nextEntry.protein = recalculated.protein;
      }
    }

    setPendingEntries((current) => current.map((entry) => (entry.id === entryId ? nextEntry : entry)));
  }

  function saveDetectedEntries() {
    if (!pendingEntries.length) {
      return;
    }

    updatePlanner((current) =>
      current.map((day, index) =>
        index !== dayIndex
          ? day
          : editingMealId
            ? {
                ...day,
                meals: day.meals.map((meal) =>
                  (meal.id ?? meal.title) === editingMealId
                    ? { ...nutritionEntryToMeal(pendingEntries[0], editingMealId), type: meal.type }
                    : meal,
                ),
              }
            : { ...day, meals: [...day.meals, ...pendingEntries.map((entry) => nutritionEntryToMeal(entry))] },
      ),
    );
    resetDetectionState();
    setBarcodeValue("");
    setFoodSearchQuery("");
    setPhotoLabel("");
  }

  function editMeal(mealId: string) {
    const meal = planner[dayIndex]?.meals.find((entry) => (entry.id ?? entry.title) === mealId);
    if (!meal) return;
    setLoggingMethod("search");
    setPendingEntries([mealToNutritionEntry(meal)]);
    setEditingMealId(meal.id ?? meal.title);
    setFeedback("Edit the detected nutrition, then save to update this food entry.");
  }

  function removeMeal(mealId: string) {
    updatePlanner((current) =>
      current.map((day, index) => (index === dayIndex ? { ...day, meals: day.meals.filter((meal) => (meal.id ?? meal.title) !== mealId) } : day)),
    );
    if (editingMealId === mealId) resetDetectionState();
  }

  async function addGroceryItem(input: {
    name: string;
    quantity: number;
    unit: GroceryUnit;
    barcode?: string;
    brand?: string;
    preferredStore?: string;
  }) {
    const matchedProduct = productMatchingService.matchItemToProduct({
      name: input.name,
      brand: input.brand,
      barcode: input.barcode,
    });
    const now = new Date().toISOString();
    const nextItem: GroceryListItem = {
      id: crypto.randomUUID(),
      name: input.name,
      normalizedName: productMatchingService.normalizeItemName(input.name),
      quantity: input.quantity,
      unit: input.barcode ? "piece" : input.unit,
      barcode: input.barcode,
      pricingMode: input.barcode ? "item" : "unit",
      brand: input.brand,
      preferredStore: input.preferredStore,
      category: matchedProduct?.category,
      matchedProductId: matchedProduct?.id,
      latestPrices: [],
    };

    updateGroceryLists((lists) =>
      lists.map((list, index) =>
        index !== 0 ? list : { ...list, updatedAt: now, items: [...list.items, nextItem] },
      ),
    );
    setSelectedGroceryItemId(nextItem.id);
    setShowStoreComparison(true);
  }

  function removeGroceryItem(itemId: string) {
    updateGroceryLists((lists) =>
      lists.map((list, index) =>
        index !== 0 ? list : { ...list, updatedAt: new Date().toISOString(), items: list.items.filter((item) => item.id !== itemId) },
      ),
    );
    if (selectedGroceryItemId === itemId) {
      setSelectedGroceryItemId(null);
    }
  }

  function saveManualPriceUpdate(item: GroceryListItem, input: {
    storeName: string;
    price: number;
    sizeAmount: number;
    unit: GroceryUnit;
    note?: string;
  }) {
    updateManualPriceRecords((records) =>
      groceryPriceService.saveManualPriceUpdate(
          {
            productId: item.matchedProductId ?? `manual-${item.normalizedName}`,
            itemName: item.name,
            storeName: input.storeName,
            price: input.price,
            unitPrice:
              item.pricingMode === "item" ? undefined : Number((input.price / input.sizeAmount).toFixed(2)),
            quantitySize: `${input.sizeAmount} ${input.unit}`,
            confidenceScore: 0.98,
            locationLabel: "Manual store check",
          note: input.note,
        },
        records,
      ),
    );
    setShowStoreComparison(true);
  }

  function renderScreen() {
    if (activeTab === "home") {
      return (
        <div className="space-y-5">
          <SectionCard eyebrow="Stats" title="This week">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Weight Lifted"
                value={`${weeklyWeightLifted.toLocaleString()} lb`}
                detail={weeklyWorkoutEntries.length ? "Based on all sets logged in the last 7 days" : "Log a workout set to start tracking volume"}
                icon={Dumbbell}
                emphasis="accent"
              />
              <StatCard
                label="Total Reps"
                value={`${weeklyReps.toLocaleString()}`}
                detail={weeklyWorkoutEntries.length ? "All reps recorded across the last 7 days" : "Your weekly rep total will show here"}
                icon={Repeat}
              />
              <StatCard
                label="Usage Streak"
                value={`${usageStreak} day${usageStreak === 1 ? "" : "s"}`}
                detail={usageStreak ? "Counts consecutive days you opened the app" : "Open the app daily to build a streak"}
                icon={Footprints}
                emphasis="accent"
              />
            </div>
          </SectionCard>
          <SectionCard eyebrow={todayLabel()} title="Today's meals">
            {todayMeals.length ? (
              <div className="space-y-3">{todayMeals.slice(0, 3).map((meal) => <MealCard key={meal.id ?? meal.title} {...meal} compact showAction={false} />)}</div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
                No meals added yet. Use the Meals tab to scan a barcode, search a food, or analyze a photo.
              </div>
            )}
          </SectionCard>
          <SectionCard eyebrow="Macro snapshot" title="Today's totals">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-center"><p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Protein</p><p className="mt-2 text-xl font-semibold text-white">{Math.round(totals.protein)}g</p></div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-center"><p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Carbs</p><p className="mt-2 text-xl font-semibold text-white">{Math.round(totals.carbs)}g</p></div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-center"><p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Fat</p><p className="mt-2 text-xl font-semibold text-white">{Math.round(totals.fat)}g</p></div>
            </div>
          </SectionCard>
          <section className="grid grid-cols-2 gap-3">
            <StatCard label="Calories" value={`${totals.calories}`} detail="Based on what you logged" icon={Apple} emphasis="accent" />
            <StatCard label="Budget" value="$0" detail="No grocery items added" icon={Wallet} />
          </section>
          <SectionCard eyebrow="Grocery watch" title="Price tracker">
            <GroceryDashboardWidget
              weeklyEstimate={weeklyEstimate}
              cheapestStore={cheapestStoreResult?.storeName ?? "No match yet"}
              cheapestTotal={cheapestStoreResult?.totalCost ?? 0}
              stapleChanges={stapleChanges.length ? stapleChanges : [{ item: "Staples", change: "awaiting list data" }]}
            />
          </SectionCard>
        </div>
      );
    }
    if (activeTab === "meals") {
      const day = planner[dayIndex];
      const dayTotals = mealTotals(day.meals);
      return (
        <NutritionLogger
          dayLabel={day.day}
          loggingMethod={loggingMethod}
          onLoggingMethod={setLoggingMethod}
          barcodeValue={barcodeValue}
          onBarcodeValue={setBarcodeValue}
          searchValue={foodSearchQuery}
          onSearchValue={setFoodSearchQuery}
          photoLabel={photoLabel}
          onRunLookup={runLookup}
          onOpenPhotoPicker={() => photoInputRef.current?.click()}
          pendingEntries={pendingEntries}
          onEntryChange={handleEntryChange}
          onSaveEntries={saveDetectedEntries}
          onCancelEntries={resetDetectionState}
          feedback={feedback}
          editingMealId={editingMealId}
          totals={dayTotals}
          meals={day.meals}
          onEditMeal={editMeal}
          onRemoveMeal={removeMeal}
          isLookingUp={isLookingUp}
          onOpenCamera={() => setShowUpcScanner(true)}
          renderMealCard={(meal) => <MealCard {...meal} actionLabel="Edit" onAction={() => editMeal(meal.id ?? meal.title)} />}
          onPickFromCatalog={(entry) => {
            const created = nutritionService.fromOpenFoodFactsEntry(entry);
            setPendingEntries([created]);
            setFeedback(
              entry.barcode
                ? `Autofilled from ${entry.brand ? entry.brand + " — " : ""}Open Food Facts (UPC ${entry.barcode}). Edit before saving.`
                : `Autofilled from Open Food Facts. Edit before saving.`,
            );
          }}
        />
      );
    }
    if (activeTab === "track") {
      return (
        <div className="space-y-5">
          <SectionCard eyebrow="Workout planner" title="Plan upcoming days">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 text-sm text-zinc-300">
              Schedule workouts before they happen, then use the logger below to record the actual exercise, day, date, and time when you train.
            </div>
            <div className="mt-4 grid gap-3">
              <input
                type="text"
                value={plannedWorkoutTitle}
                onChange={(event) => setPlannedWorkoutTitle(event.target.value)}
                placeholder="Planned workout title"
                className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <input
                type="text"
                value={plannedWorkoutFocus}
                onChange={(event) => setPlannedWorkoutFocus(event.target.value)}
                placeholder="Focus or notes"
                className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={plannedWorkoutDay}
                  onChange={(event) => setPlannedWorkoutDay(event.target.value)}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
                >
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <option key={day} value={day} className="bg-zinc-950 text-white">
                      {day}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={plannedWorkoutDate}
                  onChange={(event) => {
                    setPlannedWorkoutDate(event.target.value);
                    setPlannedWorkoutDay(weekdayLabel(event.target.value));
                  }}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
                />
                <input
                  type="time"
                  value={plannedWorkoutTime}
                  onChange={(event) => setPlannedWorkoutTime(event.target.value)}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addWorkoutPlan}
                className="rounded-[22px] bg-white px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                Plan workout day
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {sortedWorkoutPlans.length ? (
                sortedWorkoutPlans.slice(0, 6).map((plan) => (
                  <div key={plan.id} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white" title={plan.title}>
                          {abbreviateText(plan.title, 42)}
                        </p>
                        <p className="mt-1 break-words text-sm text-zinc-400" title={plan.focus}>
                          {abbreviateText(plan.focus, 90)}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-emerald-300">
                          {plan.workoutDay} | {formatShortDateTime(plan.plannedDate, plan.plannedTime)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWorkoutPlan(plan.id)}
                        className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
                  No workout days planned yet. Add a future day and time here so your week is mapped out before it arrives.
                </div>
              )}
            </div>
          </SectionCard>
          <SectionCard eyebrow="Workout logging" title="Add a set">
            <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {feedback ?? (sessionStarted ? `${completedSets} sets logged so far. Last entry at ${savedAt}.` : "Type the exercise, sets, weight, and reps. The app saves it to the current day automatically.")}
            </div>
            <div className="mt-4 grid gap-3">
              <input
                type="text"
                value={exerciseName}
                onChange={(event) => handleExerciseNameChange(event.target.value)}
                placeholder="Workout or exercise"
                list="exercise-autofill-list"
                className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <datalist id="exercise-autofill-list">
                {exerciseCatalog.map((exercise) => (
                  <option key={exercise.name} value={exercise.name} />
                ))}
              </datalist>
              {matchedExercise ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{matchedExercise.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">{matchedExercise.focus}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                      {matchedExercise.equipment}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Targets {matchedExercise.primaryMuscles.join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Starter autofill: {matchedExercise.defaultSets} set x {matchedExercise.defaultReps} reps
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {(exerciseName.trim() ? exerciseSuggestions : quickExerciseSuggestions).map((exercise) => (
                  <button
                    key={exercise.name}
                    type="button"
                    onClick={() => applyExerciseSuggestion(exercise)}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-200"
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={liftSets}
                  onChange={(event) => setLiftSets(event.target.value)}
                  placeholder="Sets (opt)"
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={liftWeight}
                  onChange={(event) => setLiftWeight(event.target.value)}
                  placeholder="Weight (lb)"
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={liftReps}
                  onChange={(event) => setLiftReps(event.target.value)}
                  placeholder="Reps"
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <p className="text-xs leading-6 text-zinc-500">
                Exercise autofill suggestions are seeded from Mayo Clinic strength and core exercise guidance. Default set and rep values are starter suggestions for faster logging.
              </p>
              <button
                type="button"
                onClick={addWorkoutEntry}
                className="rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                Add workout set
              </button>
            </div>
          </SectionCard>
          <SectionCard eyebrow="Recent sets" title="Workout tracker">
            {workoutLog.length ? (
              <div className="space-y-3">
                {workoutLog.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-white" title={entry.exercise}>
                          {abbreviateText(entry.exercise, 42)}
                        </p>
                        <p className="mt-1 break-words text-sm text-zinc-400">
                          {entry.sets} set{entry.sets === 1 ? "" : "s"} x {entry.weight} lb x {entry.reps} reps
                        </p>
                        <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-emerald-300" title={entry.workoutDay}>
                          {abbreviateText(entry.workoutDay, 18)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{formatShortDateTime(entry.loggedDate, entry.loggedTime)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWorkoutEntry(entry.id)}
                        className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
                No workout sets logged yet. Add your first entry above to start tracking weekly volume and reps.
              </div>
            )}
          </SectionCard>
          <SectionCard eyebrow="Progress summary" title="Strength momentum">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Sets Logged" value={`${totalSetsLogged}`} detail="All-time workout sets saved on this device" icon={Dumbbell} />
              <StatCard label="Weekly Volume" value={`${weeklyWeightLifted.toLocaleString()} lb`} detail="Weight x reps over the last 7 days" icon={Apple} emphasis="accent" />
              <StatCard label="Weekly Reps" value={`${weeklyReps.toLocaleString()}`} detail="Useful for tracking training load at a glance" icon={Repeat} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {workoutSplit.map((workout) => (
                <WorkoutCard
                  key={`${workout.day}-${workout.title}`}
                  title={workout.title}
                  focus={workout.summary}
                  duration="45-60 min"
                  day={workout.day}
                />
              ))}
            </div>
          </SectionCard>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <SectionCard eyebrow="Dashboard widget" title="Grocery price tracking">
          <GroceryDashboardWidget
            weeklyEstimate={weeklyEstimate}
            cheapestStore={cheapestStoreResult?.storeName ?? "No match yet"}
            cheapestTotal={cheapestStoreResult?.totalCost ?? 0}
            stapleChanges={stapleChanges.length ? stapleChanges : [{ item: "Staples", change: "awaiting list data" }]}
          />
        </SectionCard>

        <GroceryListCard
          name={pricedGroceryList.name}
          itemCount={pricedGroceryList.items.length}
          totalLabel={cheapestStoreResult ? formatMoney(cheapestStoreResult.totalCost) : "$0.00"}
          subtitle={
            cheapestStoreResult
              ? `${cheapestStoreResult.storeName} is currently the cheapest full-list option.`
              : "Add items to see price estimates across stores."
          }
        >
          <AddItemForm
            onAdd={addGroceryItem}
            onBarcodeLookup={(barcode) => groceryPriceService.lookupBarcode(barcode)}
            isPremiumSubscriber={user?.subscriptionTier === "premium"}
            onUpgradeToPremium={handleUpgradeToPremium}
            onOpenCamera={() => setShowGroceryUpcScanner(true)}
          />

          {pricedGroceryList.items.length ? (
            <div className="space-y-3">
              {pricedGroceryList.items.map((item) => {
                const bestRecord = [...item.latestPrices].sort(
                  (a, b) => groceryPriceService.estimateItemTotal(item, a) - groceryPriceService.estimateItemTotal(item, b),
                )[0];

                return (
                  <div key={item.id} className="space-y-2">
                    <GroceryItemRow
                      item={item}
                      bestPriceLabel={
                        bestRecord ? `${formatMoney(groceryPriceService.estimateItemTotal(item, bestRecord))} est.` : "No estimate"
                      }
                      bestStoreLabel={bestRecord ? bestRecord.storeName : "No store match"}
                      lastUpdatedLabel={relativeDateLabel(bestRecord?.checkedAt)}
                      hasMatch={Boolean(bestRecord)}
                      onSelect={() => setSelectedGroceryItemId(item.id)}
                    />
                    <button
                      type="button"
                      onClick={() => removeGroceryItem(item.id)}
                      className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                    >
                      Remove item
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
              Your list is empty. Add staples like chicken breast, eggs, rice, greek yogurt, ground beef, oats, or broccoli to start comparing stores.
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowStoreComparison((current) => !current)}
            className="w-full rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
          >
            {showStoreComparison ? "Hide store comparison" : "Compare stores"}
          </button>
        </GroceryListCard>

        {showStoreComparison && pricedGroceryList.items.length ? (
          <SectionCard eyebrow="Store comparison" title="Best cart options">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <TotalCostCard
                  label="Best full store"
                  value={cheapestStoreResult?.storeName ?? "No match"}
                  detail={
                    cheapestStoreResult
                      ? `${formatMoney(cheapestStoreResult.totalCost)} across matched items`
                      : "Add items with recognized grocery names"
                  }
                  highlight
                />
                <TotalCostCard
                  label="Best mix"
                  value={formatMoney(mixAndMatchTotal)}
                  detail="Per-item cheapest combination across stores"
                />
              </div>

              <div className="space-y-3">
                {comparisonResults.map((result, index) => (
                  <StoreComparisonCard
                    key={result.storeName}
                    result={result}
                    isBest={index === 0 && result.matchedItems.length > 0}
                  />
                ))}
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-sm font-medium text-white">Best per-item picks</p>
                <div className="mt-3 space-y-2">
                  {perItemBestPrices.length ? (
                    perItemBestPrices.map((entry) => (
                      <div key={entry.itemId} className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{entry.itemName}</p>
                          <p className="mt-1 text-xs text-zinc-500">{entry.storeName}</p>
                        </div>
                        <PriceBadge label={formatMoney(entry.totalCost)} tone="success" />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                      Add grocery items to see the lowest per-item combination.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {selectedGroceryItem ? (
          <SectionCard eyebrow="Item detail" title={selectedGroceryItem.name}>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{selectedGroceryItem.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {selectedGroceryItem.quantity} {selectedGroceryItem.unit}
                      {selectedGroceryItem.category ? ` | ${selectedGroceryItem.category}` : ""}
                      {selectedGroceryItem.pricingMode === "item" ? " | priced per item" : " | priced by unit"}
                    </p>
                  </div>
                  <PriceConfidenceIndicator score={selectedGroceryItem.latestPrices[0]?.confidenceScore ?? 0} />
                </div>

                <div className="mt-4 space-y-2">
                  {selectedGroceryItem.latestPrices.length ? (
                    selectedGroceryItem.latestPrices.map((record) => (
                      <div key={record.id} className="rounded-[18px] border border-white/8 bg-black/20 px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{record.storeName}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {record.quantitySize ?? "Latest price"} | {relativeDateLabel(record.checkedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-300">
                              {formatMoney(groceryPriceService.estimateItemTotal(selectedGroceryItem, record))}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {record.source === "manual" ? "Manual check" : "Estimated feed"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                      No store prices were matched for this item yet. Try a clearer grocery name or add your own manual price.
                    </div>
                  )}
                </div>
              </div>

              <PriceHistoryCard
                itemName={selectedGroceryItem.name}
                storeName={selectedStoreName || "No store selected"}
                records={selectedItemHistory}
              />

              <ManualPriceForm item={selectedGroceryItem} onSave={(input) => saveManualPriceUpdate(selectedGroceryItem, input)} />
            </div>
          </SectionCard>
        ) : null}

        <SectionCard eyebrow="Subscription" title="Barcode access">
          <div className="space-y-3">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {user?.subscriptionTier === "premium" ? "Premium active" : "Free plan"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Manual barcode entry is free. Premium unlocks UPC camera scanning from the grocery add flow.
                  </p>
                </div>
                {user?.subscriptionTier === "premium" ? (
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                    Premium
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpgradeToPremium}
                    className="rounded-[18px] bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-sm font-medium text-white">Redeem promo code</p>
              <p className="mt-1 text-sm text-zinc-400">
                Apply a free premium code to upgrade this account without checkout.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={promoCodeInput}
                  onChange={(event) => setPromoCodeInput(event.target.value.toUpperCase())}
                  placeholder="VITALYX-ABCD-EFGH"
                  className="flex-1 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleRedeemPromoCode}
                  className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-100"
                >
                  Redeem code
                </button>
              </div>
            </div>

            {user?.role === "admin" ? (
              <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Promo code generator</p>
                    <p className="mt-1 text-sm text-emerald-100/80">
                      Generate free premium codes for users right from the More tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePromoCode}
                    className="rounded-[18px] bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950"
                  >
                    Generate premium code
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {promoCodes.length ? (
                    promoCodes.slice(0, 8).map((promoCode) => (
                      <div key={promoCode.id} className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold tracking-[0.18em] text-white">{promoCode.code}</p>
                            <p className="mt-1 text-xs text-zinc-400">
                              Created {new Date(promoCode.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${
                            promoCode.redeemedByUserId
                              ? "bg-white/10 text-zinc-300"
                              : "bg-emerald-400/15 text-emerald-300"
                          }`}>
                            {promoCode.redeemedByUserId ? "Redeemed" : "Available"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                      No promo codes generated yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Goals" title="Current preferences">
          <div className="space-y-3">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Goal size={16} className="text-emerald-300" />Active goals</div><div className="space-y-2 text-sm text-zinc-300"><p>{fitnessSettings[0].value}</p><p>{nutritionSettings[0].value}</p><p>{nutritionSettings[1].value}</p></div></div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4"><div className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Settings2 size={16} className="text-emerald-300" />App preferences</div><div className="space-y-2 text-sm text-zinc-300"><p>{profileSettings[1].label}: {profileSettings[1].value}</p><p>{profileSettings[2].label}: {profileSettings[2].value}</p><p>{nutritionSettings[2].label}: {nutritionSettings[2].value}</p></div></div>
          </div>
        </SectionCard>
        <button type="button" onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-zinc-100">
          <RotateCcw size={16} />
          Sign out {user?.name}
        </button>
      </div>
    );
  }

  if (!isReady) return <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">Loading Vitalyx...</div>;
  if (!user || !appData) return <AuthScreen onSignIn={handleSignIn} onRegister={handleRegister} errorMessage={authError} />;

  const meta = tabMeta[activeTab];
  return (
    <>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handlePhotoSelected(file);
          }
          event.currentTarget.value = "";
        }}
      />
      {showUpcScanner ? (
        <UpcScanner
          onDetected={(barcode) => {
            setBarcodeValue(barcode);
            setShowUpcScanner(false);
            setLoggingMethod("barcode");
          }}
          onClose={() => setShowUpcScanner(false)}
        />
      ) : null}
      {showGroceryUpcScanner ? (
        <UpcScanner
          onDetected={async (barcode) => {
            setShowGroceryUpcScanner(false);
            const result = await groceryPriceService.lookupBarcode(barcode).catch(() => null);
            if (result) {
              setFeedback(`Scanned: ${result.name}${result.brand ? ` (${result.brand})` : ""}`);
            }
          }}
          onClose={() => setShowGroceryUpcScanner(false)}
        />
      ) : null}
      <MobileAppShell activeTab={activeTab} onNavigate={setActiveTab} title={meta.title} subtitle={meta.subtitle} searchValue={searchValue} onSearchChange={setSearchValue} user={user}>
        <div key={activeTab} className="tab-screen">
          {renderScreen()}
        </div>
      </MobileAppShell>
    </>
  );
}

export default App;
