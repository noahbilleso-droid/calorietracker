import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Target, Scale, Ruler, Activity, Sun, Moon, Monitor, LogOut, Loader2 } from 'lucide-react';
import { useProfileStore, ActivityLevel } from '@/hooks/useProfileStore';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProfileStatEditor } from './ProfileStatEditor';

type StatType = 'dailyCalorieGoal' | 'weightKg' | 'heightCm' | 'activityLevel';

export const ProfileTab = () => {
  const { profile, updateProfile, loading: profileLoading } = useProfileStore();
  const { dayLogs } = useNutritionStore();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editingStat, setEditingStat] = useState<StatType | null>(null);

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  const stats: Array<{
    icon: typeof Target;
    label: string;
    value: string;
    key: StatType;
  }> = [
    {
      icon: Target,
      label: 'Daily Goal',
      value: `${profile.dailyCalorieGoal.toLocaleString()} cal`,
      key: 'dailyCalorieGoal',
    },
    {
      icon: Scale,
      label: 'Current Weight',
      value: `${profile.weightKg} kg`,
      key: 'weightKg',
    },
    {
      icon: Ruler,
      label: 'Height',
      value: `${profile.heightCm} cm`,
      key: 'heightCm',
    },
    {
      icon: Activity,
      label: 'Activity Level',
      value: profile.activityLevel,
      key: 'activityLevel',
    },
  ];

  // Macro goals based on calorie goal (rough estimation)
  const proteinGoal = Math.round((profile.dailyCalorieGoal * 0.25) / 4); // 25% of calories, 4 cal/g
  const carbsGoal = Math.round((profile.dailyCalorieGoal * 0.45) / 4); // 45% of calories, 4 cal/g
  const fatGoal = Math.round((profile.dailyCalorieGoal * 0.30) / 9); // 30% of calories, 9 cal/g

  const macroGoals = [
    { label: 'Protein', value: proteinGoal, unit: 'g', color: 'bg-nutrition-protein' },
    { label: 'Carbs', value: carbsGoal, unit: 'g', color: 'bg-nutrition-carbs' },
    { label: 'Fat', value: fatGoal, unit: 'g', color: 'bg-nutrition-fat' },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: error.message,
      });
      setIsLoggingOut(false);
    }
  };

  const handleSaveStat = async (value: number | string) => {
    if (!editingStat) return;

    const updates: Partial<Record<StatType, number | string>> = {
      [editingStat]: value,
    };

    const { error } = await updateProfile(updates as any);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not save your changes. Please try again.',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Your profile has been updated.',
      });
    }
  };

  const getCurrentValue = (key: StatType): number | string => {
    switch (key) {
      case 'dailyCalorieGoal':
        return profile.dailyCalorieGoal;
      case 'weightKg':
        return profile.weightKg;
      case 'heightCm':
        return profile.heightCm;
      case 'activityLevel':
        return profile.activityLevel;
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <h2 className="text-xl font-bold text-foreground">
              {user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dayLogs.length > 0
                ? `${dayLogs.length} day${dayLogs.length === 1 ? '' : 's'} logged`
                : 'No days logged yet'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Clickable */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="bg-card rounded-lg p-4 border border-border shadow-sm text-left hover:border-primary/50 hover:bg-accent/50 transition-colors active:scale-[0.98]"
              onClick={() => setEditingStat(stat.key)}
            >
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.button>
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

      {/* Appearance Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="px-4 mt-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Appearance</h3>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Theme</p>
            <div className="flex bg-muted rounded-lg p-1 gap-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    theme === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <option.icon className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Account Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 mt-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Logged in as</p>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {user?.email || 'Unknown'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <LogOut className="w-4 h-4 mr-1" />
              )}
              Log out
            </Button>
          </div>
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

      {/* Stat Editor Sheet */}
      {editingStat && (
        <ProfileStatEditor
          open={!!editingStat}
          onOpenChange={(open) => !open && setEditingStat(null)}
          statType={editingStat}
          currentValue={getCurrentValue(editingStat)}
          onSave={handleSaveStat}
        />
      )}
    </div>
  );
};
