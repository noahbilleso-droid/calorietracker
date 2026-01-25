import { motion } from 'framer-motion';
import { Plus, Coffee, Sun, Moon, Apple, X } from 'lucide-react';
import { FoodEntry, MealType } from '@/types/nutrition';
import { Button } from '@/components/ui/button';

interface MealCardProps {
  mealType: MealType;
  entries: FoodEntry[];
  onAddClick: () => void;
  onRemoveEntry: (id: string) => void;
}

const mealConfig = {
  breakfast: { icon: Coffee, label: 'Breakfast', time: '6am - 10am' },
  lunch: { icon: Sun, label: 'Lunch', time: '11am - 2pm' },
  dinner: { icon: Moon, label: 'Dinner', time: '5pm - 9pm' },
  snacks: { icon: Apple, label: 'Snacks', time: 'Anytime' },
};

export const MealCard = ({ mealType, entries, onAddClick, onRemoveEntry }: MealCardProps) => {
  const config = mealConfig[mealType];
  const Icon = config.icon;
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-4 shadow-sm border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{config.label}</h3>
            <p className="text-xs text-muted-foreground">{config.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{totalCalories} cal</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
            onClick={onAddClick}
          >
            <Plus className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center justify-between py-1 group"
            >
              <div className="flex-1">
                <span className="text-sm text-foreground">{entry.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{entry.servingSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{entry.calories} cal</span>
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                >
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
