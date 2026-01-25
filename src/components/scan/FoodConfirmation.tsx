import { useState } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { MealType } from '@/types/nutrition';
import { useToast } from '@/hooks/use-toast';

export interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface FoodConfirmationProps {
  initialData: NutritionData;
  onBack: () => void;
  onComplete: () => void;
  imagePreview?: string;
}

export const FoodConfirmation = ({
  initialData,
  onBack,
  onComplete,
  imagePreview,
}: FoodConfirmationProps) => {
  const [data, setData] = useState<NutritionData>(initialData);
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const { addEntry } = useNutritionStore();
  const { toast } = useToast();

  const adjustPortion = (delta: number) => {
    const newPortion = Math.max(0.25, Math.min(10, portion + delta));
    setPortion(newPortion);
  };

  const getAdjustedValue = (value: number) => Math.round(value * portion);

  const handleAdd = () => {
    addEntry({
      name: data.name,
      calories: getAdjustedValue(data.calories),
      protein: getAdjustedValue(data.protein),
      carbs: getAdjustedValue(data.carbs),
      fat: getAdjustedValue(data.fat),
      servingSize: `${portion}x ${data.servingSize}`,
      mealType,
    });

    toast({
      title: 'Food added!',
      description: `${data.name} added to ${mealType}`,
    });

    onComplete();
  };

  const updateField = (field: keyof NutritionData, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">Confirm Food</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {imagePreview && (
          <div className="w-full aspect-video rounded-lg overflow-hidden border">
            <img src={imagePreview} alt="Food" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Food Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="serving">Serving Size</Label>
            <Input
              id="serving"
              value={data.servingSize}
              onChange={(e) => updateField('servingSize', e.target.value)}
            />
          </div>

          <div>
            <Label>Portion Multiplier</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustPortion(-0.25)}
                disabled={portion <= 0.25}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-16 text-center font-semibold text-lg">
                {portion}x
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustPortion(0.25)}
                disabled={portion >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Meal</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={data.calories}
                onChange={(e) => updateField('calories', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjusted: {getAdjustedValue(data.calories)} kcal
              </p>
            </div>
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={data.protein}
                onChange={(e) => updateField('protein', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjusted: {getAdjustedValue(data.protein)}g
              </p>
            </div>
            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={data.carbs}
                onChange={(e) => updateField('carbs', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjusted: {getAdjustedValue(data.carbs)}g
              </p>
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={data.fat}
                onChange={(e) => updateField('fat', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjusted: {getAdjustedValue(data.fat)}g
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleAdd}>
          Add to Today
        </Button>
      </div>
    </div>
  );
};
