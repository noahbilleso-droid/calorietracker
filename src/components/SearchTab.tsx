import { useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

const allFoods = [
  { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Protein' },
  { name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, category: 'Grains' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, category: 'Fruit' },
  { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Protein' },
  { name: 'Avocado', calories: 234, protein: 3, carbs: 12, fat: 21, category: 'Fruit' },
  { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'Protein' },
  { name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0.7, category: 'Dairy' },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, category: 'Nuts' },
  { name: 'Sweet Potato', calories: 103, protein: 2.3, carbs: 24, fat: 0.1, category: 'Vegetables' },
  { name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, category: 'Vegetables' },
  { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 2.5, category: 'Grains' },
  { name: 'Whole Wheat Bread', calories: 81, protein: 4, carbs: 14, fat: 1, category: 'Grains' },
  { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, category: 'Fruit' },
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Vegetables' },
  { name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, category: 'Dairy' },
];

const categories = ['All', 'Protein', 'Grains', 'Fruit', 'Vegetables', 'Dairy', 'Nuts'];

export const SearchTab = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFoods = allFoods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredFoods.map((food, index) => (
              <motion.div
                key={food.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-lg p-4 border border-border shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{food.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {food.category}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-primary">{food.calories}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="text-nutrition-protein">P: {food.protein}g</span>
                  <span className="text-nutrition-carbs">C: {food.carbs}g</span>
                  <span className="text-nutrition-fat">F: {food.fat}g</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
