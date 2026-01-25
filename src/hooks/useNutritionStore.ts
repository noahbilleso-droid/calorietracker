import { useState, useCallback, useEffect } from 'react';
import { FoodEntry, MealType, DailyProgress, UserProfile } from '@/types/nutrition';

const STORAGE_KEYS = {
  entries: 'nutritrack_entries',
  profile: 'nutritrack_profile',
  lastResetDate: 'nutritrack_last_reset_date',
};

const defaultProfile: UserProfile = {
  name: 'User',
  dailyCalorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
};

// Get today's date in Denmark timezone as YYYY-MM-DD
const getDenmarkDateString = (): string => {
  const now = new Date();
  const denmarkDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).format(now);
  return denmarkDate;
};

// Load data from localStorage with daily reset check
const loadStoredData = (): { entries: FoodEntry[]; profile: UserProfile } => {
  const todayDenmark = getDenmarkDateString();
  const storedLastReset = localStorage.getItem(STORAGE_KEYS.lastResetDate);
  
  // Load profile (always persisted)
  let profile = defaultProfile;
  const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
  if (storedProfile) {
    try {
      profile = JSON.parse(storedProfile);
    } catch {
      profile = defaultProfile;
    }
  }
  
  // Check if we need to reset (new day in Denmark)
  if (storedLastReset !== todayDenmark) {
    // Reset entries for new day
    localStorage.setItem(STORAGE_KEYS.lastResetDate, todayDenmark);
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
    return { entries: [], profile };
  }
  
  // Load entries for same day
  let entries: FoodEntry[] = [];
  const storedEntries = localStorage.getItem(STORAGE_KEYS.entries);
  if (storedEntries) {
    try {
      entries = JSON.parse(storedEntries).map((e: FoodEntry) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
    } catch {
      entries = [];
    }
  }
  
  return { entries, profile };
};

export const useNutritionStore = () => {
  const [entries, setEntries] = useState<FoodEntry[]>(() => loadStoredData().entries);
  const [profile, setProfile] = useState<UserProfile>(() => loadStoredData().profile);

  // Check for daily reset on mount and when returning to dashboard
  const checkDailyReset = useCallback(() => {
    const todayDenmark = getDenmarkDateString();
    const storedLastReset = localStorage.getItem(STORAGE_KEYS.lastResetDate);
    
    if (storedLastReset !== todayDenmark) {
      localStorage.setItem(STORAGE_KEYS.lastResetDate, todayDenmark);
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
      setEntries([]);
    }
  }, []);

  // Persist entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
  }, [entries]);

  // Persist profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  const addEntry = useCallback((entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    const newEntry: FoodEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setEntries(prev => [...prev, newEntry]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const getEntriesByMeal = useCallback((mealType: MealType): FoodEntry[] => {
    return entries.filter(e => e.mealType === mealType);
  }, [entries]);

  const getDailyProgress = useCallback((): DailyProgress => {
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  return {
    entries,
    profile,
    addEntry,
    removeEntry,
    getEntriesByMeal,
    getDailyProgress,
    checkDailyReset,
  };
};
