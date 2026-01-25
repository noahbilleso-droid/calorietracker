import { useState, useCallback } from 'react';
import { FoodEntry, MealType, DailyProgress, UserProfile } from '@/types/nutrition';

const defaultProfile: UserProfile = {
  name: 'User',
  dailyCalorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
};

const sampleFoods: FoodEntry[] = [
  {
    id: '1',
    name: 'Oatmeal with Berries',
    calories: 320,
    protein: 12,
    carbs: 54,
    fat: 6,
    servingSize: '1 bowl',
    mealType: 'breakfast',
    timestamp: new Date(),
  },
  {
    id: '2',
    name: 'Greek Yogurt',
    calories: 150,
    protein: 15,
    carbs: 12,
    fat: 5,
    servingSize: '1 cup',
    mealType: 'breakfast',
    timestamp: new Date(),
  },
  {
    id: '3',
    name: 'Grilled Chicken Salad',
    calories: 450,
    protein: 42,
    carbs: 18,
    fat: 22,
    servingSize: '1 plate',
    mealType: 'lunch',
    timestamp: new Date(),
  },
  {
    id: '4',
    name: 'Salmon with Vegetables',
    calories: 520,
    protein: 45,
    carbs: 22,
    fat: 28,
    servingSize: '1 portion',
    mealType: 'dinner',
    timestamp: new Date(),
  },
  {
    id: '5',
    name: 'Mixed Nuts',
    calories: 180,
    protein: 6,
    carbs: 8,
    fat: 16,
    servingSize: '1 handful',
    mealType: 'snacks',
    timestamp: new Date(),
  },
];

export const useNutritionStore = () => {
  const [entries, setEntries] = useState<FoodEntry[]>(sampleFoods);
  const [profile] = useState<UserProfile>(defaultProfile);

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
  };
};
