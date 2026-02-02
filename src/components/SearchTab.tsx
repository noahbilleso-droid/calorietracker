import { useState, useMemo } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useUSDASearch, USDANutrients } from '@/hooks/useUSDASearch';
import { useNutritionStore } from '@/hooks/useNutritionStore';
import { FoodConfirmationDialog } from './FoodConfirmationDialog';
import { FoodResultCard } from './FoodResultCard';
import { useToast } from '@/hooks/use-toast';
import { groupFoodResults } from '@/lib/foodNameUtils';

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

  // Group and sort results for human-friendly display
  const groupedResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    return groupFoodResults(results, query);
  }, [results, query]);

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
        {isConfigured && !isLoading && !error && query.length >= 2 && groupedResults.length === 0 && (
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

        {/* Grouped Results */}
        {isConfigured && !isLoading && groupedResults.length > 0 && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {groupedResults.map((group, index) => (
                <FoodResultCard
                  key={group.key + '-' + group.mainItem.fdcId}
                  group={group}
                  onAddFood={handleAddFood}
                  index={index}
                />
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
