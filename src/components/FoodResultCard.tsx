import { useState, forwardRef } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { USDANutrients } from '@/hooks/useUSDASearch';
import { cleanDisplayName, GroupedFoodResult } from '@/lib/foodNameUtils';

// ForwardRef wrapper for motion.div
const MotionDiv = forwardRef<HTMLDivElement, React.ComponentProps<typeof motion.div>>(
  (props, ref) => <motion.div ref={ref} {...props} />
);
MotionDiv.displayName = 'MotionDiv';

interface FoodItem {
  fdcId: number;
  description: string;
  foodCategory?: string;
  nutrients: USDANutrients;
}

interface FoodResultCardProps {
  group: GroupedFoodResult<FoodItem>;
  onAddFood: (food: {
    name: string;
    category?: string;
    nutrients: USDANutrients;
  }) => void;
  index: number;
}

const formatNutrient = (value: number) => {
  if (value < 0) return '—';
  return value.toString();
};

function FoodItemRow({
  item,
  displayName,
  onAdd,
  isVariant = false,
}: {
  item: FoodItem;
  displayName: string;
  onAdd: () => void;
  isVariant?: boolean;
}) {
  const nutrients = item.nutrients;
  
  return (
    <div className={`flex justify-between items-start gap-3 ${isVariant ? 'py-3 border-t border-border/50' : ''}`}>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium text-foreground ${isVariant ? 'text-sm' : ''} line-clamp-2`}>
          {displayName}
        </h3>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1.5">
          <span className="text-nutrition-protein">P: {formatNutrient(nutrients.protein)}g</span>
          <span className="text-nutrition-carbs">C: {formatNutrient(nutrients.carbs)}g</span>
          <span className="text-nutrition-fat">F: {formatNutrient(nutrients.fat)}g</span>
          <span className="text-muted-foreground/60">per 100g</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`font-bold text-primary ${isVariant ? 'text-base' : 'text-lg'}`}>
          {formatNutrient(nutrients.calories)}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">kcal</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-8 px-3"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

export function FoodResultCard({ group, onAddFood, index }: FoodResultCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleAddMain = () => {
    onAddFood({
      name: group.displayName,
      category: group.mainItem.foodCategory,
      nutrients: {
        calories: Math.max(0, group.mainItem.nutrients.calories),
        protein: Math.max(0, group.mainItem.nutrients.protein),
        carbs: Math.max(0, group.mainItem.nutrients.carbs),
        fat: Math.max(0, group.mainItem.nutrients.fat),
      },
    });
  };
  
  const handleAddVariant = (item: FoodItem) => {
    const variantDisplayName = cleanDisplayName(item.description);
    onAddFood({
      name: variantDisplayName,
      category: item.foodCategory,
      nutrients: {
        calories: Math.max(0, item.nutrients.calories),
        protein: Math.max(0, item.nutrients.protein),
        carbs: Math.max(0, item.nutrients.carbs),
        fat: Math.max(0, item.nutrients.fat),
      },
    });
  };
  
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card rounded-lg p-4 border border-border shadow-sm"
    >
      {/* Main item */}
      <FoodItemRow
        item={group.mainItem}
        displayName={group.displayName}
        onAdd={handleAddMain}
      />
      
      {/* Variants section */}
      {group.hasVariants && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mt-3 pt-2 border-t border-border/50 w-full transition-colors"
            >
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>
                {isOpen ? 'Hide options' : `${group.variants.length} more option${group.variants.length > 1 ? 's' : ''}`}
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pl-2 border-l-2 border-primary/20"
                >
                  {group.variants.map((variant) => (
                    <FoodItemRow
                      key={variant.fdcId}
                      item={variant}
                      displayName={cleanDisplayName(variant.description)}
                      onAdd={() => handleAddVariant(variant)}
                      isVariant
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      )}
    </MotionDiv>
  );
}
