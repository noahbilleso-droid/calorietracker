import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getDenmarkDateString } from './useNutritionStore';

export interface WaterEntry {
  id: string;
  amountMl: number;
  createdAt: string;
  dayDate: string;
}

export interface WaterStats {
  weeklyData: Array<{
    day: string;
    dayLabel: string;
    intake: number;
    goal: number;
    hasData: boolean;
  }>;
  avgIntake: number;
  onTrackDays: number;
  onTrackTotal: number;
}

const DEFAULT_GOAL_ML = 2000;

export const useWaterStore = () => {
  const { user } = useAuth();
  const [todayEntries, setTodayEntries] = useState<WaterEntry[]>([]);
  const [allEntries, setAllEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const todayTotal = useMemo(
    () => (Array.isArray(todayEntries) ? todayEntries.reduce((sum, e) => sum + e.amountMl, 0) : 0),
    [todayEntries]
  );
  const goalMl = DEFAULT_GOAL_ML;

  // Fetch water entries
  useEffect(() => {
    if (!user) {
      setTodayEntries([]);
      setAllEntries([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const todayDenmark = getDenmarkDateString();

      const { data, error } = await supabase
        .from('water_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching water entries:', error);
      } else {
        const entries: WaterEntry[] = (data || []).map((e) => ({
          id: e.id,
          amountMl: e.amount_ml,
          createdAt: e.created_at,
          dayDate: e.day_date,
        }));
        
        setAllEntries(entries);
        setTodayEntries(entries.filter((e) => e.dayDate === todayDenmark));
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addWater = useCallback(
    async (amountMl: number) => {
      if (!user) return;

      const todayDenmark = getDenmarkDateString();

      const { data, error } = await supabase
        .from('water_entries')
        .insert({
          user_id: user.id,
          day_date: todayDenmark,
          amount_ml: amountMl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding water:', error);
        return;
      }

      const newEntry: WaterEntry = {
        id: data.id,
        amountMl: data.amount_ml,
        createdAt: data.created_at,
        dayDate: data.day_date,
      };

      setTodayEntries((prev) => [newEntry, ...prev]);
      setAllEntries((prev) => [newEntry, ...prev]);
    },
    [user]
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('water_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing water entry:', error);
        return;
      }

      setTodayEntries((prev) => prev.filter((e) => e.id !== entryId));
      setAllEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    [user]
  );

  const undoLast = useCallback(async () => {
    if (!user || todayEntries.length === 0) return;

    // Today entries are sorted by created_at desc, so first is newest
    const newestEntry = todayEntries[0];
    await removeEntry(newestEntry.id);
  }, [user, todayEntries, removeEntry]);

  const computeWaterStats = useCallback((): WaterStats => {
    // Get last 7 days
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(getDenmarkDateString(d));
    }

    // Aggregate entries by day
    const dailyTotals = new Map<string, number>();
    for (const entry of allEntries) {
      if (last7Days.includes(entry.dayDate)) {
        const current = dailyTotals.get(entry.dayDate) || 0;
        dailyTotals.set(entry.dayDate, current + entry.amountMl);
      }
    }

    // Days with data
    const daysWithData = Array.from(dailyTotals.entries()).filter(
      ([, total]) => total > 0
    );

    // Average intake
    const avgIntake =
      daysWithData.length > 0
        ? Math.round(
            daysWithData.reduce((sum, [, total]) => sum + total, 0) /
              daysWithData.length
          )
        : 0;

    // On track days (met goal)
    const onTrackDays = daysWithData.filter(
      ([, total]) => total >= DEFAULT_GOAL_ML
    ).length;
    const onTrackTotal = daysWithData.length;

    // Weekly chart data
    const weeklyData = last7Days.reverse().map((dateStr) => {
      const intake = dailyTotals.get(dateStr) || 0;
      const date = new Date(dateStr + 'T12:00:00');
      const dayLabel = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone: 'Europe/Copenhagen',
      }).format(date);

      return {
        day: dateStr,
        dayLabel,
        intake,
        goal: DEFAULT_GOAL_ML,
        hasData: intake > 0,
      };
    });

    return {
      weeklyData,
      avgIntake,
      onTrackDays,
      onTrackTotal,
    };
  }, [allEntries]);

  return {
    todayEntries,
    allEntries,
    todayTotal,
    goalMl,
    loading,
    addWater,
    removeEntry,
    undoLast,
    computeWaterStats,
  };
};
