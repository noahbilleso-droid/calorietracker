import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Scale, Ruler, Activity, Trash2 } from 'lucide-react';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const ProfileTab = () => {
  const { profile, clearHistory, dayLogs } = useNutritionStore();
  const [showCleared, setShowCleared] = useState(false);

  const stats = [
    { icon: Target, label: 'Daily Goal', value: `${profile.dailyCalorieGoal.toLocaleString()} cal` },
    { icon: Scale, label: 'Current Weight', value: '75 kg' },
    { icon: Ruler, label: 'Height', value: '175 cm' },
    { icon: Activity, label: 'Activity Level', value: 'Moderate' },
  ];

  const macroGoals = [
    { label: 'Protein', value: profile.proteinGoal, unit: 'g', color: 'bg-nutrition-protein' },
    { label: 'Carbs', value: profile.carbsGoal, unit: 'g', color: 'bg-nutrition-carbs' },
    { label: 'Fat', value: profile.fatGoal, unit: 'g', color: 'bg-nutrition-fat' },
  ];

  const handleClearHistory = () => {
    clearHistory();
    setShowCleared(true);
    setTimeout(() => setShowCleared(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground text-sm">Your nutrition settings</p>
        </motion.div>
      </header>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 bg-card rounded-lg p-6 border border-border shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">
              {dayLogs.length > 0 
                ? `${dayLogs.length} day${dayLogs.length === 1 ? '' : 's'} logged`
                : 'No days logged yet'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="bg-card rounded-lg p-4 border border-border shadow-sm"
            >
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Macro Goals */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 mt-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Daily Macro Goals</h3>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm space-y-4">
          {macroGoals.map((macro) => (
            <div key={macro.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${macro.color}`} />
                <span className="text-sm text-foreground">{macro.label}</span>
              </div>
              <span className="font-medium text-foreground">
                {macro.value}{macro.unit}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Clear History Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Data Management</h3>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Clear History</p>
              <p className="text-xs text-muted-foreground">
                Delete all logged days ({dayLogs.length} {dayLogs.length === 1 ? 'day' : 'days'})
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={dayLogs.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {dayLogs.length} logged {dayLogs.length === 1 ? 'day' : 'days'} including streaks, 
                    averages, and weekly data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearHistory}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {showCleared && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-nutrition-protein mt-2"
            >
              ✓ History cleared successfully
            </motion.p>
          )}
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 mt-6"
      >
        <div className="bg-accent rounded-lg p-4">
          <p className="text-sm text-accent-foreground">
            Want to adjust your goals? Tap any stat above to customize your nutrition plan.
          </p>
        </div>
      </motion.section>
    </div>
  );
};
