import { useState, useCallback, useEffect } from 'react';
import { DayLog } from '@/types/nutrition';

const STORAGE_KEY = 'nutritrack_day_logs_v1';

// Get today's date in Denmark timezone as YYYY-MM-DD
export const getDenmarkDateString = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Copenhagen',
  }).format(date);
};

// Get start of week (Monday) for a given date string
const getWeekStart = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust so Monday is start
  date.setDate(date.getDate() + diff);
  return getDenmarkDateString(date);
};

// Get all days of a week starting from Monday
const getWeekDays = (weekStart: string): string[] => {
  const days: string[] = [];
  const startDate = new Date(weekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(getDenmarkDateString(d));
  }
  return days;
};

// Load day logs from localStorage
const loadDayLogs = (): DayLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error('Failed to load day logs');
  }
  return [];
};

// Save day logs to localStorage
const saveDayLogs = (logs: DayLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    console.error('Failed to save day logs');
  }
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

export const useDayLogs = () => {
  const [dayLogs, setDayLogs] = useState<DayLog[]>(() => loadDayLogs());

  // Persist to localStorage whenever dayLogs change
  useEffect(() => {
    saveDayLogs(dayLogs);
  }, [dayLogs]);

  // Upsert today's log
  const upsertTodayLog = useCallback((data: Omit<DayLog, 'date'>) => {
    const today = getDenmarkDateString();
    setDayLogs(prev => {
      const existing = prev.find(log => log.date === today);
      if (existing) {
        return prev.map(log => 
          log.date === today ? { ...log, ...data } : log
        );
      }
      return [...prev, { date: today, ...data }];
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setDayLogs([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Compute progress stats
  const computeStats = useCallback((): ProgressStats => {
    const today = getDenmarkDateString();
    const sortedLogs = [...dayLogs].sort((a, b) => b.date.localeCompare(a.date));
    
    // Check if there are any logs at all
    const hasAnyLogs = dayLogs.length > 0;

    // 1. Calculate streak (consecutive days with any logged food)
    let streak = 0;
    let checkDate = new Date();
    
    // Check if today has any logged data
    const todayLog = dayLogs.find(log => log.date === today);
    const todayHasData = todayLog && (todayLog.calories > 0);
    
    if (todayHasData) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Check previous days
    while (true) {
      const dateStr = getDenmarkDateString(checkDate);
      const log = dayLogs.find(l => l.date === dateStr);
      if (log && log.calories > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 2. Average calories over last 7 days with logs
    const last7DaysLogs = sortedLogs
      .filter(log => log.calories > 0)
      .slice(0, 7);
    
    const avgCalories = last7DaysLogs.length > 0
      ? Math.round(last7DaysLogs.reduce((sum, log) => sum + log.calories, 0) / last7DaysLogs.length)
      : 0;

    // 3. On track days this week
    const thisWeekStart = getWeekStart(today);
    const thisWeekDays = getWeekDays(thisWeekStart);
    const thisWeekLogs = dayLogs.filter(log => thisWeekDays.includes(log.date) && log.calories > 0);
    const onTrackDays = thisWeekLogs.filter(log => log.calories <= log.goalCalories).length;
    const onTrackTotal = thisWeekLogs.length;

    // 4. Best week ever
    const logsByWeek = new Map<string, DayLog[]>();
    dayLogs.forEach(log => {
      const weekStart = getWeekStart(log.date);
      if (!logsByWeek.has(weekStart)) {
        logsByWeek.set(weekStart, []);
      }
      logsByWeek.get(weekStart)!.push(log);
    });

    let bestWeekStart = '';
    let bestWeekOnTrack = 0;
    
    logsByWeek.forEach((logs, weekStart) => {
      const onTrack = logs.filter(log => log.calories > 0 && log.calories <= log.goalCalories).length;
      if (onTrack > bestWeekOnTrack) {
        bestWeekOnTrack = onTrack;
        bestWeekStart = weekStart;
      }
    });

    // Format best week label
    let bestWeekLabel = 'No data yet';
    if (bestWeekStart) {
      if (bestWeekStart === thisWeekStart) {
        bestWeekLabel = 'This week!';
      } else {
        const date = new Date(bestWeekStart + 'T12:00:00');
        bestWeekLabel = new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric',
          timeZone: 'Europe/Copenhagen'
        }).format(date);
      }
    }

    // 5. Weekly chart data
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = thisWeekDays.map((dateStr, index) => {
      const log = dayLogs.find(l => l.date === dateStr);
      return {
        day: dateStr,
        dayLabel: dayLabels[index],
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
    dayLogs,
    upsertTodayLog,
    clearHistory,
    computeStats,
  };
};
