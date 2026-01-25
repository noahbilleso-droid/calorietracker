import { motion } from 'framer-motion';
import { TrendingUp, Flame, Target, Award } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', calories: 1850, goal: 2000 },
  { day: 'Tue', calories: 2100, goal: 2000 },
  { day: 'Wed', calories: 1920, goal: 2000 },
  { day: 'Thu', calories: 1780, goal: 2000 },
  { day: 'Fri', calories: 2200, goal: 2000 },
  { day: 'Sat', calories: 1650, goal: 2000 },
  { day: 'Sun', calories: 1620, goal: 2000 },
];

export const ProgressTab = () => {
  const avgCalories = Math.round(weeklyData.reduce((sum, d) => sum + d.calories, 0) / weeklyData.length);
  const maxHeight = Math.max(...weeklyData.map(d => d.calories));

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
        {[
          { icon: Flame, label: 'Streak', value: '7 days', color: 'text-nutrition-carbs' },
          { icon: Target, label: 'Avg. Calories', value: avgCalories.toString(), color: 'text-primary' },
          { icon: TrendingUp, label: 'On Track', value: '5/7 days', color: 'text-nutrition-protein' },
          { icon: Award, label: 'Best Week', value: 'This week!', color: 'text-nutrition-fat' },
        ].map((stat, index) => (
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
            {weeklyData.map((day, index) => {
              const height = (day.calories / maxHeight) * 100;
              const isUnderGoal = day.calories <= day.goal;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                    className={`w-full rounded-t-md ${
                      isUnderGoal ? 'bg-primary' : 'bg-nutrition-carbs'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
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
          </div>
        </div>
      </motion.section>

      {/* Goal line indicator */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-4"
      >
        <div className="bg-accent rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            <strong>Great job!</strong> You've stayed under your calorie goal for 5 out of 7 days this week. Keep up the momentum! 💪
          </p>
        </div>
      </motion.section>
    </div>
  );
};
