import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getDenmarkDateString } from './useNutritionStore';

export interface WaterLog {
  date: string;
  intakeMl: number;
  goalMl: number;
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
  const [todayLog, setTodayLog] = useState<WaterLog | null>(null);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch today's water log and history
  useEffect(() => {
    if (!user) {
      setTodayLog(null);
      setWaterLogs([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const todayDenmark = getDenmarkDateString();

      // Fetch all water logs
      const { data: logsData, error: logsError } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('day_date', { ascending: false });

      if (logsError) {
        console.error('Error fetching water logs:', logsError);
      } else {
        const logs: WaterLog[] = (logsData || []).map((l) => ({
          date: l.day_date,
          intakeMl: Number(l.intake_ml),
          goalMl: Number(l.goal_ml),
        }));
        setWaterLogs(logs);

        const today = logs.find((l) => l.date === todayDenmark);
        setTodayLog(today || { date: todayDenmark, intakeMl: 0, goalMl: DEFAULT_GOAL_ML });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addWater = useCallback(
    async (amountMl: number) => {
      if (!user) return;

      const todayDenmark = getDenmarkDateString();
      const currentIntake = todayLog?.intakeMl || 0;
      const newIntake = currentIntake + amountMl;
      const goalMl = todayLog?.goalMl || DEFAULT_GOAL_ML;

      const { error } = await supabase
        .from('water_logs')
        .upsert(
          {
            user_id: user.id,
            day_date: todayDenmark,
            intake_ml: newIntake,
            goal_ml: goalMl,
          },
          { onConflict: 'user_id,day_date' }
        );

      if (error) {
        console.error('Error adding water:', error);
        return;
      }

      const newLog: WaterLog = {
        date: todayDenmark,
        intakeMl: newIntake,
        goalMl,
      };

      setTodayLog(newLog);
      setWaterLogs((prev) => {
        const existing = prev.find((l) => l.date === todayDenmark);
        if (existing) {
          return prev.map((l) => (l.date === todayDenmark ? newLog : l));
        }
        return [newLog, ...prev];
      });
    },
    [user, todayLog]
  );

  const computeWaterStats = useCallback((): WaterStats => {
    // Get last 7 days
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(getDenmarkDateString(d));
    }

    // Filter logs for last 7 days
    const last7DaysLogs = waterLogs.filter(
      (log) => last7Days.includes(log.date) && log.intakeMl > 0
    );

    // Average intake
    const avgIntake =
      last7DaysLogs.length > 0
        ? Math.round(
            last7DaysLogs.reduce((sum, log) => sum + log.intakeMl, 0) /
              last7DaysLogs.length
          )
        : 0;

    // On track days (met goal)
    const onTrackDays = last7DaysLogs.filter(
      (log) => log.intakeMl >= log.goalMl
    ).length;
    const onTrackTotal = last7DaysLogs.length;

    // Weekly chart data
    const weeklyData = last7Days.reverse().map((dateStr) => {
      const log = waterLogs.find((l) => l.date === dateStr);
      const date = new Date(dateStr + 'T12:00:00');
      const dayLabel = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone: 'Europe/Copenhagen',
      }).format(date);

      return {
        day: dateStr,
        dayLabel,
        intake: log?.intakeMl || 0,
        goal: log?.goalMl || DEFAULT_GOAL_ML,
        hasData: log ? log.intakeMl > 0 : false,
      };
    });

    return {
      weeklyData,
      avgIntake,
      onTrackDays,
      onTrackTotal,
    };
  }, [waterLogs]);

  return {
    todayLog,
    waterLogs,
    loading,
    addWater,
    computeWaterStats,
  };
};
