import { createInitialPlanner, normalizePlanner, type PlannerDay } from "@/data";
import { createInitialGroceryLists, normalizeGroceryLists, normalizeManualPriceRecords } from "@/lib/groceryState";
import type { GroceryList, ManualBarcodeEntry, PriceRecord } from "@/lib/groceryTypes";

const ACCOUNTS_KEY = "vitalyx.accounts.v1";
const SESSION_KEY = "vitalyx.session.v1";
const USER_DATA_KEY = "vitalyx.userdata.v1";
const PROMO_CODES_KEY = "vitalyx.promocodes.v1";
const ACCOUNT_AUDIT_LOG_KEY = "vitalyx.accountaudit.v1";

export type StoredAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  subscriptionTier: "free" | "premium";
  createdAt: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  subscriptionTier: "free" | "premium";
};

export type WorkoutLogEntry = {
  id: string;
  exercise: string;
  workoutDay: string;
  loggedDate: string;
  loggedTime: string;
  sets: number;
  weight: number;
  reps: number;
  loggedAt: string;
};

export type WorkoutPlanEntry = {
  id: string;
  title: string;
  focus: string;
  workoutDay: string;
  plannedDate: string;
  plannedTime: string;
  createdAt: string;
};

export type CardioLogEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  workoutDay: string;
  loggedDate: string;
  loggedTime: string;
  durationMinutes?: number;
  steps?: number;
  miles?: number;
  pace?: string;
  estimatedCaloriesBurned?: number;
  loggedAt: string;
};

export type UserAppData = {
  planner: PlannerDay[];
  groceryLists: GroceryList[];
  manualPriceRecords: PriceRecord[];
  manualBarcodeEntries: ManualBarcodeEntry[];
  workoutLog: WorkoutLogEntry[];
  workoutPlans: WorkoutPlanEntry[];
  cardioLog: CardioLogEntry[];
  favoriteExerciseIds: string[];
  recentExerciseIds: string[];
  recentExerciseSearches: string[];
  usageDates: string[];
};

export type PromoCodeRecord = {
  id: string;
  code: string;
  subscriptionTier: "premium";
  createdAt: string;
  createdByUserId: string;
  redeemedAt?: string;
  redeemedByUserId?: string;
};

export type AccountAuditRecord = {
  id: string;
  accountId: string;
  email: string;
  action: "register" | "login" | "logout" | "subscription-updated";
  createdAt: string;
  metadata?: Record<string, string>;
};

function uid() {
  return crypto.randomUUID();
}

function cleanBarcode(value: string) {
  return value.replace(/[^\d]/g, "");
}

function weekdayFromIso(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Unassigned"
    : new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(parsed);
}

function dateFromIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeFromIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toTimeString().slice(0, 5);
  }

  return `${parsed.getHours()}`.padStart(2, "0") + ":" + `${parsed.getMinutes()}`.padStart(2, "0");
}

const DEFAULT_ADMIN = {
  id: "vitalyx-admin-root",
  name: "Vitalyx Health Admin",
  email: "Vitalyxhealth@gmail.com",
  password: "LoopzAdmin",
  role: "admin" as const,
  subscriptionTier: "premium" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Some mobile/private browsers reject storage writes; the app should keep running.
  }
}

function appendAccountAuditRecord(record: Omit<AccountAuditRecord, "id" | "createdAt">) {
  const records = safeRead<AccountAuditRecord[]>(ACCOUNT_AUDIT_LOG_KEY, []);
  const nextRecord: AccountAuditRecord = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...record,
  };
  safeWrite(ACCOUNT_AUDIT_LOG_KEY, [nextRecord, ...records].slice(0, 500));
}

export function loadAccountAuditLog() {
  return safeRead<AccountAuditRecord[]>(ACCOUNT_AUDIT_LOG_KEY, [])
    .filter((record) => Boolean(record && typeof record === "object"))
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : uid(),
      accountId: typeof record.accountId === "string" ? record.accountId : "unknown",
      email: typeof record.email === "string" ? record.email : "unknown",
      action:
        record.action === "register" || record.action === "login" || record.action === "logout" || record.action === "subscription-updated"
          ? record.action
          : "register",
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
      metadata:
        record.metadata && typeof record.metadata === "object"
          ? Object.fromEntries(Object.entries(record.metadata).filter((entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string"))
          : undefined,
    }));
}

