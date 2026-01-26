import { useState, useEffect, useCallback } from 'react';

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
  const nutrients: USDANutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (!foodNutrients) return nutrients;
  
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

export function useUSDASearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<USDAFood & { nutrients: USDANutrients }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  const apiKey = import.meta.env.VITE_USDA_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setIsConfigured(false);
      setError('USDA food search not configured');
    }
  }, [apiKey]);

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!apiKey) {
      setIsConfigured(false);
      return;
    }

    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${USDA_API_BASE}/foods/search`);
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('query', searchQuery);
      url.searchParams.set('dataType', 'Foundation');
      url.searchParams.set('pageSize', '25');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: USDASearchResponse = await response.json();
      
      const foods = data.foods.map(food => ({
        fdcId: food.fdcId,
        description: food.description,
        foodCategory: food.foodCategory,
        nutrients: extractNutrientsFromSearch(food.foodNutrients),
      }));

      setResults(foods);
    } catch (err) {
      console.error('USDA search error:', err);
      setError('Failed to search foods');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  // Debounced search
  useEffect(() => {
    if (!isConfigured) return;
    
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchFoods(query);
      } else {
        setResults([]);
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

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    isConfigured,
    fetchFoodDetails,
  };
}
