import { useState, useCallback, useEffect, useRef } from 'react';
import { FoodEntry, MealType, DailyProgress, UserProfile, DayLog } from '@/types/nutrition';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Get today's date in Denmark timezone as YYYY-MM-DD
export const getDenmarkDateString = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).format(date);
};

const defaultProfile: UserProfile = {
  name: 'User',
  dailyCalorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
};

export interface ProgressStats {
  streak: number;
  avgCalories: number;
  onTrackDays: number;
  onTrackTotal: number;
  bestWeekLabel: string;
  weeklyData: Array<{
    day: string;
    dayLabel: string;
    calories: number;
    goal: number;
    hasData: boolean;
  }>;
  hasAnyLogs: boolean;
}

export const useNutritionStore = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const isUpdatingLog = useRef(false);

  // Fetch today's entries and all day logs when user changes
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setDayLogs([]);
      setProfile(defaultProfile);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const todayDenmark = getDenmarkDateString();

      // Fetch today's entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_date', todayDenmark)
        .order('created_at', { ascending: true });

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
      } else {
        setEntries(
          (entriesData || []).map((e) => ({
            id: e.id,
            name: e.name,
            calories: Number(e.calories),
            protein: Number(e.protein),
            carbs: Number(e.carbs),
            fat: Number(e.fat),
            servingSize: '1 serving',
            mealType: e.meal_type as MealType,
            timestamp: new Date(e.created_at),
          }))
        );
      }

      // Fetch all day logs
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('day_date', { ascending: false });

      if (logsError) {
        console.error('Error fetching day logs:', logsError);
      } else {
        setDayLogs(
          (logsData || []).map((l) => ({
            date: l.day_date,
            calories: Number(l.calories),
            protein: Number(l.protein),
            carbs: Number(l.carbs),
            fat: Number(l.fat),
            goalCalories: Number(l.goal_calories),
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Upsert today's daily log when entries change
  useEffect(() => {
    if (!user || loading || isUpdatingLog.current) return;

    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const todayDenmark = getDenmarkDateString();

    const upsertLog = async () => {
      isUpdatingLog.current = true;

      const { error } = await supabase
        .from('daily_logs')
        .upsert(
          {
            user_id: user.id,
            day_date: todayDenmark,
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
            goal_calories: profile.dailyCalorieGoal,
          },
          { onConflict: 'user_id,day_date' }
        );

      if (error) {
        console.error('Error upserting daily log:', error);
      } else {
        // Update local day logs state
        setDayLogs((prev) => {
          const existing = prev.find((l) => l.date === todayDenmark);
          const newLog: DayLog = {
            date: todayDenmark,
            ...totals,
            goalCalories: profile.dailyCalorieGoal,
          };
          if (existing) {
            return prev.map((l) => (l.date === todayDenmark ? newLog : l));
          }
          return [newLog, ...prev];
        });
      }

      isUpdatingLog.current = false;
    };

    upsertLog();
  }, [entries, profile.dailyCalorieGoal, user, loading]);

  const addEntry = useCallback(
    async (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
      if (!user) return;

      const todayDenmark = getDenmarkDateString();

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          meal_type: entry.mealType,
          name: entry.name,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          day_date: todayDenmark,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding entry:', error);
        return;
      }

      const newEntry: FoodEntry = {
        id: data.id,
        name: data.name,
        calories: Number(data.calories),
        protein: Number(data.protein),
        carbs: Number(data.carbs),
        fat: Number(data.fat),
        servingSize: entry.servingSize,
        mealType: data.meal_type as MealType,
        timestamp: new Date(data.created_at),
      };

      setEntries((prev) => [...prev, newEntry]);
    },
    [user]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing entry:', error);
        return;
      }

      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [user]
  );

  const getEntriesByMeal = useCallback(
    (mealType: MealType): FoodEntry[] => {
      return entries.filter((e) => e.mealType === mealType);
    },
    [entries]
  );

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

  const checkDailyReset = useCallback(() => {
    // No-op for Supabase - data is already filtered by day_date
  }, []);

  const clearHistory = useCallback(async () => {
    if (!user) return;

    // Delete all food entries
    const { error: entriesError } = await supabase
      .from('food_entries')
      .delete()
      .eq('user_id', user.id);

    if (entriesError) {
      console.error('Error clearing food entries:', entriesError);
    }

    // Delete all day logs
    const { error: logsError } = await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', user.id);

    if (logsError) {
      console.error('Error clearing day logs:', logsError);
    }

    setEntries([]);
    setDayLogs([]);
  }, [user]);

  const computeStats = useCallback((): ProgressStats => {
    const today = getDenmarkDateString();
    const hasAnyLogs = dayLogs.length > 0;

    // 1. Calculate streak
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = getDenmarkDateString(checkDate);
      const log = dayLogs.find((l) => l.date === dateStr);

      if (log && log.calories > 0 && log.calories <= log.goalCalories) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 2. Get last 7 days
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(getDenmarkDateString(d));
    }

    // 3. Average calories over last 7 days
    const last7DaysLogs = dayLogs.filter(
      (log) => last7Days.includes(log.date) && log.calories > 0
    );

    const avgCalories =
      last7DaysLogs.length > 0
        ? Math.round(
            last7DaysLogs.reduce((sum, log) => sum + log.calories, 0) /
              last7DaysLogs.length
          )
        : 0;

    // 4. On Track days
    const onTrackDays = last7DaysLogs.filter(
      (log) => log.calories <= log.goalCalories
    ).length;
    const onTrackTotal = last7DaysLogs.length;

    // 5. Best Week
    let bestWeekOnTrack = 0;

    if (dayLogs.length > 0) {
      const allDates = [...new Set(dayLogs.map((l) => l.date))].sort();

      if (allDates.length > 0) {
        const oldestDate = new Date(allDates[0] + 'T12:00:00');
        const newestDate = new Date(allDates[allDates.length - 1] + 'T12:00:00');

        let windowEnd = new Date(newestDate);

        while (windowEnd >= oldestDate) {
          const windowDates: string[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(windowEnd);
            d.setDate(windowEnd.getDate() - i);
            windowDates.push(getDenmarkDateString(d));
          }

          const windowOnTrack = dayLogs.filter(
            (log) =>
              windowDates.includes(log.date) &&
              log.calories > 0 &&
              log.calories <= log.goalCalories
          ).length;

          if (windowOnTrack > bestWeekOnTrack) {
            bestWeekOnTrack = windowOnTrack;
          }

          windowEnd.setDate(windowEnd.getDate() - 1);
        }
      }
    }

    const bestWeekLabel =
      bestWeekOnTrack > 0 ? `${bestWeekOnTrack} days` : 'No data yet';

    // 6. Weekly chart data
    const weeklyData = last7Days.reverse().map((dateStr) => {
      const log = dayLogs.find((l) => l.date === dateStr);
      const date = new Date(dateStr + 'T12:00:00');
      const dayLabel = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone: 'Europe/Copenhagen',
      }).format(date);

      return {
        day: dateStr,
        dayLabel,
        calories: log?.calories || 0,
        goal: log?.goalCalories || 2000,
        hasData: log ? log.calories > 0 : false,
      };
    });

    return {
      streak,
      avgCalories,
      onTrackDays,
      onTrackTotal,
      bestWeekLabel,
      weeklyData,
      hasAnyLogs,
    };
  }, [dayLogs]);

  return {
    entries,
    profile,
    addEntry,
    removeEntry,
    getEntriesByMeal,
    getDailyProgress,
    checkDailyReset,
    clearHistory,
    computeStats,
    dayLogs,
    loading,
  };
};
