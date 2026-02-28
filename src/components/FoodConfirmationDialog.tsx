import { useState, useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { MealType } from '@/types/nutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { USDANutrients } from '@/hooks/useUSDASearch';
import { getDefaultServing } from '@/lib/servingSizes';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FoodConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: {
    name: string;
    category?: string;
    nutrients: USDANutrients;
  } | null;
  onConfirm: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    mealType: MealType;
  }) => void;
  /** If provided, skip meal selection */
  fixedMealType?: MealType;
}

const mealOptions: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

export const FoodConfirmationDialog = ({
  open,
  onOpenChange,
  food,
  onConfirm,
  fixedMealType,
}: FoodConfirmationDialogProps) => {
  const isMobile = useIsMobile();
  const [mealType, setMealType] = useState<MealType>(fixedMealType || 'breakfast');
  const [grams, setGrams] = useState(100);
  const [nutrients, setNutrients] = useState<USDANutrients>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [nutrientsPer100g, setNutrientsPer100g] = useState<USDANutrients>({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Reset state when food changes
  useEffect(() => {
    if (food) {
      setNutrientsPer100g(food.nutrients);
      const serving = getDefaultServing(food.name);
      const defaultGrams = serving?.grams || 100;
      const scale = defaultGrams / 100;
      setGrams(defaultGrams);
      setNutrients({
        calories: Math.round(food.nutrients.calories * scale),
        protein: Math.round(food.nutrients.protein * scale * 10) / 10,
        carbs: Math.round(food.nutrients.carbs * scale * 10) / 10,
        fat: Math.round(food.nutrients.fat * scale * 10) / 10,
      });
      if (fixedMealType) {
        setMealType(fixedMealType);
      }
    }
  }, [food, fixedMealType]);

  const handleGramsChange = (newGrams: number) => {
    const scale = newGrams / 100;
    setGrams(newGrams);
    setNutrients({
      calories: Math.round(nutrientsPer100g.calories * scale),
      protein: Math.round(nutrientsPer100g.protein * scale * 10) / 10,
      carbs: Math.round(nutrientsPer100g.carbs * scale * 10) / 10,
      fat: Math.round(nutrientsPer100g.fat * scale * 10) / 10,
    });
  };

  const handleNutrientChange = (key: keyof USDANutrients, value: number) => {
    setNutrients(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    if (!food) return;
    
    onConfirm({
      name: food.name,
      calories: nutrients.calories,
      protein: nutrients.protein,
      carbs: nutrients.carbs,
      fat: nutrients.fat,
      servingSize: `${grams}g`,
      mealType,
    });
    
    onOpenChange(false);
  };

  const formatValue = (value: number, isCalories = false) => {
    if (value === 0 && !isCalories) return '—';
    return isCalories ? value.toString() : value.toString();
  };

  if (!food) return null;

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Food name */}
        <div>
          <h3 className="font-semibold text-foreground">{food.name}</h3>
          {food.category && (
            <p className="text-sm text-muted-foreground">{food.category}</p>
          )}
        </div>

        {/* Meal type selector (only if not fixed) */}
        {!fixedMealType && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Add to</label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select meal" />
              </SelectTrigger>
              <SelectContent>
                {mealOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Portion size */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Portion Size (grams)</label>
          <Input
            type="number"
            value={grams}
            onChange={(e) => handleGramsChange(Math.max(1, parseInt(e.target.value) || 0))}
            min={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Nutrition values scale automatically based on portion size
          </p>
        </div>

        {/* Editable nutrients */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Calories</label>
            <Input
              type="number"
              value={nutrients.calories}
              onChange={(e) => handleNutrientChange('calories', parseInt(e.target.value) || 0)}
              min={0}
              placeholder="—"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Protein (g)</label>
            <Input
              type="number"
              step="0.1"
              value={nutrients.protein || ''}
              onChange={(e) => handleNutrientChange('protein', parseFloat(e.target.value) || 0)}
              min={0}
              placeholder="—"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Carbs (g)</label>
            <Input
              type="number"
              step="0.1"
              value={nutrients.carbs || ''}
              onChange={(e) => handleNutrientChange('carbs', parseFloat(e.target.value) || 0)}
              min={0}
              placeholder="—"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Fat (g)</label>
            <Input
              type="number"
              step="0.1"
              value={nutrients.fat || ''}
              onChange={(e) => handleNutrientChange('fat', parseFloat(e.target.value) || 0)}
              min={0}
              placeholder="—"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">Summary</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatValue(nutrients.calories, true)} kcal</span>
            <span>P: {formatValue(nutrients.protein)}g</span>
            <span>C: {formatValue(nutrients.carbs)}g</span>
            <span>F: {formatValue(nutrients.fat)}g</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div 
        className="flex gap-3 pt-4 border-t border-border mt-auto"
        style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 16px)' : undefined }}
      >
        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleConfirm} className="flex-1">
          Add to {mealOptions.find(m => m.value === mealType)?.label}
        </Button>
      </div>
    </div>
  );

  // Mobile: Full-screen
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="fixed inset-0 h-[100dvh] w-screen max-w-none rounded-none border-0 flex flex-col p-0 translate-x-0 translate-y-0"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-4 pt-4 pb-2 border-b border-border flex-shrink-0 bg-background">
            <div className="flex items-center justify-between">
              <DialogTitle>Add Food</DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 -mr-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-3 flex flex-col min-h-0">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md max-h-[80vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Add Food</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
};
