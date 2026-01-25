import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalorieRing } from './CalorieRing';
import { MacroProgress } from './MacroProgress';
import { MealCard } from './MealCard';
import { AddFoodDialog } from './AddFoodDialog';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { MealType } from '@/types/nutrition';

export const Dashboard = () => {
  const { profile, getEntriesByMeal, getDailyProgress, addEntry, removeEntry, checkDailyReset } = useNutritionStore();
  const [addFoodMeal, setAddFoodMeal] = useState<MealType | null>(null);

  // Check for daily reset when Dashboard mounts
  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);
  
  const progress = getDailyProgress();
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground text-sm">{today}</p>
          <h1 className="text-2xl font-bold text-foreground">Today's Nutrition</h1>
        </motion.div>
      </header>

      {/* Calorie Ring Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center py-6"
      >
        <CalorieRing consumed={progress.calories} goal={profile.dailyCalorieGoal} />
        
        <div className="flex justify-center gap-8 mt-6 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{progress.calories}</p>
            <p className="text-xs text-muted-foreground">Eaten</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-foreground">{profile.dailyCalorieGoal}</p>
            <p className="text-xs text-muted-foreground">Goal</p>
          </div>
        </div>
      </motion.section>

      {/* Macro Progress */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 py-4"
      >
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">Macros</h2>
          <div className="flex gap-6">
            <MacroProgress
              label="Protein"
              current={progress.protein}
              goal={profile.proteinGoal}
              colorClass="bg-nutrition-protein"
              bgClass="bg-nutrition-protein-light"
            />
            <MacroProgress
              label="Carbs"
              current={progress.carbs}
              goal={profile.carbsGoal}
              colorClass="bg-nutrition-carbs"
              bgClass="bg-nutrition-carbs-light"
            />
            <MacroProgress
              label="Fat"
              current={progress.fat}
              goal={profile.fatGoal}
              colorClass="bg-nutrition-fat"
              bgClass="bg-nutrition-fat-light"
            />
          </div>
        </div>
      </motion.section>

      {/* Meal Cards */}
      <section className="px-4 py-2 space-y-3">
        <h2 className="text-sm font-semibold text-foreground mb-2">Today's Meals</h2>
        {mealTypes.map((mealType, index) => (
          <motion.div
            key={mealType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <MealCard
              mealType={mealType}
              entries={getEntriesByMeal(mealType)}
              onAddClick={() => setAddFoodMeal(mealType)}
              onRemoveEntry={removeEntry}
            />
          </motion.div>
        ))}
      </section>

      {/* Add Food Dialog */}
      <AddFoodDialog
        open={addFoodMeal !== null}
        onOpenChange={(open) => !open && setAddFoodMeal(null)}
        mealType={addFoodMeal || 'breakfast'}
        onAddFood={addEntry}
      />
    </div>
  );
};