export function createInitialUserData(): UserAppData {
  return {
    planner: createInitialPlanner(),
    groceryLists: createInitialGroceryLists(),
    manualPriceRecords: [],
    manualBarcodeEntries: [],
    workoutLog: [],
    workoutPlans: [],
    cardioLog: [],
    favoriteExerciseIds: [],
    recentExerciseIds: [],
    recentExerciseSearches: [],
    usageDates: [],
  };
}

export function loadAccounts() {
  const storedAccounts = safeRead<StoredAccount[]>(ACCOUNTS_KEY, []);
  const normalizedAccounts = storedAccounts.map((account) => ({
    ...account,
    subscriptionTier: account.subscriptionTier ?? (account.role === "admin" ? "premium" : "free"),
  }));
  const nextAccounts = normalizedAccounts.filter(
    (account) =>
      account.id !== DEFAULT_ADMIN.id &&
      !(account.role === "admin" && account.email.trim().toLowerCase() === DEFAULT_ADMIN.email.toLowerCase()),
  );
  nextAccounts.unshift(DEFAULT_ADMIN);

  const accountsChanged =
    nextAccounts.length !== storedAccounts.length ||
    nextAccounts.some((account, index) => {
      const prior = storedAccounts[index];
      return !prior || JSON.stringify(account) !== JSON.stringify(prior);
    });

  if (accountsChanged) {
    saveAccounts(nextAccounts);
  }

  if (!safeRead<Record<string, UserAppData>>(USER_DATA_KEY, {})[DEFAULT_ADMIN.id]) {
    saveUserData(DEFAULT_ADMIN.id, createInitialUserData());
  }

  return nextAccounts;
}

export function saveAccounts(accounts: StoredAccount[]) {
  safeWrite(ACCOUNTS_KEY, accounts);
}

export function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}) {
  const accounts = loadAccounts();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
    throw new Error("An account with that email already exists.");
  }

  const account: StoredAccount = {
    id: uid(),
    name: input.name.trim(),
    email: normalizedEmail,
    password: input.password,
    role: "user",
    subscriptionTier: "free",
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, account]);
  saveUserData(account.id, createInitialUserData());
  appendAccountAuditRecord({
    accountId: account.id,
    email: account.email,
    action: "register",
    metadata: {
      role: account.role,
      subscriptionTier: account.subscriptionTier,
    },
  });

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    subscriptionTier: account.subscriptionTier,
  } satisfies SessionUser;
}

export function authenticateAccount(input: { email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const account = loadAccounts().find(
    (entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === input.password,
  );

  if (!account) {
    throw new Error("Invalid email or password.");
  }

  appendAccountAuditRecord({
    accountId: account.id,
    email: account.email,
    action: "login",
    metadata: {
      role: account.role,
      subscriptionTier: account.subscriptionTier,
    },
  });

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    subscriptionTier: account.subscriptionTier,
  } satisfies SessionUser;
}

export function saveSession(user: SessionUser) {
  safeWrite(SESSION_KEY, user);
}

export function loadSession() {
  const session = safeRead<SessionUser | null>(SESSION_KEY, null);
  if (!session) {
    return null;
  }

  return {
    ...session,
    subscriptionTier: session.subscriptionTier ?? (session.role === "admin" ? "premium" : "free"),
  };
}

export function clearSession() {
  const session = loadSession();
  if (session) {
    appendAccountAuditRecord({
      accountId: session.id,
      email: session.email,
      action: "logout",
      metadata: {
        role: session.role,
        subscriptionTier: session.subscriptionTier,
      },
    });
  }
  localStorage.removeItem(SESSION_KEY);
}

export function updateAccountSubscription(userId: string, subscriptionTier: "free" | "premium") {
  const accounts = loadAccounts();
  const nextAccounts = accounts.map((account) =>
    account.id === userId
      ? {
          ...account,
          subscriptionTier,
        }
      : account,
  );

  saveAccounts(nextAccounts);
  const updatedAccount = nextAccounts.find((account) => account.id === userId) ?? null;
  if (updatedAccount) {
    appendAccountAuditRecord({
      accountId: updatedAccount.id,
      email: updatedAccount.email,
      action: "subscription-updated",
      metadata: {
        subscriptionTier,
      },
    });
  }
  return updatedAccount;
}

export function loadPromoCodes() {
  const records = safeRead<PromoCodeRecord[]>(PROMO_CODES_KEY, []);
  return records
    .filter((record) => Boolean(record && typeof record === "object"))
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : uid(),
      code: typeof record.code === "string" ? record.code : `VITALYX-${uid().slice(0, 8).toUpperCase()}`,
      subscriptionTier: "premium" as const,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
      createdByUserId: typeof record.createdByUserId === "string" ? record.createdByUserId : DEFAULT_ADMIN.id,
      redeemedAt: typeof record.redeemedAt === "string" ? record.redeemedAt : undefined,
      redeemedByUserId: typeof record.redeemedByUserId === "string" ? record.redeemedByUserId : undefined,
    }));
}

