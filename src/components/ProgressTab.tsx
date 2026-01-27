import { motion } from 'framer-motion';
import { TrendingUp, Flame, Target, Award, CalendarX } from 'lucide-react';
import { useNutritionStore } from '@/hooks/useNutritionStore';

export const ProgressTab = () => {
  const { computeStats } = useNutritionStore();
  const stats = computeStats();
  
  const maxHeight = stats.weeklyData.length > 0 
    ? Math.max(...stats.weeklyData.map(d => d.calories), 1)
    : 1;

  // Empty state
  if (!stats.hasAnyLogs) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="px-4 pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
            <p className="text-muted-foreground text-sm">Track your nutrition journey</p>
          </motion.div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 flex flex-col items-center justify-center py-16 text-center"
        >
          <CalendarX className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No progress yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Log foods to see progress. Your daily totals will appear here as you track your meals.
          </p>
        </motion.div>
      </div>
    );
  }

  const statsCards = [
    { 
      icon: Flame, 
      label: 'Streak', 
      value: stats.streak === 1 ? '1 day' : `${stats.streak} days`, 
      color: 'text-nutrition-carbs' 
    },
    { 
      icon: Target, 
      label: 'Avg. Calories', 
      value: stats.avgCalories.toLocaleString(), 
      color: 'text-primary' 
    },
    { 
      icon: TrendingUp, 
      label: 'On Track', 
      value: stats.onTrackTotal > 0 ? `${stats.onTrackDays}/${stats.onTrackTotal} days` : '0 days', 
      color: 'text-nutrition-protein' 
    },
    { 
      icon: Award, 
      label: 'Best Week', 
      value: stats.bestWeekLabel, 
      color: 'text-nutrition-fat' 
    },
  ];

  // Message based on performance
  const getMotivationMessage = () => {
    if (stats.onTrackTotal === 0) {
      return "Start tracking to see how you're doing this week!";
    }
    const percentage = stats.onTrackDays / stats.onTrackTotal;
    if (percentage >= 0.8) {
      return `Great job! You've stayed under your calorie goal for ${stats.onTrackDays} out of ${stats.onTrackTotal} days this week. Keep up the momentum! 💪`;
    } else if (percentage >= 0.5) {
      return `Good progress! You're on track ${stats.onTrackDays} out of ${stats.onTrackTotal} days. Keep pushing! 🎯`;
    } else {
      return `You've been on track ${stats.onTrackDays} out of ${stats.onTrackTotal} days. Every day is a new opportunity! 🌟`;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          <p className="text-muted-foreground text-sm">Track your nutrition journey</p>
        </motion.div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-lg p-4 border border-border shadow-sm"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Chart */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4"
      >
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">This Week</h2>
          
          <div className="flex items-end justify-between gap-2 h-40">
            {stats.weeklyData.map((day, index) => {
              const height = day.hasData ? (day.calories / maxHeight) * 100 : 5;
              const isUnderGoal = day.calories <= day.goal;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                    className={`w-full rounded-t-md ${
                      !day.hasData 
                        ? 'bg-muted' 
                        : isUnderGoal 
                          ? 'bg-primary' 
                          : 'bg-nutrition-carbs'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">{day.dayLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-xs text-muted-foreground">Under goal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-nutrition-carbs" />
              <span className="text-xs text-muted-foreground">Over goal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-xs text-muted-foreground">No data</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Motivation message */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-4"
      >
        <div className="bg-accent rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            <strong>{stats.streak > 0 ? 'Keep it up!' : 'Get started!'}</strong> {getMotivationMessage()}
          </p>
        </div>
      </motion.section>
    </div>
  );
};
