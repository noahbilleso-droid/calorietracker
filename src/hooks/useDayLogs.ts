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
    
    // Check if there are any logs at all
    const hasAnyLogs = dayLogs.length > 0;

    // 1. Calculate streak: consecutive days (including today) where calories > 0 AND calories <= goalCalories
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = getDenmarkDateString(checkDate);
      const log = dayLogs.find(l => l.date === dateStr);
      
      // Streak requires: has data, calories > 0, AND under/at goal
      if (log && log.calories > 0 && log.calories <= log.goalCalories) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 2. Get last 7 days date strings
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(getDenmarkDateString(d));
    }

    // 3. Average calories over last 7 days that have data (calories > 0)
    const last7DaysLogs = dayLogs.filter(log => 
      last7Days.includes(log.date) && log.calories > 0
    );
    
    const avgCalories = last7DaysLogs.length > 0
      ? Math.round(last7DaysLogs.reduce((sum, log) => sum + log.calories, 0) / last7DaysLogs.length)
      : 0;

    // 4. On Track: X/Y days under goal in last 7 days (only count days with calories > 0)
    const onTrackDays = last7DaysLogs.filter(log => log.calories <= log.goalCalories).length;
    const onTrackTotal = last7DaysLogs.length;

    // 5. Best Week: max "on track" days in any rolling 7-day window in history
    let bestWeekOnTrack = 0;
    
    if (dayLogs.length > 0) {
      // Get all unique dates sorted
      const allDates = [...new Set(dayLogs.map(l => l.date))].sort();
      
      if (allDates.length > 0) {
        // For each possible 7-day window ending on each date
        const oldestDate = new Date(allDates[0] + 'T12:00:00');
        const newestDate = new Date(allDates[allDates.length - 1] + 'T12:00:00');
        
        let windowEnd = new Date(newestDate);
        
        while (windowEnd >= oldestDate) {
          // Get 7 days ending on windowEnd
          const windowDates: string[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(windowEnd);
            d.setDate(windowEnd.getDate() - i);
            windowDates.push(getDenmarkDateString(d));
          }
          
          // Count on-track days in this window
          const windowOnTrack = dayLogs.filter(log => 
            windowDates.includes(log.date) && 
            log.calories > 0 && 
            log.calories <= log.goalCalories
          ).length;
          
          if (windowOnTrack > bestWeekOnTrack) {
            bestWeekOnTrack = windowOnTrack;
          }
          
          // Move window back by 1 day
          windowEnd.setDate(windowEnd.getDate() - 1);
        }
      }
    }

    const bestWeekLabel = bestWeekOnTrack > 0 ? `${bestWeekOnTrack} days` : 'No data yet';

    // 6. Weekly chart data: last 7 days (today back to 6 days ago)
    const weeklyData = last7Days.reverse().map((dateStr) => {
      const log = dayLogs.find(l => l.date === dateStr);
      const date = new Date(dateStr + 'T12:00:00');
      const dayLabel = new Intl.DateTimeFormat('en-US', { 
        weekday: 'short',
        timeZone: 'Europe/Copenhagen'
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
    dayLogs,
    upsertTodayLog,
    clearHistory,
    computeStats,
  };
};
