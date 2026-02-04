import { useState, useEffect, forwardRef, useRef } from 'react';
import { Search, X, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MealType } from '@/types/nutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUSDASearch, USDAFood, USDANutrients } from '@/hooks/useUSDASearch';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { getDisplayParts } from '@/lib/foodNameUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

interface SelectedFoodState {
  food: USDAFood;
  nutrientsPer100g: USDANutrients;
  grams: number;
  editedNutrients: USDANutrients;
}

// ForwardRef wrapper for motion.button to fix AnimatePresence ref warning
const MotionButton = forwardRef<HTMLButtonElement, React.ComponentProps<typeof motion.button>>(
  (props, ref) => <motion.button ref={ref} {...props} />
);
MotionButton.displayName = 'MotionButton';

export const AddFoodDialog = ({ open, onOpenChange, mealType, onAddFood }: AddFoodDialogProps) => {
  const [selectedFood, setSelectedFood] = useState<SelectedFoodState | null>(null);
  const [step, setStep] = useState<'search' | 'confirm'>('search');
  const [mounted, setMounted] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  const { query, setQuery, results, isLoading, error, isConfigured, submitSearch } = useUSDASearch();

  // Delay content mount to prevent layout issues on first open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    } else {
      setMounted(false);
      setSelectedFood(null);
      setStep('search');
      setQuery('');
    }
  }, [open, setQuery]);

  const handleSelectFood = (food: USDAFood & { nutrients: USDANutrients }) => {
    const display = getDisplayParts(food.description, query);
    setSelectedFood({
      food: { ...food, description: display.title }, // Use cleaned name
      nutrientsPer100g: food.nutrients,
      grams: 100,
      editedNutrients: { ...food.nutrients },
    });
    setStep('confirm');
  };

  const handleAutocompleteSelect = (text: string) => {
    setAutocompleteOpen(false);
    // Use immediate search to avoid double-click issue
    submitSearch(text);
  };

  const handleGramsChange = (grams: number) => {
    if (!selectedFood) return;
    
    const scale = grams / 100;
    setSelectedFood({
      ...selectedFood,
      grams,
      editedNutrients: {
        calories: Math.round(selectedFood.nutrientsPer100g.calories * scale),
        protein: Math.round(selectedFood.nutrientsPer100g.protein * scale * 10) / 10,
        carbs: Math.round(selectedFood.nutrientsPer100g.carbs * scale * 10) / 10,
        fat: Math.round(selectedFood.nutrientsPer100g.fat * scale * 10) / 10,
      },
    });
  };

  const handleNutrientChange = (key: keyof USDANutrients, value: number) => {
    if (!selectedFood) return;
    setSelectedFood({
      ...selectedFood,
      editedNutrients: {
        ...selectedFood.editedNutrients,
        [key]: value,
      },
    });
  };

  const handleAddFood = () => {
    if (!selectedFood) return;
    
    onAddFood({
      name: selectedFood.food.description,
      calories: selectedFood.editedNutrients.calories,
      protein: selectedFood.editedNutrients.protein,
      carbs: selectedFood.editedNutrients.carbs,
      fat: selectedFood.editedNutrients.fat,
      servingSize: `${selectedFood.grams}g`,
      mealType,
    });
    
    handleClose();
  };

  const handleClose = () => {
    setSelectedFood(null);
    setStep('search');
    setQuery('');
    onOpenChange(false);
  };

  const handleBack = () => {
    setSelectedFood(null);
    setStep('search');
  };

  // Search step content
  const searchContent = (
    <div className="flex flex-col h-full">
      {/* Sticky search header */}
      <div className="sticky top-0 z-10 bg-background pb-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (inputRef.current && inputRef.current.value.length >= 2) {
                setAutocompleteOpen(false);
                submitSearch(inputRef.current.value);
              }
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-0 bg-transparent border-none cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <Input
            ref={inputRef}
            placeholder="Search foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setAutocompleteOpen(true)}
            onKeyDown={(e) => {
              // If the autocomplete consumed Enter (selecting a suggestion), don't submit again.
              if (e.key === 'Enter' && e.defaultPrevented) return;

              if (e.key === 'Enter' && inputRef.current && inputRef.current.value.length >= 2) {
                e.preventDefault();
                setAutocompleteOpen(false);
                submitSearch(inputRef.current.value);
              }
            }}
            className="pl-10"
          />
          <AutocompleteDropdown
            query={query}
            onSelect={handleAutocompleteSelect}
            isOpen={autocompleteOpen}
            onOpenChange={setAutocompleteOpen}
            inputRef={inputRef}
          />
        </div>
      </div>

      {/* API not configured message */}
      {!isConfigured && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Food search not configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add API key to enable search
          </p>
        </div>
      )}

      {/* Loading state */}
      {isConfigured && isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {isConfigured && error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {isConfigured && !isLoading && !error && query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Search className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Type at least 2 characters to search</p>
        </div>
      )}

      {/* No results */}
      {isConfigured && !isLoading && !error && query.length >= 2 && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground">No foods found for "{query}"</p>
        </div>
      )}

      {/* Results list */}
      {isConfigured && !isLoading && results.length > 0 && (
        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="space-y-1 pb-4">
            <AnimatePresence mode="popLayout">
              {results.map((food) => {
                const display = getDisplayParts(food.description, query);
                return (
                  <MotionButton
                    key={food.fdcId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleSelectFood(food)}
                    className="w-full text-left p-3 rounded-lg transition-colors hover:bg-muted border border-transparent"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{display.title}</p>
                        {display.subtext && (
                          <p className="text-xs text-muted-foreground truncate">{display.subtext}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-primary whitespace-nowrap">
                        {food.nutrients.calories} cal
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>P: {food.nutrients.protein}g</span>
                      <span>C: {food.nutrients.carbs}g</span>
                      <span>F: {food.nutrients.fat}g</span>
                      <span className="text-muted-foreground/60">per 100g</span>
                    </div>
                  </MotionButton>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );

  // Confirmation step content
  const confirmContent = selectedFood && (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {/* Food name */}
          <div>
            <h3 className="font-semibold text-foreground">{selectedFood.food.description}</h3>
            {selectedFood.food.foodCategory && (
              <p className="text-sm text-muted-foreground">{selectedFood.food.foodCategory}</p>
            )}
          </div>

          {/* Portion size */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Portion Size (grams)</label>
            <Input
              type="number"
              value={selectedFood.grams}
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
                value={selectedFood.editedNutrients.calories}
                onChange={(e) => handleNutrientChange('calories', parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Protein (g)</label>
              <Input
                type="number"
                step="0.1"
                value={selectedFood.editedNutrients.protein}
                onChange={(e) => handleNutrientChange('protein', parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Carbs (g)</label>
              <Input
                type="number"
                step="0.1"
                value={selectedFood.editedNutrients.carbs}
                onChange={(e) => handleNutrientChange('carbs', parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fat (g)</label>
              <Input
                type="number"
                step="0.1"
                value={selectedFood.editedNutrients.fat}
                onChange={(e) => handleNutrientChange('fat', parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium text-foreground mb-1">Summary</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{selectedFood.editedNutrients.calories} kcal</span>
              <span>P: {selectedFood.editedNutrients.protein}g</span>
              <span>C: {selectedFood.editedNutrients.carbs}g</span>
              <span>F: {selectedFood.editedNutrients.fat}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div 
        className="flex gap-3 pt-4 border-t border-border mt-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Button variant="outline" onClick={handleBack} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleAddFood} className="flex-1">
          Add to Today
        </Button>
      </div>
    </div>
  );

  const currentContent = step === 'search' ? searchContent : confirmContent;
  const currentTitle = step === 'search' 
    ? `Add to ${mealLabels[mealType]}` 
    : 'Confirm Food';

  // Mobile: Full-screen Dialog with fixed positioning
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="fixed inset-0 h-[100dvh] w-screen max-w-none rounded-none border-0 flex flex-col p-0 translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom-0 data-[state=closed]:slide-out-to-bottom-0"
          style={{ 
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Fixed header */}
          <div className="px-4 pt-4 pb-2 border-b border-border flex-shrink-0 bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step === 'confirm' && (
                  <button
                    onClick={handleBack}
                    className="p-1 -ml-1 hover:bg-muted rounded"
                  >
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <DialogTitle>{currentTitle}</DialogTitle>
              </div>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-y-auto px-4 pt-3 flex flex-col min-h-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            {mounted && currentContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Centered Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md max-h-[80vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 'confirm' && (
              <button
                onClick={handleBack}
                className="p-1 -ml-1 hover:bg-muted rounded"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <DialogTitle>{currentTitle}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {mounted && currentContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};
