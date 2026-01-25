import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealType } from '@/types/nutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  onAddFood: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    mealType: MealType;
  }) => void;
}

const foodDatabase = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
  { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: '1 cup' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: '1 medium' },
  { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: '2 large' },
  { name: 'Avocado', calories: 234, protein: 3, carbs: 12, fat: 21, servingSize: '1 whole' },
  { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g' },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: '170g' },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: '28g' },
  { name: 'Sweet Potato', calories: 103, protein: 2.3, carbs: 24, fat: 0.1, servingSize: '1 medium' },
  { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingSize: '1 cup' },
  { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 2.5, servingSize: '1 cup' },
  { name: 'Whole Wheat Bread', calories: 81, protein: 4, carbs: 14, fat: 1, servingSize: '1 slice' },
];

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export const AddFoodDialog = ({ open, onOpenChange, mealType, onAddFood }: AddFoodDialogProps) => {
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<typeof foodDatabase[0] | null>(null);

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFood = () => {
    if (selectedFood) {
      onAddFood({ ...selectedFood, mealType });
      setSelectedFood(null);
      setSearch('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to {mealLabels[mealType]}</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          <AnimatePresence>
            {filteredFoods.map((food) => (
              <motion.button
                key={food.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedFood(food)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedFood?.name === food.name
                    ? 'bg-primary/10 border-primary border'
                    : 'hover:bg-muted border border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">{food.servingSize}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">{food.calories} cal</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>P: {food.protein}g</span>
                  <span>C: {food.carbs}g</span>
                  <span>F: {food.fat}g</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {selectedFood && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4 border-t border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-foreground">{selectedFood.name}</p>
                <p className="text-sm text-muted-foreground">{selectedFood.servingSize}</p>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <Button onClick={handleAddFood} className="w-full">
              Add {selectedFood.calories} calories
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
