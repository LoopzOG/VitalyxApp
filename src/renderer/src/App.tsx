import { useEffect, useMemo, useRef, useState } from "react";
import { Apple, Dumbbell, Flame, Footprints, Goal, HeartPulse, Repeat, RotateCcw, Settings2, Wallet } from "lucide-react";
import {
  createInitialPlanner,
  fitnessSettings,
  nutritionSettings,
  profileSettings,
  progressKpis,
  workoutSplit,
  type PlannerMeal,
} from "@/data";
import { AddItemForm } from "@/components/AddItemForm";
import { AuthScreen } from "@/components/AuthScreen";
import { CardioEntryForm } from "@/components/CardioEntryForm";
import { ExerciseDatabasePanel } from "@/components/ExerciseDatabasePanel";
import { GroceryDashboardWidget } from "@/components/GroceryDashboardWidget";
import { GroceryItemRow } from "@/components/GroceryItemRow";
import { GroceryListCard } from "@/components/GroceryListCard";
import { LiveBarcodeScanner } from "@/components/LiveBarcodeScanner";
import { ManualPriceForm } from "@/components/ManualPriceForm";
import { MealCard } from "@/components/MealCard";
import { MobileAppShell } from "@/components/MobileAppShell";
import { NutritionLogger, type LoggingMethod } from "@/components/NutritionLogger";
import { PriceBadge } from "@/components/PriceBadge";
import { PriceConfidenceIndicator } from "@/components/PriceConfidenceIndicator";
import { PriceHistoryCard } from "@/components/PriceHistoryCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { StoreComparisonCard } from "@/components/StoreComparisonCard";
import { TotalCostCard } from "@/components/TotalCostCard";
import { VerseOfTheDayCard } from "@/components/VerseOfTheDayCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import {
  createInitialUserData,
  loadPromoCodes,
  generatePremiumPromoCode,
  redeemPromoCode,
  type PromoCodeRecord,
  type SessionUser,
  type UserAppData,
  type CardioLogEntry,
  type WorkoutLogEntry,
  type WorkoutPlanEntry,
} from "@/lib/storage";
import { applyProfileToSessionUser, fetchUserAppData, fetchUserProfile, saveUserAppData, updateUserAccessProfile } from "@/lib/backendAppData";
import { getAccessToken, getRestoredSessionUser, sendPasswordReset, signInWithPassword, signOutUser, signUpWithPassword, subscribeToAuthChanges, updatePassword } from "@/lib/backendAuth";
import { createInitialGroceryLists } from "@/lib/groceryState";
import {
  cardioQuickPresets,
  categoryFilterOrder,
  EQUIPMENT_TAGS,
  exerciseDatabase,
  type ExerciseCategory,
  type CardioQuickPreset,
  type ExerciseRecord,
  type ExerciseTab,
} from "@/lib/exerciseDatabase";
import { mockStores } from "@/lib/groceryMockData";
import { groceryPriceService, productMatchingService, storeComparisonService } from "@/lib/groceryServices";
import { getErrorMessage } from "@/lib/errorMessages";
import { formatExerciseSearch, getExerciseMap, getMuscleOptions, groupExerciseResults, searchExercises } from "@/lib/exerciseSearch";
import { fetchNearbyRetailers, type NearbyRetailersResponse } from "@/lib/instacart";
import { formatMacro, parseMacroString, parseNumber } from "@/lib/macroEstimator";
import { nutritionService, type NutritionEntry } from "@/lib/nutritionService";
import { getDailyVerse, type DailyVerse } from "@/lib/dailyVerse";
import { startPremiumCheckout } from "@/lib/billing";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { GroceryList, GroceryListItem, GroceryUnit, PriceRecord } from "@/lib/groceryTypes";
import type { MobileTab } from "@/components/BottomNav";
const tabMeta: Record<MobileTab, { title: string; subtitle: string }> = {
  home: { title: "Vitalyx", subtitle: "Building your Wealth starts with your Health" },
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

function matchesGrocerySearch(item: GroceryListItem, query: string) {
  const normalizedQuery = productMatchingService.normalizeItemName(query);
  if (!normalizedQuery) {
    return true;
  }

  return [item.name, item.brand, item.barcode, item.category, item.preferredStore]
    .filter(Boolean)
    .some((value) => productMatchingService.normalizeItemName(value ?? "").includes(normalizedQuery));
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

function formatMiles(value?: number) {
  if (!value) {
    return "0 mi";
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} mi`;
}

function formatCalories(value?: number) {
  if (!value) {
    return "0 cal";
  }
  return `${Math.round(value)} cal`;
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

function filterVisibleGroceryPrices(items: GroceryListItem[], isPremiumSubscriber: boolean) {
  if (isPremiumSubscriber) {
    return items;
  }

  return items.map((item) => ({
    ...item,
    latestPrices: item.latestPrices.filter((record) => record.source === "manual"),
  }));
}

function getManualPriceHistory(itemName: string, storeName: string, manualPriceRecords: PriceRecord[]) {
  return manualPriceRecords
    .filter((record) => {
      const sameItem =
        productMatchingService.normalizeItemName(record.itemName) === productMatchingService.normalizeItemName(itemName);
      const sameStore = !storeName || record.storeName === storeName;
      return sameItem && sameStore;
    })
    .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime());
}

function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [appData, setAppData] = useState<UserAppData | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [grocerySearchQuery, setGrocerySearchQuery] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "register" | "forgot-password" | "reset-password">("signin");
  const [dayIndex, setDayIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const [liftSets, setLiftSets] = useState("");
  const [liftWeight, setLiftWeight] = useState("");
  const [liftReps, setLiftReps] = useState("");
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
  const [exerciseTab, setExerciseTab] = useState<ExerciseTab>("all");
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState<ExerciseCategory | "All">("All");
  const [selectedEquipmentTag, setSelectedEquipmentTag] = useState<(typeof EQUIPMENT_TAGS)[number] | "All">("All");
  const [selectedMuscleTag, setSelectedMuscleTag] = useState<string | "All">("All");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [cardioDraft, setCardioDraft] = useState({
    exerciseId: "",
    exerciseName: "",
    durationMinutes: "",
    steps: "",
    miles: "",
    pace: "",
  });
  const [plannedWorkoutTitle, setPlannedWorkoutTitle] = useState("");
  const [plannedWorkoutFocus, setPlannedWorkoutFocus] = useState("");
  const [plannedWorkoutDay, setPlannedWorkoutDay] = useState(todayLabel());
  const [plannedWorkoutDate, setPlannedWorkoutDate] = useState(todayKey());
  const [plannedWorkoutTime, setPlannedWorkoutTime] = useState("18:00");
  const [loggingMethod, setLoggingMethod] = useState<LoggingMethod>("search");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [photoLabel, setPhotoLabel] = useState("");
  const [isNutritionScannerOpen, setIsNutritionScannerOpen] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<NutritionEntry[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nutritionFeedback, setNutritionFeedback] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [selectedGroceryItemId, setSelectedGroceryItemId] = useState<string | null>(null);
  const [showStoreComparison, setShowStoreComparison] = useState(false);
  const [nearbyRetailerNames, setNearbyRetailerNames] = useState<string[]>([]);
  const [retailerFeedStatus, setRetailerFeedStatus] = useState<NearbyRetailersResponse["source"]>("disabled");
  const [retailerFeedMessage, setRetailerFeedMessage] = useState<string | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyVerseLoading, setDailyVerseLoading] = useState(true);
  const [billingLoadingPlan, setBillingLoadingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [billingFeedback, setBillingFeedback] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedRemoteData = useRef(false);

  function requireSupabaseConfig() {
    if (hasSupabaseConfig) {
      return true;
    }

    setAuthError("Supabase is not configured for this deployment yet. Add the Vercel environment variables and redeploy auth.");
    setAuthInfo(null);
    return false;
  }

  useEffect(() => {
    let cancelled = false;

    setDailyVerseLoading(true);
    void getDailyVerse(todayKey())
      .then((verse) => {
        if (!cancelled) {
          setDailyVerse(verse);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDailyVerse(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDailyVerseLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchNearbyRetailers()
      .then((result) => {
        if (!cancelled) {
          setRetailerFeedStatus(result.source);
          setRetailerFeedMessage(result.message ?? result.error ?? null);
          setNearbyRetailerNames(result.retailers.map((retailer) => retailer.name));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRetailerFeedStatus("disabled");
          setRetailerFeedMessage("Retailer feed is unavailable right now, so Vitalyx is using built-in store options.");
          setNearbyRetailerNames([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billingState = params.get("billing");
    if (!billingState) {
      return;
    }

    if (billingState === "success") {
      setBillingFeedback("Stripe checkout completed. Vitalyx Premium will appear as soon as the subscription confirmation finishes.");
    }

    if (billingState === "cancelled") {
      setBillingFeedback("Stripe checkout was cancelled. You can restart monthly or yearly Vitalyx Premium whenever you're ready.");
    }

    params.delete("billing");
    params.delete("session_id");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootAuth() {
      setPromoCodes(loadPromoCodes());

      if (!hasSupabaseConfig) {
        setAuthError("Supabase is not configured yet. Add the environment variables before deploying auth.");
        setIsReady(true);
        return;
      }

      try {
        const restoredUser = await getRestoredSessionUser();
        if (!restoredUser || cancelled) {
          setIsReady(true);
          return;
        }

        const profile = await fetchUserProfile(restoredUser.id);
        const nextUser = applyProfileToSessionUser(restoredUser, profile);
        const nextData = await fetchUserAppData(restoredUser.id);
        const currentDay = todayKey();
        const hydratedData = nextData.usageDates.includes(currentDay) ? nextData : { ...nextData, usageDates: [...nextData.usageDates, currentDay] };

        if (!cancelled) {
          setUser(nextUser);
          setAppData(hydratedData);
          hasLoadedRemoteData.current = true;
        }
      } catch (error) {
        if (!cancelled) {
          setAuthError(getErrorMessage(error, "Unable to restore the secure session."));
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void bootAuth();

    const { data } = subscribeToAuthChanges((event, nextUser) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset-password");
        setAuthInfo("Enter a new password to finish your recovery.");
      }

      if (!nextUser) {
        hasLoadedRemoteData.current = false;
        setUser(null);
        setAppData(null);
        return;
      }

      void (async () => {
        try {
          const profile = await fetchUserProfile(nextUser.id);
          const normalizedUser = applyProfileToSessionUser(nextUser, profile);
          const nextData = await fetchUserAppData(nextUser.id);
          const currentDay = todayKey();
          const hydratedData = nextData.usageDates.includes(currentDay) ? nextData : { ...nextData, usageDates: [...nextData.usageDates, currentDay] };
          setUser(normalizedUser);
          setAppData(hydratedData);
          hasLoadedRemoteData.current = true;
        } catch (error) {
          setAuthError(getErrorMessage(error, "Unable to load your account data."));
        }
      })();
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !appData || !hasLoadedRemoteData.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveUserAppData(user.id, appData).catch((error) => {
        setAuthError(getErrorMessage(error, "Unable to save your data to the backend."));
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [user, appData]);

  const planner = appData?.planner ?? createInitialPlanner();
  const normalizedPlanner = planner.length ? planner : createInitialPlanner();
  const groceryLists = appData?.groceryLists ?? createInitialGroceryLists();
  const manualPriceRecords = appData?.manualPriceRecords ?? [];
  const workoutLog = appData?.workoutLog ?? [];
  const workoutPlans = appData?.workoutPlans ?? [];
  const cardioLog = appData?.cardioLog ?? [];
  const favoriteExerciseIds = appData?.favoriteExerciseIds ?? [];
  const recentExerciseIds = appData?.recentExerciseIds ?? [];
  const recentExerciseSearches = appData?.recentExerciseSearches ?? [];
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
  const weeklyCardioEntries = cardioLog.filter((entry) => {
    const entryDate = new Date(entry.loggedAt);
    const now = new Date();
    const startOfWindow = new Date(now);
    startOfWindow.setHours(0, 0, 0, 0);
    startOfWindow.setDate(startOfWindow.getDate() - 6);
    return entryDate >= startOfWindow;
  });
  const weeklyCardioMiles = weeklyCardioEntries.reduce((total, entry) => total + (entry.miles ?? 0), 0);
  const weeklyCardioSteps = weeklyCardioEntries.reduce((total, entry) => total + (entry.steps ?? 0), 0);
  const weeklyCardioCalories = weeklyCardioEntries.reduce((total, entry) => total + (entry.estimatedCaloriesBurned ?? 0), 0);
  const sortedWorkoutPlans = [...workoutPlans].sort((a, b) =>
    `${a.plannedDate}T${a.plannedTime}`.localeCompare(`${b.plannedDate}T${b.plannedTime}`),
  );
  const todayIndex = Math.max(normalizedPlanner.findIndex((day) => day.day === todayLabel()), 0);
  const safeDayIndex = Math.min(dayIndex, Math.max(normalizedPlanner.length - 1, 0));
  const isPremiumSubscriber = user?.subscriptionTier === "premium";
  const isLivePriceComparisonEnabled = false;
  const canCompareGroceryPrices = isPremiumSubscriber && isLivePriceComparisonEnabled;
  const canUseLiveGroceryScanner = true;
  const todayMeals = normalizedPlanner[todayIndex]?.meals ?? [];
  const totals = mealTotals(todayMeals);
  const activeGroceryList = groceryLists[0] ?? createInitialGroceryLists()[0];
  const availableRetailerNames = nearbyRetailerNames.length ? nearbyRetailerNames : mockStores;
  const pricedGroceryList = {
    ...activeGroceryList,
    items: groceryPriceService.getPricesForList(activeGroceryList.items, manualPriceRecords),
  };
  const visibleGroceryList = {
    ...pricedGroceryList,
    items: filterVisibleGroceryPrices(pricedGroceryList.items, canCompareGroceryPrices),
  };
  const filteredGroceryItems = visibleGroceryList.items.filter((item) => matchesGrocerySearch(item, grocerySearchQuery));
  const comparisonResults = canCompareGroceryPrices ? storeComparisonService.calculateStoreTotals(pricedGroceryList) : [];
  const cheapestStoreResult = canCompareGroceryPrices ? storeComparisonService.getCheapestStore(pricedGroceryList) : null;
  const perItemBestPrices = canCompareGroceryPrices ? storeComparisonService.getPerItemBestPrices(pricedGroceryList) : [];
  const mixAndMatchTotal = perItemBestPrices.reduce((total, entry) => total + entry.totalCost, 0);
  const selectedGroceryItem =
    filteredGroceryItems.find((item) => item.id === selectedGroceryItemId) ?? filteredGroceryItems[0] ?? null;
  const selectedStoreName = selectedGroceryItem?.preferredStore ?? selectedGroceryItem?.latestPrices[0]?.storeName ?? "";
  const selectedItemHistory = selectedGroceryItem
    ? canCompareGroceryPrices
      ? groceryPriceService.getPriceHistory(selectedGroceryItem.name, selectedStoreName, manualPriceRecords)
      : getManualPriceHistory(selectedGroceryItem.name, selectedStoreName, manualPriceRecords)
    : [];
  const weeklyEstimate = cheapestStoreResult?.totalCost ?? mixAndMatchTotal;
  const stapleChanges = canCompareGroceryPrices
    ? ["Chicken breast", "Eggs", "Rice"]
        .map((name) => {
          const history = groceryPriceService.getPriceHistory(name, cheapestStoreResult?.storeName ?? "Walmart", manualPriceRecords);
          if (history.length < 2) return null;
          const latest = history.at(-1)?.price ?? 0;
          const prior = history.at(-2)?.price ?? 0;
          const delta = latest - prior;
          const prefix = delta > 0 ? "+" : "";
          return { item: name, change: `${prefix}$${Math.abs(delta).toFixed(2)}` };
        })
        .filter((entry): entry is { item: string; change: string } => Boolean(entry))
    : [];
  const exerciseMap = useMemo(() => getExerciseMap(exerciseDatabase), []);
  const selectedExercise = selectedExerciseId ? exerciseMap.get(selectedExerciseId) ?? null : null;
  const matchedExercise = useMemo(() => {
    const normalizedName = formatExerciseSearch(exerciseName);
    if (!normalizedName) {
      return selectedExercise && !selectedExercise.isCardio ? selectedExercise : null;
    }
    return (
      exerciseDatabase.find((exercise) =>
        [exercise.name, ...exercise.aliases].some((value) => formatExerciseSearch(value) === normalizedName),
      ) ?? null
    );
  }, [exerciseName, selectedExercise]);
  const muscleOptions = useMemo(() => ["All", ...getMuscleOptions(exerciseDatabase)], []);
  const exerciseResults = useMemo(
    () =>
      searchExercises(exerciseDatabase, {
        query: exerciseSearchQuery,
        tab: exerciseTab,
        category: selectedExerciseCategory,
        equipment: selectedEquipmentTag,
        muscle: selectedMuscleTag,
      }),
    [exerciseSearchQuery, exerciseTab, selectedExerciseCategory, selectedEquipmentTag, selectedMuscleTag],
  );
  const groupedExerciseResults = useMemo(() => groupExerciseResults(exerciseResults.slice(0, 36)), [exerciseResults]);
  const recentExercises = recentExerciseIds
    .map((id) => exerciseMap.get(id))
    .filter((exercise): exercise is ExerciseRecord => Boolean(exercise))
    .slice(0, 4);
  const dropdownResults = useMemo(() => exerciseResults.slice(0, 10), [exerciseResults]);
  const headerSearchValue =
    activeTab === "meals"
      ? foodSearchQuery
      : activeTab === "track"
        ? exerciseSearchQuery
        : activeTab === "more"
          ? grocerySearchQuery
          : searchValue;
  const headerSearchPlaceholder =
    activeTab === "meals"
      ? "Search foods to detect nutrition..."
      : activeTab === "track"
        ? "Search exercises, muscles, equipment..."
        : activeTab === "more"
          ? "Search groceries, barcodes, stores..."
          : "Search meals, lifts, groceries...";

  useEffect(() => {
    if (!matchedExercise || matchedExercise.isCardio) {
      return;
    }

    setSelectedExerciseId(matchedExercise.id);
    setLiftSets((current) => current || "3");
    setLiftReps((current) => current || (matchedExercise.difficulty === "Advanced" ? "5-8" : "8-12"));
  }, [matchedExercise]);

  function handleHeaderSearchChange(value: string) {
    setSearchValue(value);

    if (activeTab === "meals") {
      setLoggingMethod("search");
      setFoodSearchQuery(value);
      return;
    }

    if (activeTab === "track") {
      setExerciseSearchQuery(value);
      return;
    }

    if (activeTab === "more") {
      setGrocerySearchQuery(value);
    }
  }

  function updatePlanner(updater: (value: UserAppData["planner"]) => UserAppData["planner"]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
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
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
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
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
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
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
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
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
        usageDates: [todayKey()],
      };
      return { ...base, workoutPlans: updater(base.workoutPlans) };
    });
  }

  function updateCardioLog(updater: (entries: CardioLogEntry[]) => CardioLogEntry[]) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
        usageDates: [todayKey()],
      };
      return { ...base, cardioLog: updater(base.cardioLog) };
    });
  }

  function updateExerciseLibraryPreferences(
    updater: (current: Pick<UserAppData, "favoriteExerciseIds" | "recentExerciseIds" | "recentExerciseSearches">) => Pick<
      UserAppData,
      "favoriteExerciseIds" | "recentExerciseIds" | "recentExerciseSearches"
    >,
  ) {
    setAppData((current) => {
      const base = current ?? {
        planner: createInitialPlanner(),
        groceryLists: createInitialGroceryLists(),
        manualPriceRecords: [],
        workoutLog: [],
        workoutPlans: [],
        cardioLog: [],
        favoriteExerciseIds: [],
        recentExerciseIds: [],
        recentExerciseSearches: [],
        usageDates: [todayKey()],
      };
      return { ...base, ...updater(base) };
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
    if (matchedExercise && !matchedExercise.isCardio) {
      rememberExerciseSelection(matchedExercise);
    }
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

  function handleExerciseNameChange(value: string) {
    setExerciseName(value);
  }

  function rememberExerciseSelection(exercise: ExerciseRecord) {
    updateExerciseLibraryPreferences((current) => ({
      favoriteExerciseIds: current.favoriteExerciseIds,
      recentExerciseIds: [exercise.id, ...current.recentExerciseIds.filter((id) => id !== exercise.id)].slice(0, 8),
      recentExerciseSearches: exerciseSearchQuery.trim()
        ? [exerciseSearchQuery.trim(), ...current.recentExerciseSearches.filter((value) => value !== exerciseSearchQuery.trim())].slice(0, 6)
        : current.recentExerciseSearches,
    }));
  }

  function toggleFavoriteExercise(exerciseId: string) {
    updateExerciseLibraryPreferences((current) => ({
      recentExerciseIds: current.recentExerciseIds,
      recentExerciseSearches: current.recentExerciseSearches,
      favoriteExerciseIds: current.favoriteExerciseIds.includes(exerciseId)
        ? current.favoriteExerciseIds.filter((id) => id !== exerciseId)
        : [exerciseId, ...current.favoriteExerciseIds].slice(0, 24),
    }));
  }

  function selectExerciseFromLibrary(exercise: ExerciseRecord) {
    setSelectedExerciseId(exercise.id);
    rememberExerciseSelection(exercise);

    if (exercise.isCardio) {
      setCardioDraft((current) => ({
        ...current,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
      }));
      setFeedback(`${exercise.name} is ready in the cardio box. Add steps, miles, time, or pace and save it below.`);
      return;
    }

    setExerciseName(exercise.name);
    setLiftSets((current) => current || "3");
    setLiftReps((current) => current || (exercise.difficulty === "Advanced" ? "5-8" : "8-12"));
    setFeedback(`${exercise.name} loaded into the strength logger. Add your sets, weight, and reps when you're ready.`);
  }

  function applyCardioPreset(preset: CardioQuickPreset) {
    setCardioDraft((current) => ({
      ...current,
      durationMinutes: preset.durationMinutes ? `${preset.durationMinutes}` : current.durationMinutes,
      steps: preset.steps ? `${preset.steps}` : current.steps,
      miles: preset.miles ? `${preset.miles}` : current.miles,
    }));
  }

  function updateCardioDraft(field: keyof typeof cardioDraft, value: string) {
    setCardioDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearStrengthExerciseSelection() {
    setSelectedExerciseId((current) => {
      const selected = current ? exerciseMap.get(current) ?? null : null;
      return selected?.isCardio ? current : null;
    });
    setExerciseName("");
    setLiftSets("");
    setLiftWeight("");
    setLiftReps("");
    setFeedback("Strength exercise removed from the logger.");
  }

  function clearCardioExerciseSelection() {
    setSelectedExerciseId((current) => {
      const selected = current ? exerciseMap.get(current) ?? null : null;
      return selected?.isCardio ? null : current;
    });
    setCardioDraft({
      exerciseId: "",
      exerciseName: "",
      durationMinutes: "",
      steps: "",
      miles: "",
      pace: "",
    });
    setFeedback("Cardio exercise removed from the logger.");
  }

  function addCardioEntry() {
    const selectedCardioExercise = cardioDraft.exerciseId ? exerciseMap.get(cardioDraft.exerciseId) ?? null : null;
    if (!selectedCardioExercise || !selectedCardioExercise.isCardio) {
      setFeedback("Choose a cardio exercise from the cardio box before saving a cardio entry.");
      return;
    }

    const durationMinutes = cardioDraft.durationMinutes.trim() ? Number(cardioDraft.durationMinutes) : undefined;
    const steps = cardioDraft.steps.trim() ? Number(cardioDraft.steps) : undefined;
    const miles = cardioDraft.miles.trim() ? Number(cardioDraft.miles) : undefined;

    if (
      (durationMinutes !== undefined && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) ||
      (steps !== undefined && (!Number.isFinite(steps) || steps <= 0)) ||
      (miles !== undefined && (!Number.isFinite(miles) || miles <= 0))
    ) {
      setFeedback("Cardio entries need positive numeric values for time, steps, and miles.");
      return;
    }

    if (durationMinutes === undefined && steps === undefined && miles === undefined) {
      setFeedback("Add at least one cardio metric like minutes, steps, or miles before saving.");
      return;
    }

    const loggedAt = new Date();
    const calorieEstimate = durationMinutes && selectedCardioExercise.calorieEstimatePerMinute
      ? durationMinutes * selectedCardioExercise.calorieEstimatePerMinute
      : undefined;
    const nextEntry: CardioLogEntry = {
      id: crypto.randomUUID(),
      exerciseId: selectedCardioExercise.id,
      exerciseName: selectedCardioExercise.name,
      workoutDay: new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(loggedAt),
      loggedDate: dateKeyFromValue(loggedAt),
      loggedTime: timeKeyFromValue(loggedAt),
      durationMinutes,
      steps,
      miles,
      pace: cardioDraft.pace.trim() || undefined,
      estimatedCaloriesBurned: calorieEstimate,
      loggedAt: loggedAt.toISOString(),
    };

    updateCardioLog((current) => [nextEntry, ...current]);
    rememberExerciseSelection(selectedCardioExercise);
    setCardioDraft({
      exerciseId: selectedCardioExercise.id,
      exerciseName: selectedCardioExercise.name,
      durationMinutes: "",
      steps: "",
      miles: "",
      pace: "",
    });
    setFeedback(
      `${selectedCardioExercise.name} saved${steps ? ` with ${steps.toLocaleString()} steps` : ""}${miles ? ` and ${miles} miles` : ""}.`,
    );
  }

  function removeWorkoutEntry(entryId: string) {
    updateWorkoutLog((current) => current.filter((entry) => entry.id !== entryId));
    setFeedback("Workout entry removed.");
  }

  function removeCardioEntry(entryId: string) {
    updateCardioLog((current) => current.filter((entry) => entry.id !== entryId));
    setFeedback("Cardio entry removed.");
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

  async function handleSignIn(input: { email: string; password: string }) {
    if (!requireSupabaseConfig()) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      const result = await signInWithPassword(input);
      if (!result.user) {
        throw new Error("No authenticated user was returned.");
      }

      const mappedUser = await getRestoredSessionUser();
      const baseUser = mappedUser ?? {
        id: result.user.id,
        name: input.email.split("@")[0],
        email: result.user.email ?? input.email,
        role: "user" as const,
        subscriptionTier: "free" as const,
      };
      const profile = await fetchUserProfile(result.user.id);
      const nextUser = applyProfileToSessionUser(baseUser, profile);
      const nextData = await fetchUserAppData(result.user.id);
      const currentDay = todayKey();
      const hydratedData = nextData.usageDates.includes(currentDay) ? nextData : { ...nextData, usageDates: [...nextData.usageDates, currentDay] };

      setUser(nextUser);
      setAppData(hydratedData);
      hasLoadedRemoteData.current = true;
      setAuthMode("signin");
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to sign in."));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(input: { name: string; email: string; password: string }) {
    if (!requireSupabaseConfig()) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      const result = await signUpWithPassword({
        displayName: input.name,
        email: input.email,
        password: input.password,
      });

      if (!result.user) {
        throw new Error("Your account could not be created.");
      }

      if (!result.session) {
        setAuthInfo("Account created. Check your email to confirm your address before signing in.");
        setAuthMode("signin");
        return;
      }

      const profile = await fetchUserProfile(result.user.id);
      const nextUser = applyProfileToSessionUser(
        {
          id: result.user.id,
          name: input.name,
          email: result.user.email ?? input.email,
          role: "user",
          subscriptionTier: "free",
        },
        profile,
      );
      const nextData = await fetchUserAppData(result.user.id);
      setUser(nextUser);
      setAppData(nextData);
      hasLoadedRemoteData.current = true;
      setAuthInfo("Your account is ready and your secure session has started.");
      setAuthMode("signin");
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to create account."));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotPassword(input: { email: string }) {
    if (!requireSupabaseConfig()) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      await sendPasswordReset(input.email);
      setAuthInfo("Password reset email sent. Open the link from your inbox to continue.");
      setAuthMode("signin");
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to send the password reset email."));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResetPassword(input: { password: string; confirmPassword: string }) {
    if (!requireSupabaseConfig()) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthInfo(null);

    try {
      await updatePassword(input.password);
      setAuthInfo("Password updated. You can now sign in with the new password.");
      setAuthMode("signin");
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to update the password."));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser();
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to sign out right now."));
    } finally {
      hasLoadedRemoteData.current = false;
      setUser(null);
      setAppData(null);
      setActiveTab("home");
    }
  }

  function refreshPromoCodes() {
    setPromoCodes(loadPromoCodes());
  }

  async function handleUpgradeToPremium() {
    if (!user) {
      return;
    }

    if (user.subscriptionTier === "premium") {
      setBillingFeedback("Vitalyx Premium is already active on this account.");
      return;
    }

    await handleStartPremiumCheckout("monthly");
  }

  async function handleStartPremiumCheckout(interval: "monthly" | "yearly") {
    if (!user) {
      return;
    }

    if (user.subscriptionTier === "premium") {
      setBillingFeedback("Vitalyx Premium is already active on this account.");
      return;
    }

    setBillingFeedback(null);
    setBillingLoadingPlan(interval);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Sign in again before starting Stripe checkout.");
      }

      await startPremiumCheckout({
        accessToken,
        interval,
        userId: user.id,
        userEmail: user.email,
      });
    } catch (error) {
      setBillingFeedback(getErrorMessage(error, "Unable to start Vitalyx Premium checkout right now."));
    } finally {
      setBillingLoadingPlan(null);
    }
  }

  function handleGeneratePromoCode() {
    if (!user) {
      return;
    }

    const nextCode = generatePremiumPromoCode(user.id);
    refreshPromoCodes();
    setFeedback(`Premium promo code generated: ${nextCode.code}`);
  }

  async function handleRedeemPromoCode() {
    if (!user) {
      return;
    }

    try {
      const result = redeemPromoCode({ code: promoCodeInput, userId: user.id });
      const nextProfile = await updateUserAccessProfile(user.id, {
        subscription_tier: result.promoCode.subscriptionTier,
      });
      const nextUser = applyProfileToSessionUser(user, nextProfile);

      setUser(nextUser);
      setPromoCodeInput("");
      refreshPromoCodes();
      setFeedback(`Promo code applied. ${result.promoCode.subscriptionTier === "premium" ? "Premium" : "Subscription"} is now active.`);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Unable to redeem that promo code."));
    }
  }

  function resetDetectionState() {
    setPendingEntries([]);
    setNutritionFeedback(null);
    setEditingMealId(null);
  }

  async function runLookup() {
    let result: NutritionEntry | NutritionEntry[] | null = null;
    try {
      if (loggingMethod === "barcode") {
        result = await nutritionService.fromBarcode(barcodeValue);
        setNutritionFeedback(
          result
            ? "Open Food Facts nutrition found. Double-check serving before saving."
            : "No product was found for that barcode, or nutrition values were incomplete.",
        );
      } else if (loggingMethod === "search") {
        result = await nutritionService.fromSearch(foodSearchQuery);
        setNutritionFeedback(
          result
            ? "Search matched a food profile. Review and edit if needed before saving."
            : "No food match found. Try wording like '2 eggs' or '6 oz chicken breast'.",
        );
      }

      setPendingEntries(result ? (Array.isArray(result) ? result : [result]) : []);
    } catch (error) {
      setPendingEntries([]);
      setNutritionFeedback(error instanceof Error ? error.message : "Nutrition lookup failed. Please try again.");
    }
  }

  async function handleNutritionBarcodeDetected(detectedBarcode: string) {
    setBarcodeValue(detectedBarcode);
    const result = await nutritionService.fromBarcode(detectedBarcode);

    if (!result) {
      setNutritionFeedback("Barcode detected, but no nutrition match was found yet. Try better lighting or enter the barcode manually.");
      throw new Error("Nutrition barcode lookup did not return a product.");
    }

    setPendingEntries([result]);
    setNutritionFeedback("Open Food Facts nutrition found. Double-check serving before saving.");
  }

  function handleNutritionLoggingMethod(method: LoggingMethod) {
    setLoggingMethod(method);
    if (method === "barcode") {
      setIsNutritionScannerOpen(true);
    }
  }

  async function handlePhotoSelected(file: File) {
    const result = await nutritionService.fromPhoto(file);
    setPhotoLabel(file.name);
    setNutritionFeedback(
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
        index !== safeDayIndex
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
    const meal = normalizedPlanner[safeDayIndex]?.meals.find((entry) => (entry.id ?? entry.title) === mealId);
    if (!meal) return;
    setLoggingMethod("search");
    setPendingEntries([mealToNutritionEntry(meal)]);
    setEditingMealId(meal.id ?? meal.title);
    setNutritionFeedback("Edit the detected nutrition, then save to update this food entry.");
  }

  function removeMeal(mealId: string) {
    updatePlanner((current) =>
      current.map((day, index) => (index === safeDayIndex ? { ...day, meals: day.meals.filter((meal) => (meal.id ?? meal.title) !== mealId) } : day)),
    );
    if (editingMealId === mealId) resetDetectionState();
  }

  async function addGroceryItem(input: {
    name: string;
    quantity: number;
    unit: GroceryUnit;
    barcode?: string;
    brand?: string;
    category?: string;
    matchedProductId?: string;
    preferredStore?: string;
  }) {
    const matchedProduct = productMatchingService.matchItemToProduct({
      name: input.name,
      brand: input.brand,
      barcode: input.barcode,
      matchedProductId: input.matchedProductId,
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
      category: input.category ?? matchedProduct?.category,
      matchedProductId: input.matchedProductId ?? matchedProduct?.id,
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
          <VerseOfTheDayCard verse={dailyVerse} isLoading={dailyVerseLoading} />
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
      const day = normalizedPlanner[safeDayIndex] ?? normalizedPlanner[0];
      const dayTotals = mealTotals(day.meals);
      return (
        <NutritionLogger
          dayLabel={day.day}
          loggingMethod={loggingMethod}
          onLoggingMethod={handleNutritionLoggingMethod}
          barcodeValue={barcodeValue}
          onBarcodeValue={setBarcodeValue}
          onOpenBarcodeScanner={() => {
            setLoggingMethod("barcode");
            setIsNutritionScannerOpen(true);
          }}
          searchValue={foodSearchQuery}
          onSearchValue={setFoodSearchQuery}
          photoLabel={photoLabel}
          onRunLookup={runLookup}
          onOpenPhotoPicker={() => photoInputRef.current?.click()}
          pendingEntries={pendingEntries}
          onEntryChange={handleEntryChange}
          onSaveEntries={saveDetectedEntries}
          onCancelEntries={resetDetectionState}
          feedback={nutritionFeedback}
          editingMealId={editingMealId}
          totals={dayTotals}
          meals={day.meals}
          onEditMeal={editMeal}
          onRemoveMeal={removeMeal}
          renderMealCard={(meal) => <MealCard {...meal} actionLabel="Edit" onAction={() => editMeal(meal.id ?? meal.title)} />}
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
          <SectionCard eyebrow="Exercise database" title="Search lifts, favorites, and cardio">
            <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              {feedback ?? (sessionStarted ? `${completedSets} sets logged so far. Last entry at ${savedAt}.` : "Search by name, muscle, equipment, or category, then send the exercise into either the strength logger or cardio box.")}
            </div>
            <div className="mt-4">
              <ExerciseDatabasePanel
                query={exerciseSearchQuery}
                onQueryChange={setExerciseSearchQuery}
                tab={exerciseTab}
                onTabChange={setExerciseTab}
                category={selectedExerciseCategory}
                onCategoryChange={setSelectedExerciseCategory}
                equipment={selectedEquipmentTag}
                onEquipmentChange={setSelectedEquipmentTag}
                muscle={selectedMuscleTag}
                onMuscleChange={setSelectedMuscleTag}
                groupedResults={groupedExerciseResults}
                favorites={favoriteExerciseIds}
                onToggleFavorite={toggleFavoriteExercise}
                onSelectExercise={selectExerciseFromLibrary}
                recentExercises={recentExercises}
                dropdownResults={dropdownResults}
                recentSearches={recentExerciseSearches}
                onPickRecentSearch={setExerciseSearchQuery}
                categoryOptions={["All", ...categoryFilterOrder]}
                equipmentOptions={["All", ...EQUIPMENT_TAGS]}
                muscleOptions={muscleOptions}
              />
            </div>
          </SectionCard>
          <SectionCard eyebrow="Strength logger" title="Add a set">
            <div className="grid gap-3">
              <input
                type="text"
                value={exerciseName}
                onChange={(event) => handleExerciseNameChange(event.target.value)}
                placeholder="Selected strength exercise"
                className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              {matchedExercise && !matchedExercise.isCardio ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{matchedExercise.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        Primary: {matchedExercise.primaryMuscle}
                        {matchedExercise.secondaryMuscles.length ? ` | Secondary: ${matchedExercise.secondaryMuscles.join(", ")}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                      {matchedExercise.category}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchedExercise.equipment.map((item) => (
                      <PriceBadge key={item} label={item} tone="muted" />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearStrengthExerciseSelection}
                    className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-2 text-xs font-medium text-zinc-200"
                  >
                    Remove exercise
                  </button>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={liftSets}
                  onChange={(event) => setLiftSets(event.target.value)}
                  placeholder="Sets"
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
              <button
                type="button"
                onClick={addWorkoutEntry}
                className="rounded-[22px] bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950"
              >
                Add workout set
              </button>
            </div>
          </SectionCard>
          <SectionCard eyebrow="Cardio logger" title="Track steps, miles, and time">
            <CardioEntryForm
              selectedExercise={selectedExercise && selectedExercise.isCardio ? selectedExercise : cardioDraft.exerciseId ? exerciseMap.get(cardioDraft.exerciseId) ?? null : null}
              draft={cardioDraft}
              presets={cardioQuickPresets}
              onDraftChange={updateCardioDraft}
              onApplyPreset={applyCardioPreset}
              onClear={clearCardioExerciseSelection}
              onSubmit={addCardioEntry}
            />
          </SectionCard>
          <SectionCard eyebrow="Recent activity" title="Strength and cardio history">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent sets</p>
                {workoutLog.length ? (
                  workoutLog.slice(0, 6).map((entry) => (
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
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-400">
                    No strength sets logged yet. Pick an exercise from the database and add your first set.
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-200/70">Recent cardio</p>
                {cardioLog.length ? (
                  cardioLog.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-[22px] border border-sky-400/15 bg-sky-400/8 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-white">{entry.exerciseName}</p>
                          <p className="mt-1 break-words text-sm text-slate-200/80">
                            {entry.durationMinutes ? `${entry.durationMinutes} min` : "No time"} | {entry.steps ? `${entry.steps.toLocaleString()} steps` : "No steps"} | {entry.miles ? formatMiles(entry.miles) : "No miles"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-200/80">
                            {entry.pace ? `${entry.pace} pace` : "Pace optional"} | {formatCalories(entry.estimatedCaloriesBurned)}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{formatShortDateTime(entry.loggedDate, entry.loggedTime)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCardioEntry(entry.id)}
                          className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-sky-300/20 bg-sky-400/8 p-4 text-sm leading-7 text-sky-100/75">
                    No cardio entries yet. Open the cardio box, choose an activity, and log steps, miles, or time.
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
          <SectionCard eyebrow="Progress summary" title="Strength and cardio momentum">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Sets Logged" value={`${totalSetsLogged}`} detail="All-time strength sets saved on this device" icon={Dumbbell} />
              <StatCard label="Weekly Volume" value={`${weeklyWeightLifted.toLocaleString()} lb`} detail="Weight x reps over the last 7 days" icon={Apple} emphasis="accent" />
              <StatCard label="Weekly Cardio" value={formatMiles(weeklyCardioMiles)} detail={`${weeklyCardioSteps.toLocaleString()} steps in the last 7 days`} icon={Footprints} />
              <StatCard label="Calories Burned" value={formatCalories(weeklyCardioCalories)} detail="Estimated from cardio sessions with time logged" icon={Flame} />
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
            <div className="mt-4 rounded-[22px] border border-sky-400/15 bg-sky-400/8 p-4 text-sm text-sky-100/80">
              The cardio section stays separate from lifts, but both feed the same workout dashboard so future plans, analytics, and recommendations can build on one shared exercise database.
            </div>
          </SectionCard>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <SectionCard eyebrow="Dashboard widget" title="Grocery price tracking">
          {canCompareGroceryPrices ? (
            <div className="space-y-3">
              <GroceryDashboardWidget
                weeklyEstimate={weeklyEstimate}
                cheapestStore={cheapestStoreResult?.storeName ?? "No match yet"}
                cheapestTotal={cheapestStoreResult?.totalCost ?? 0}
                stapleChanges={stapleChanges.length ? stapleChanges : [{ item: "Staples", change: "awaiting list data" }]}
              />
              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3 text-xs leading-6 text-zinc-400">
                {retailerFeedStatus === "instacart"
                  ? `Retailer matching is using nearby Instacart-supported stores${availableRetailerNames.length ? `: ${availableRetailerNames.slice(0, 4).join(", ")}` : ""}.`
                  : retailerFeedMessage ?? "Retailer feed is not configured yet, so grocery matching is currently using built-in store options and manual price updates."}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-emerald-300/15 bg-emerald-400/8 p-4 text-sm leading-7 text-zinc-200">
              UPC product scanning and manual price tracking are active. Live store comparison is temporarily paused until the retailer pricing feed is connected.
            </div>
          )}
        </SectionCard>

        <GroceryListCard
          name={visibleGroceryList.name}
          itemCount={visibleGroceryList.items.length}
          totalLabel={canCompareGroceryPrices && cheapestStoreResult ? formatMoney(cheapestStoreResult.totalCost) : "Manual tracking"}
          subtitle={
            canCompareGroceryPrices && cheapestStoreResult
              ? `${cheapestStoreResult.storeName} is currently the cheapest full-list option.`
              : canCompareGroceryPrices
                ? "Add items to see price estimates across stores."
                : "Scan products, build your list, and save your own price checks while comparison is paused."
          }
        >
          <AddItemForm
            onAdd={addGroceryItem}
            onBarcodeLookup={(barcode) => groceryPriceService.lookupBarcode(barcode)}
            isPremiumSubscriber={isPremiumSubscriber}
            canUseLiveScanner={canUseLiveGroceryScanner}
            canComparePrices={canCompareGroceryPrices}
            onUpgradeToPremium={handleUpgradeToPremium}
            storeOptions={availableRetailerNames}
          />

          {filteredGroceryItems.length ? (
            <div className="space-y-3">
              {filteredGroceryItems.map((item) => {
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
                      canComparePrices={canCompareGroceryPrices}
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
              {visibleGroceryList.items.length
                ? "No grocery items match that search yet. Try a product name, barcode, brand, or store."
                : "Your list is empty. Add staples like chicken breast, eggs, rice, greek yogurt, ground beef, oats, or broccoli to start building your grocery log."}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setFeedback("Live store comparison is temporarily disabled while the retailer pricing feed is being rebuilt.");
            }}
            className="w-full rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-zinc-100"
          >
            Store comparison coming soon
          </button>
        </GroceryListCard>

        {showStoreComparison && canCompareGroceryPrices && pricedGroceryList.items.length ? (
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
                      {canCompareGroceryPrices
                        ? "No store prices were matched for this item yet. Try a clearer grocery name or add your own manual price."
                        : "No manual prices saved yet. Add your own price update to start tracking this item."}
                    </div>
                  )}
                </div>
              </div>

              {!canCompareGroceryPrices ? (
                <div className="rounded-[20px] border border-emerald-300/15 bg-emerald-400/8 p-4 text-sm text-zinc-200">
                  Product tracking by UPC is active. Manual price checks stay available while automatic comparison is paused.
                </div>
              ) : null}

              <PriceHistoryCard
                itemName={selectedGroceryItem.name}
                storeName={selectedStoreName || "No store selected"}
                records={selectedItemHistory}
              />

              <ManualPriceForm
                item={selectedGroceryItem}
                storeOptions={availableRetailerNames}
                onSave={(input) => saveManualPriceUpdate(selectedGroceryItem, input)}
              />
            </div>
          </SectionCard>
        ) : null}

        <SectionCard eyebrow="Membership" title="Vitalyx Premium">
          <div className="space-y-3">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {user?.subscriptionTier === "premium" ? "Vitalyx Premium active" : "Free plan"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Vitalyx Premium unlocks live UPC camera scanning, grocery comparison tools, and advanced tracking through Stripe billing at $9.99 monthly or $59.99 yearly.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {retailerFeedStatus === "instacart"
                      ? "Nearby retailer discovery is connected."
                      : "Live retailer discovery can be enabled later with Instacart server credentials."}
                  </p>
                </div>
                {user?.subscriptionTier === "premium" ? (
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                    Vitalyx Premium
                  </span>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleStartPremiumCheckout("monthly")}
                      disabled={billingLoadingPlan !== null}
                      className="rounded-[18px] bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {billingLoadingPlan === "monthly" ? "Starting..." : "Vitalyx Premium $9.99 / month"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStartPremiumCheckout("yearly")}
                      disabled={billingLoadingPlan !== null}
                      className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {billingLoadingPlan === "yearly" ? "Starting..." : "Vitalyx Premium $59.99 / year"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {billingFeedback ? (
              <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {billingFeedback}
              </div>
            ) : null}

            <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-sm font-medium text-white">Redeem promo code</p>
              <p className="mt-1 text-sm text-zinc-400">
                Apply a free Vitalyx Premium code to upgrade this account without checkout.
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

  const meta = tabMeta[activeTab];
  if (!isReady) return <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">Loading Vitalyx...</div>;

  const authenticatedUser = user;

  return (
    <>
      <LiveBarcodeScanner
        open={isNutritionScannerOpen}
        onDetected={handleNutritionBarcodeDetected}
        onClose={() => setIsNutritionScannerOpen(false)}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handlePhotoSelected(file);
          }
          event.currentTarget.value = "";
        }}
      />
      <ProtectedRoute
        isAuthenticated={Boolean(user && appData)}
        fallback={
          <AuthScreen
            onSignIn={handleSignIn}
            onRegister={handleRegister}
            onForgotPassword={handleForgotPassword}
            onResetPassword={handleResetPassword}
            errorMessage={authError}
            infoMessage={authInfo}
            loading={authLoading}
            initialMode={authMode}
          />
        }
      >
        <MobileAppShell
          activeTab={activeTab}
          onNavigate={setActiveTab}
          title={meta.title}
          subtitle={meta.subtitle}
          searchValue={headerSearchValue}
          onSearchChange={handleHeaderSearchChange}
          searchPlaceholder={headerSearchPlaceholder}
          user={authenticatedUser!}
        >
          {renderScreen()}
        </MobileAppShell>
      </ProtectedRoute>
    </>
  );
}

export default App;
