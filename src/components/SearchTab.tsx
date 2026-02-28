import { useState, useMemo, useRef } from 'react';
import { Search, Loader2, AlertCircle, Lightbulb, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUSDASearch, USDANutrients } from '@/hooks/useUSDASearch';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { FoodConfirmationDialog } from './FoodConfirmationDialog';
import { AutocompleteDropdown } from './AutocompleteDropdown';
import { useToast } from '@/hooks/use-toast';
import { ProcessedFoodResult } from '@/lib/searchPostProcess';

interface SelectedFood {
  name: string;
  category?: string;
  nutrients: USDANutrients;
}

export const SearchTab = () => {
  const { 
    query, 
    setQuery, 
    results, 
    isLoading, 
    error, 
    isConfigured,
    didYouMean,
    applyDidYouMean,
    submitSearch,
  } = useUSDASearch();
  const { addEntry } = useNutritionStore();
  const { toast } = useToast();
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddFood = (food: ProcessedFoodResult) => {
    setSelectedFood({
      name: food.displayName,
      category: food.foodCategory,
      nutrients: food.nutrients,
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmFood = (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  }) => {
    addEntry(food);
    toast({
      title: 'Food added',
      description: `${food.name} added to ${food.mealType}`,
    });
    setSelectedFood(null);
  };

  const handleDidYouMeanClick = () => {
    applyDidYouMean();
  };

  const handleAutocompleteSelect = (text: string) => {
    setAutocompleteOpen(false);
    inputRef.current?.blur();
    // Use immediate search to avoid double-click issue
    submitSearch(text);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Search Foods</h1>
          <p className="text-muted-foreground text-sm">Find nutrition information</p>
        </motion.div>
      </header>

      <div className="px-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
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
            <Search className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
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
            className="pl-11 h-12 text-base"
          />
          <AutocompleteDropdown
            query={query}
            onSelect={handleAutocompleteSelect}
            isOpen={autocompleteOpen}
            onOpenChange={setAutocompleteOpen}
            inputRef={inputRef}
          />
        </motion.div>

        {/* Did you mean suggestion */}
        {didYouMean && !isLoading && (
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleDidYouMeanClick}
            className="flex items-center gap-2 w-full px-3 py-2 bg-primary/10 hover:bg-primary/15 rounded-lg text-sm text-primary transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>
              Did you mean: <strong className="font-semibold">{didYouMean}</strong>?
            </span>
          </motion.button>
        )}

        {/* API not configured */}
        {!isConfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Food search not configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add API key to enable search
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        {isConfigured && isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {isConfigured && error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <p className="text-foreground font-medium">Something went wrong</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </motion.div>
        )}

        {/* Empty state - no query */}
        {isConfigured && !isLoading && !error && query.length < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Search className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">Search for foods</p>
            <p className="text-sm text-muted-foreground mt-1">
              Type at least 2 characters to search
            </p>
          </motion.div>
        )}

        {/* No results */}
        {isConfigured && !isLoading && !error && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <Search className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">No matches found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try fewer words or check spelling
            </p>
          </motion.div>
        )}

        {/* Results */}
        {isConfigured && !isLoading && results.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {results.map((food, index) => (
                <motion.div
                  key={food.fdcId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-lg p-4 border border-border shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-2">
                        {food.displayName}
                      </h3>
                      {food.subtext && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {food.subtext}
                        </p>
                      )}
                      {food.defaultServing ? (
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1.5">
                          <span className="font-medium text-foreground/70">
                            {food.defaultServing.label} (~{food.defaultServing.grams}g)
                          </span>
                          <span className="text-nutrition-protein">P: {food.servingNutrients?.protein}g</span>
                          <span className="text-nutrition-carbs">C: {food.servingNutrients?.carbs}g</span>
                          <span className="text-nutrition-fat">F: {food.servingNutrients?.fat}g</span>
                        </div>
                      ) : (
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1.5">
                          <span className="text-nutrition-protein">P: {food.nutrients.protein}g</span>
                          <span className="text-nutrition-carbs">C: {food.nutrients.carbs}g</span>
                          <span className="text-nutrition-fat">F: {food.nutrients.fat}g</span>
                          <span className="text-muted-foreground/60">per 100g</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-primary text-lg">
                        {food.defaultServing ? food.servingNutrients?.calories : food.nutrients.calories}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">kcal</span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFood(food)}
                        className="h-8 px-3"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <FoodConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        food={selectedFood}
        onConfirm={handleConfirmFood}
      />
    </div>
  );
};
