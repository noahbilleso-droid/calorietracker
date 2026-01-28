import { useCallback, useEffect, useMemo, useState } from "react";
import type { FoodEntry, MealType, DailyProgress, UserProfile } from "@/types/nutrition";

/**
 * Denmark date key (YYYY-MM-DD) using Europe/Copenhagen time.
 */
function getDenmarkDateString(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${day}`;
}

type DayTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalCalories: number;
};

const STORAGE_KEYS = {
  entries: "nutritrack_entries_v2",
  profile: "nutritrack_profile_v2",
  lastReset: "nutritrack_last_reset_date_v2",
  dailyHistory: "nutritrack_daily_history_v2",
};

const defaultProfile: UserProfile = {
  name: "User",
  dailyCalorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
};

/**
 * Loads persisted data and also performs "daily reset" check (DK time).
 * - If it's a new DK day: entries reset to []
 * - Profile stays
 * - dailyHistory stays
 */
function loadStored() {
  const todayDK = getDenmarkDateString();
  const storedLastReset = localStorage.getItem(STORAGE_KEYS.lastReset);

  // Load profile
  let profile = defaultProfile;
  const rawProfile = localStorage.getItem(STORAGE_KEYS.profile);
  if (rawProfile) {
    try {
      profile = JSON.parse(rawProfile);
    } catch {
      profile = defaultProfile;
    }
  }

  // Load daily history
  let dailyHistory: Record<string, DayTotals> = {};
  const rawHistory = localStorage.getItem(STORAGE_KEYS.dailyHistory);
  if (rawHistory) {
    try {
      dailyHistory = JSON.parse(rawHistory) || {};
    } catch {
      dailyHistory = {};
    }
  }

  // New day? reset entries
  if (storedLastReset !== todayDK) {
    localStorage.setItem(STORAGE_KEYS.lastReset, todayDK);
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
    return { entries: [] as FoodEntry[], profile, dailyHistory };
  }

  // Same day -> load entries
  let entries: FoodEntry[] = [];
  const rawEntries = localStorage.getItem(STORAGE_KEYS.entries);
  if (rawEntries) {
    try {
      entries = JSON.parse(rawEntries).map((e: any) => ({
        ...e,
        timestamp: e?.timestamp ? new Date(e.timestamp) : new Date(),
      }));
    } catch {
      entries = [];
    }
  }

  return { entries, profile, dailyHistory };
}

export function useNutritionStore() {
  const initial = useMemo(() => loadStored(), []);
  const [entries, setEntries] = useState<FoodEntry[]>(initial.entries);
  const [profile, setProfile] = useState<UserProfile>(initial.profile);
  const [dailyHistory, setDailyHistory] = useState<Record<string, DayTotals>>(initial.dailyHistory);

  /**
   * Call this on screens like Home (Dashboard) so it resets if a new DK day started
   * while the app was open/sleeping.
   */
  const checkDailyReset = useCallback(() => {
    const todayDK = getDenmarkDateString();
    const storedLastReset = localStorage.getItem(STORAGE_KEYS.lastReset);

    if (storedLastReset !== todayDK) {
      localStorage.setItem(STORAGE_KEYS.lastReset, todayDK);
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
      setEntries([]);
    }
  }, []);

  // Run daily reset check when hook mounts
  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  // Persist entries/profile/history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dailyHistory, JSON.stringify(dailyHistory));
  }, [dailyHistory]);

  // Totals for "today"
  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.calories += e.calories || 0;
        acc.protein += e.protein || 0;
        acc.carbs += e.carbs || 0;
        acc.fat += e.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  /**
   * Save today's totals into dailyHistory (used by Progress tab).
   * This is what makes “progress tracking” real.
   */
  const saveToday = useCallback(() => {
    const todayDK = getDenmarkDateString();
    setDailyHistory((prev) => ({
      ...prev,
      [todayDK]: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
        goalCalories: profile.dailyCalorieGoal,
      },
    }));
  }, [totals, profile.dailyCalorieGoal]);

  // Optional: auto-save progress when totals change
  useEffect(() => {
    saveToday();
  }, [saveToday]);

  const addEntry = useCallback(
    (entry: Omit<FoodEntry, "id" | "timestamp">) => {
      const newEntry: FoodEntry = {
        ...entry,
        id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };
      setEntries((prev) => [...prev, newEntry]);
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getEntriesByMeal = useCallback(
    (mealType: MealType) => entries.filter((e) => e.mealType === mealType),
    [entries]
  );

  const getDailyProgress = useCallback((): DailyProgress => {
    return {
      caloriesEaten: Math.round(totals.calories),
      calorieGoal: profile.dailyCalorieGoal,
      caloriesRemaining: Math.max(0, Math.round(profile.dailyCalorieGoal - totals.calories)),
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      proteinGoal: profile.proteinGoal,
      carbsGoal: profile.carbsGoal,
      fatGoal: profile.fatGoal,
    };
  }, [totals, profile]);

  const clearToday = useCallback(() => {
    setEntries([]);
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
    const todayDK = getDenmarkDateString();
    localStorage.setItem(STORAGE_KEYS.lastReset, todayDK);
  }, []);

  const clearAllHistory = useCallback(() => {
    setEntries([]);
    setDailyHistory({});
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.dailyHistory, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.lastReset, getDenmarkDateString());
  }, []);

  /**
   * Helper for Progress tab: returns last N DK days (including today) newest->oldest
   */
  const getLastNDays = useCallback(
    (n: number) => {
      const out: Array<{ dateKey: string; totals: DayTotals | null }> = [];
      const now = new Date();

      for (let i = 0; i < n; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = getDenmarkDateString(d);
        out.push({ dateKey: key, totals: dailyHistory[key] ?? null });
      }
      return out;
    },
    [dailyHistory]
  );

  return {
    // state
    entries,
    profile,
    dailyHistory,

    // computed
    totals,
    getDailyProgress,

    // actions
    setProfile,
    addEntry,
    removeEntry,
    getEntriesByMeal,
    checkDailyReset,
    saveToday,
    clearToday,
    clearAllHistory,

    // progress helpers
    getLastNDays,
  };
}
