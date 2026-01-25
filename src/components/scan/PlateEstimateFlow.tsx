import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, X, Search, Loader2 } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlateEstimateFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

interface FoodItem {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface SelectedFood extends FoodItem {
  amount: number;
  unit: 'g' | 'pieces' | 'cups';
}

// Built-in common foods database
const commonFoods: FoodItem[] = [
  { id: 'rice', name: 'White Rice (cooked)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: 'chicken-breast', name: 'Chicken Breast (grilled)', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'salmon', name: 'Salmon (baked)', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'broccoli', name: 'Broccoli (steamed)', caloriesPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7, fatPer100g: 0.4 },
  { id: 'egg', name: 'Egg (boiled)', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: 'pasta', name: 'Pasta (cooked)', caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1 },
  { id: 'bread', name: 'White Bread', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2 },
  { id: 'potato', name: 'Potato (boiled)', caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: 'beef', name: 'Beef (lean)', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
  { id: 'tofu', name: 'Tofu', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8 },
  { id: 'banana', name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: 'apple', name: 'Apple', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { id: 'avocado', name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15 },
  { id: 'cheese', name: 'Cheddar Cheese', caloriesPer100g: 403, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33 },
  { id: 'yogurt', name: 'Greek Yogurt', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.7 },
];

// Unit conversion to grams
const unitToGrams: Record<string, number> = {
  g: 1,
  pieces: 50, // average piece ~50g
  cups: 200, // 1 cup ~200g
};

type Step = 'capture' | 'select' | 'confirm';

export const PlateEstimateFlow = ({ onBack, onComplete }: PlateEstimateFlowProps) => {
  const [step, setStep] = useState<Step>('capture');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const { addEntry } = useNutritionStore();
  const { toast } = useToast();

  const filteredCommonFoods = useMemo(() => {
    if (!searchQuery.trim()) return commonFoods;
    const query = searchQuery.toLowerCase();
    return commonFoods.filter(food => 
      food.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const searchOpenFoodFacts = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
      );
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        const results: FoodItem[] = data.products
          .filter((p: any) => p.nutriments && p.product_name)
          .map((p: any) => ({
            id: p.code || p._id,
            name: p.product_name,
            caloriesPer100g: Math.round(p.nutriments['energy-kcal_100g'] || 0),
            proteinPer100g: Math.round(p.nutriments.proteins_100g || 0),
            carbsPer100g: Math.round(p.nutriments.carbohydrates_100g || 0),
            fatPer100g: Math.round(p.nutriments.fat_100g || 0),
          }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCapture = (imageData: string) => {
    setImagePreview(imageData);
    setStep('select');
  };

  const addFood = (food: FoodItem) => {
    const existingIndex = selectedFoods.findIndex(f => f.id === food.id);
    if (existingIndex >= 0) {
      toast({
        title: 'Already added',
        description: 'Adjust the portion size instead',
      });
      return;
    }
    
    setSelectedFoods(prev => [...prev, { ...food, amount: 100, unit: 'g' }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFood = (id: string) => {
    setSelectedFoods(prev => prev.filter(f => f.id !== id));
  };

  const updateFoodAmount = (id: string, amount: number) => {
    setSelectedFoods(prev =>
      prev.map(f => (f.id === id ? { ...f, amount: Math.max(0, amount) } : f))
    );
  };

  const updateFoodUnit = (id: string, unit: 'g' | 'pieces' | 'cups') => {
    setSelectedFoods(prev =>
      prev.map(f => (f.id === id ? { ...f, unit } : f))
    );
  };

  const calculateTotals = () => {
    return selectedFoods.reduce(
      (acc, food) => {
        const grams = food.amount * unitToGrams[food.unit];
        const multiplier = grams / 100;
        return {
          calories: acc.calories + Math.round(food.caloriesPer100g * multiplier),
          protein: acc.protein + Math.round(food.proteinPer100g * multiplier),
          carbs: acc.carbs + Math.round(food.carbsPer100g * multiplier),
          fat: acc.fat + Math.round(food.fatPer100g * multiplier),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleAdd = () => {
    if (selectedFoods.length === 0) {
      toast({
        title: 'No foods selected',
        description: 'Please add at least one food item',
        variant: 'destructive',
      });
      return;
    }

    const totals = calculateTotals();
    const foodNames = selectedFoods.map(f => f.name).join(', ');
    
    addEntry({
      name: `Plate: ${foodNames.substring(0, 50)}${foodNames.length > 50 ? '...' : ''}`,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      servingSize: '1 plate',
      mealType,
    });

    toast({
      title: 'Plate added!',
      description: `${selectedFoods.length} items added to ${mealType}`,
    });

    onComplete();
  };

  const totals = calculateTotals();

  if (step === 'capture') {
    return (
      <CameraCapture
        onCapture={handleCapture}
        onCancel={onBack}
        title="Scan Plate"
        instructions="Take a photo of your plate for reference"
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setStep('capture')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">Select Foods</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Image Preview */}
        <div className="p-4 pb-2">
          <div className="w-full h-24 rounded-lg overflow-hidden border">
            <img src={imagePreview} alt="Plate" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchOpenFoodFacts(searchQuery)}
              className="pl-10"
            />
          </div>
          {isSearching && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
        </div>

        {/* Food List */}
        <ScrollArea className="flex-1 px-4">
          {/* Search Results from OpenFoodFacts */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Online Results</p>
              <div className="space-y-1">
                {searchResults.map(food => (
                  <Button
                    key={food.id}
                    variant="ghost"
                    className="w-full justify-between h-auto py-2"
                    onClick={() => addFood(food)}
                  >
                    <span className="text-left truncate">{food.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {food.caloriesPer100g} kcal/100g
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Common Foods */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Common Foods</p>
            <div className="space-y-1">
              {filteredCommonFoods.slice(0, 8).map(food => (
                <Button
                  key={food.id}
                  variant="ghost"
                  className="w-full justify-between h-auto py-2"
                  onClick={() => addFood(food)}
                >
                  <span className="text-left truncate">{food.name}</span>
                  <Plus className="h-4 w-4 shrink-0" />
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Foods */}
          {selectedFoods.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Selected ({selectedFoods.length})</p>
              <div className="space-y-2">
                {selectedFoods.map(food => (
                  <div
                    key={food.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{food.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFood(food.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={food.amount}
                        onChange={(e) => updateFoodAmount(food.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                      />
                      <Select
                        value={food.unit}
                        onValueChange={(v) => updateFoodUnit(food.id, v as 'g' | 'pieces' | 'cups')}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">grams</SelectItem>
                          <SelectItem value="pieces">pieces</SelectItem>
                          <SelectItem value="cups">cups</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Totals & Actions */}
        <div className="p-4 border-t bg-background">
          <div className="mb-3">
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

          <div className="grid grid-cols-4 gap-2 text-center mb-3 p-2 bg-muted rounded-lg">
            <div>
              <p className="text-lg font-bold">{totals.calories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-nutrition-protein">{totals.protein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div>
              <p className="text-lg font-bold text-nutrition-carbs">{totals.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-nutrition-fat">{totals.fat}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleAdd}
              disabled={selectedFoods.length === 0}
            >
              Add to Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