export function savePromoCodes(records: PromoCodeRecord[]) {
  safeWrite(PROMO_CODES_KEY, records);
}

export function generatePremiumPromoCode(createdByUserId: string) {
  const records = loadPromoCodes();
  const promoCode: PromoCodeRecord = {
    id: uid(),
    code: `VITALYX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    subscriptionTier: "premium",
    createdAt: new Date().toISOString(),
    createdByUserId,
  };

  savePromoCodes([promoCode, ...records]);
  return promoCode;
}

export function redeemPromoCode(input: { code: string; userId: string }) {
  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("Enter a promo code first.");
  }

  const records = loadPromoCodes();
  const match = records.find((record) => record.code.toUpperCase() === normalizedCode);

  if (!match) {
    throw new Error("That promo code was not found.");
  }

  if (match.redeemedByUserId) {
    throw new Error("That promo code has already been redeemed.");
  }

  const updatedRecord: PromoCodeRecord = {
    ...match,
    redeemedAt: new Date().toISOString(),
    redeemedByUserId: input.userId,
  };

  savePromoCodes(records.map((record) => (record.id === match.id ? updatedRecord : record)));
  const updatedAccount = updateAccountSubscription(input.userId, updatedRecord.subscriptionTier);

  if (!updatedAccount) {
    throw new Error("The promo code worked, but the account could not be upgraded.");
  }

  return {
    promoCode: updatedRecord,
    account: updatedAccount,
  };
}

export function saveUserData(userId: string, data: UserAppData) {
  const allData = safeRead<Record<string, UserAppData>>(USER_DATA_KEY, {});
  allData[userId] = data;
  safeWrite(USER_DATA_KEY, allData);
}

export function loadUserData(userId: string) {
  const allData = safeRead<Record<string, UserAppData>>(USER_DATA_KEY, {});
  const stored = allData[userId];
  if (!stored) {
    return createInitialUserData();
  }

  return {
    planner: normalizePlanner(stored.planner),
    groceryLists: normalizeGroceryLists(stored.groceryLists),
    manualPriceRecords: normalizeManualPriceRecords(stored.manualPriceRecords),
    manualBarcodeEntries: Array.isArray(stored.manualBarcodeEntries)
      ? stored.manualBarcodeEntries
          .filter((entry) => Boolean(entry && typeof entry === "object"))
          .map((entry) => {
            const barcode = typeof entry.barcode === "string" ? cleanBarcode(entry.barcode) : "";
            const name = typeof entry.name === "string" ? entry.name.trim() : "";
            const normalizedName =
              typeof entry.normalizedName === "string"
                ? entry.normalizedName.trim().toLowerCase()
                : name.toLowerCase().trim();

            return {
              id: typeof entry.id === "string" ? entry.id : uid(),
              barcode,
              name: name || "Saved UPC item",
              normalizedName,
              brand: typeof entry.brand === "string" ? entry.brand : undefined,
              category: typeof entry.category === "string" ? entry.category : undefined,
              suggestedUnit:
                entry.suggestedUnit === "lb" ||
                entry.suggestedUnit === "oz" ||
                entry.suggestedUnit === "g" ||
                entry.suggestedUnit === "kg" ||
                entry.suggestedUnit === "piece" ||
                entry.suggestedUnit === "dozen" ||
                entry.suggestedUnit === "cup" ||
                entry.suggestedUnit === "bag" ||
                entry.suggestedUnit === "tub" ||
                entry.suggestedUnit === "head" ||
                entry.suggestedUnit === "pack" ||
                entry.suggestedUnit === "serving"
                  ? entry.suggestedUnit
                  : "piece",
              matchedProductId: typeof entry.matchedProductId === "string" ? entry.matchedProductId : undefined,
              createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
              updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString(),
              lastUsedAt: typeof entry.lastUsedAt === "string" ? entry.lastUsedAt : undefined,
            } satisfies ManualBarcodeEntry;
          })
          .filter((entry) => Boolean(entry.barcode))
      : [],
    workoutLog: Array.isArray(stored.workoutLog)
      ? stored.workoutLog
          .filter((entry) => Boolean(entry && typeof entry === "object"))
          .map((entry) => {
            const loggedAt = typeof entry.loggedAt === "string" ? entry.loggedAt : new Date().toISOString();
            return {
              id: typeof entry.id === "string" ? entry.id : uid(),
              exercise: typeof entry.exercise === "string" ? entry.exercise : "Workout",
              workoutDay: typeof entry.workoutDay === "string" ? entry.workoutDay : weekdayFromIso(loggedAt),
              loggedDate: typeof entry.loggedDate === "string" ? entry.loggedDate : dateFromIso(loggedAt),
              loggedTime: typeof entry.loggedTime === "string" ? entry.loggedTime : timeFromIso(loggedAt),
              sets: typeof entry.sets === "number" ? entry.sets : Number(entry.sets) || 1,
              weight: typeof entry.weight === "number" ? entry.weight : Number(entry.weight) || 0,
              reps: typeof entry.reps === "number" ? entry.reps : Number(entry.reps) || 0,
              loggedAt,
            };
          })
      : [],
    workoutPlans: Array.isArray(stored.workoutPlans)
      ? stored.workoutPlans
          .filter((entry) => Boolean(entry && typeof entry === "object"))
          .map((entry) => ({
            id: typeof entry.id === "string" ? entry.id : uid(),
            title: typeof entry.title === "string" ? entry.title : "Workout",
            focus: typeof entry.focus === "string" ? entry.focus : "Planned session",
            workoutDay: typeof entry.workoutDay === "string" ? entry.workoutDay : "Unassigned",
            plannedDate: typeof entry.plannedDate === "string" ? entry.plannedDate : new Date().toISOString().slice(0, 10),
            plannedTime: typeof entry.plannedTime === "string" ? entry.plannedTime : "18:00",
            createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
          }))
      : [],
    cardioLog: Array.isArray(stored.cardioLog)
      ? stored.cardioLog
          .filter((entry) => Boolean(entry && typeof entry === "object"))
          .map((entry) => {
            const loggedAt = typeof entry.loggedAt === "string" ? entry.loggedAt : new Date().toISOString();
            return {
              id: typeof entry.id === "string" ? entry.id : uid(),
              exerciseId: typeof entry.exerciseId === "string" ? entry.exerciseId : "cardio",
              exerciseName: typeof entry.exerciseName === "string" ? entry.exerciseName : "Cardio",
              workoutDay: typeof entry.workoutDay === "string" ? entry.workoutDay : weekdayFromIso(loggedAt),
              loggedDate: typeof entry.loggedDate === "string" ? entry.loggedDate : dateFromIso(loggedAt),
              loggedTime: typeof entry.loggedTime === "string" ? entry.loggedTime : timeFromIso(loggedAt),
              durationMinutes: typeof entry.durationMinutes === "number" ? entry.durationMinutes : Number(entry.durationMinutes) || undefined,
              steps: typeof entry.steps === "number" ? entry.steps : Number(entry.steps) || undefined,
              miles: typeof entry.miles === "number" ? entry.miles : Number(entry.miles) || undefined,
              pace: typeof entry.pace === "string" ? entry.pace : undefined,
              estimatedCaloriesBurned:
                typeof entry.estimatedCaloriesBurned === "number"
                  ? entry.estimatedCaloriesBurned
                  : Number(entry.estimatedCaloriesBurned) || undefined,
              loggedAt,
            };
          })
      : [],
    favoriteExerciseIds: Array.isArray(stored.favoriteExerciseIds)
      ? stored.favoriteExerciseIds.filter((value): value is string => typeof value === "string")
      : [],
    recentExerciseIds: Array.isArray(stored.recentExerciseIds)
      ? stored.recentExerciseIds.filter((value): value is string => typeof value === "string")
      : [],
    recentExerciseSearches: Array.isArray(stored.recentExerciseSearches)
      ? stored.recentExerciseSearches.filter((value): value is string => typeof value === "string")
      : [],
    usageDates: Array.isArray(stored.usageDates)
      ? stored.usageDates.filter((value): value is string => typeof value === "string")
      : [],
  };
}
