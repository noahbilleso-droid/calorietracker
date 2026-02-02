import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  rerankResults, 
  getDidYouMean, 
  hasWeakResults, 
  extractMainTokens,
  ScoredResult 
} from '@/lib/fuzzySearch';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

export interface USDAFood {
  fdcId: number;
  description: string;
  foodCategory?: string;
  brandOwner?: string;
}

export interface USDANutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface USDASearchResponse {
  foods: Array<{
    fdcId: number;
    description: string;
    foodCategory?: string;
    brandOwner?: string;
    foodNutrients?: Array<{
      nutrientId: number;
      nutrientName: string;
      value: number;
      unitName: string;
    }>;
  }>;
  totalHits: number;
}

interface USDAFoodDetailsResponse {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }>;
}

// USDA Nutrient IDs
const NUTRIENT_IDS = {
  ENERGY_KCAL: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
};

function extractNutrientsFromSearch(foodNutrients: USDASearchResponse['foods'][0]['foodNutrients']): USDANutrients {
  const nutrients: USDANutrients = { calories: -1, protein: -1, carbs: -1, fat: -1 };
  
  if (!foodNutrients || foodNutrients.length === 0) return nutrients;
  
  for (const nutrient of foodNutrients) {
    switch (nutrient.nutrientId) {
      case NUTRIENT_IDS.ENERGY_KCAL:
        nutrients.calories = Math.round(nutrient.value);
        break;
      case NUTRIENT_IDS.PROTEIN:
        nutrients.protein = Math.round(nutrient.value * 10) / 10;
        break;
      case NUTRIENT_IDS.CARBS:
        nutrients.carbs = Math.round(nutrient.value * 10) / 10;
        break;
      case NUTRIENT_IDS.FAT:
        nutrients.fat = Math.round(nutrient.value * 10) / 10;
        break;
    }
  }
  
  const hasAnyData = nutrients.calories >= 0 || nutrients.protein >= 0 || nutrients.carbs >= 0 || nutrients.fat >= 0;
  if (hasAnyData) {
    if (nutrients.calories < 0) nutrients.calories = 0;
    if (nutrients.protein < 0) nutrients.protein = 0;
    if (nutrients.carbs < 0) nutrients.carbs = 0;
    if (nutrients.fat < 0) nutrients.fat = 0;
  }
  
  return nutrients;
}

function extractNutrientsFromDetails(foodNutrients: USDAFoodDetailsResponse['foodNutrients']): USDANutrients {
  const nutrients: USDANutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (!foodNutrients) return nutrients;
  
  for (const nutrient of foodNutrients) {
    switch (nutrient.nutrient.id) {
      case NUTRIENT_IDS.ENERGY_KCAL:
        nutrients.calories = Math.round(nutrient.amount);
        break;
      case NUTRIENT_IDS.PROTEIN:
        nutrients.protein = Math.round(nutrient.amount * 10) / 10;
        break;
      case NUTRIENT_IDS.CARBS:
        nutrients.carbs = Math.round(nutrient.amount * 10) / 10;
        break;
      case NUTRIENT_IDS.FAT:
        nutrients.fat = Math.round(nutrient.amount * 10) / 10;
        break;
    }
  }
  
  return nutrients;
}

type FoodWithNutrients = USDAFood & { nutrients: USDANutrients };

async function fetchUSDASearch(
  query: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<FoodWithNutrients[]> {
  const url = new URL(`${USDA_API_BASE}/foods/search`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('dataType', 'Foundation,SR Legacy');
  url.searchParams.set('pageSize', '25');

  const response = await fetch(url.toString(), { signal });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: USDASearchResponse = await response.json();
  
  return data.foods.map(food => ({
    fdcId: food.fdcId,
    description: food.description,
    foodCategory: food.foodCategory,
    nutrients: extractNutrientsFromSearch(food.foodNutrients),
  }));
}

export function useUSDASearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodWithNutrients[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiKey = import.meta.env.VITE_USDA_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setIsConfigured(false);
      setError('Food search not configured');
    }
  }, [apiKey]);

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!apiKey) {
      setIsConfigured(false);
      return;
    }

    if (searchQuery.length < 2) {
      setResults([]);
      setDidYouMean(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setDidYouMean(null);

    try {
      // Fetch primary search results
      let foods = await fetchUSDASearch(
        searchQuery,
        apiKey,
        abortControllerRef.current.signal
      );

      // Check if results are weak - try expanded search
      if (hasWeakResults(searchQuery, foods)) {
        const mainTokens = extractMainTokens(searchQuery);
        
        if (mainTokens && mainTokens !== searchQuery.toLowerCase().trim()) {
          try {
            const expandedFoods = await fetchUSDASearch(
              mainTokens,
              apiKey,
              abortControllerRef.current.signal
            );
            
            // Merge results, avoiding duplicates
            const existingIds = new Set(foods.map(f => f.fdcId));
            const newFoods = expandedFoods.filter(f => !existingIds.has(f.fdcId));
            foods = [...foods, ...newFoods];
          } catch {
            // Expanded search failed, use original results
          }
        }
      }

      // Re-rank results using fuzzy matching
      const ranked = rerankResults(searchQuery, foods);
      
      // Filter out very low scoring results
      const filteredRanked = ranked.filter(r => r.score >= 0.3);
      
      // Extract just the items, sorted by score
      const sortedFoods = filteredRanked.map(r => r.item);

      // Check for "Did you mean" suggestion
      const suggestion = getDidYouMean(searchQuery, sortedFoods);
      setDidYouMean(suggestion);

      setResults(sortedFoods);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Food search error:', err);
      setError('Failed to search foods. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  // Debounced search with 400ms delay
  useEffect(() => {
    if (!isConfigured) return;
    
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchFoods(query);
      } else {
        setResults([]);
        setError(null);
        setDidYouMean(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, searchFoods, isConfigured]);

  const fetchFoodDetails = useCallback(async (fdcId: number): Promise<USDANutrients | null> => {
    if (!apiKey) return null;

    try {
      const url = new URL(`${USDA_API_BASE}/food/${fdcId}`);
      url.searchParams.set('api_key', apiKey);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: USDAFoodDetailsResponse = await response.json();
      return extractNutrientsFromDetails(data.foodNutrients);
    } catch (err) {
      console.error('USDA fetch details error:', err);
      return null;
    }
  }, [apiKey]);

  const applyDidYouMean = useCallback(() => {
    if (didYouMean) {
      setQuery(didYouMean);
    }
  }, [didYouMean]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    isConfigured,
    fetchFoodDetails,
    didYouMean,
    applyDidYouMean,
  };
}
