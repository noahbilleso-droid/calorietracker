import { useState, forwardRef } from 'react';
import { Search, Loader2, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUSDASearch, USDANutrients } from '@/hooks/useUSDASearch';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { FoodConfirmationDialog } from './FoodConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

// ForwardRef wrapper for motion.div to fix AnimatePresence ref warning
const MotionCard = forwardRef<HTMLDivElement, React.ComponentProps<typeof motion.div>>(
  (props, ref) => <motion.div ref={ref} {...props} />
);
MotionCard.displayName = 'MotionCard';

interface SelectedFood {
  name: string;
  category?: string;
  nutrients: USDANutrients;
}

export const SearchTab = () => {
  const { query, setQuery, results, isLoading, error, isConfigured } = useUSDASearch();
  const { addEntry } = useNutritionStore();
  const { toast } = useToast();
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleAddFood = (food: { name: string; category?: string; nutrients: USDANutrients }) => {
    setSelectedFood(food);
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

  const formatNutrient = (value: number) => {
    if (value < 0) return '—';
    return value.toString();
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search foods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </motion.div>

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
            <p className="text-foreground font-medium">No foods found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search term
            </p>
          </motion.div>
        )}

        {/* Results */}
        {isConfigured && !isLoading && results.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {results.map((food, index) => (
                <MotionCard
                  key={food.fdcId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-lg p-4 border border-border shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground line-clamp-2">{food.description}</h3>
                      {food.foodCategory && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
                          {food.foodCategory}
                        </span>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                        <span className="text-nutrition-protein">P: {formatNutrient(food.nutrients.protein)}g</span>
                        <span className="text-nutrition-carbs">C: {formatNutrient(food.nutrients.carbs)}g</span>
                        <span className="text-nutrition-fat">F: {formatNutrient(food.nutrients.fat)}g</span>
                        <span className="text-muted-foreground/60">per 100g</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatNutrient(food.nutrients.calories)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFood({
                          name: food.description,
                          category: food.foodCategory,
                          nutrients: {
                            calories: Math.max(0, food.nutrients.calories),
                            protein: Math.max(0, food.nutrients.protein),
                            carbs: Math.max(0, food.nutrients.carbs),
                            fat: Math.max(0, food.nutrients.fat),
                          },
                        })}
                        className="h-8 px-3"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </MotionCard>
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
