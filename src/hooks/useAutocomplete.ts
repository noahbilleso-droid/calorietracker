import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { COMMON_FOODS } from '@/lib/commonFoods';
import { jaroWinklerSimilarity, normalizeText } from '@/lib/fuzzySearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AutocompleteSuggestion {
  text: string;
  source: 'dictionary' | 'recent';
}

// Pre-process common foods for faster lookup
const normalizedCommonFoods = COMMON_FOODS.map(food => ({
  original: food,
  normalized: normalizeText(food),
}));

/**
 * Hook for autocomplete suggestions with fuzzy matching
 */
export function useAutocomplete() {
  const { session } = useAuth();
  const [recentFoods, setRecentFoods] = useState<string[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const fetchedRef = useRef(false);

  // Fetch recent foods for the user
  useEffect(() => {
    if (!session?.user?.id || fetchedRef.current) return;
    
    const fetchRecentFoods = async () => {
      setIsLoadingRecent(true);
      try {
        const { data, error } = await supabase
          .from('food_entries')
          .select('name')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Get unique food names
        const uniqueNames = [...new Set(data?.map(d => d.name) || [])];
        setRecentFoods(uniqueNames.slice(0, 20));
        fetchedRef.current = true;
      } catch (err) {
        console.error('Failed to fetch recent foods:', err);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchRecentFoods();
  }, [session?.user?.id]);

  // Pre-process recent foods for matching
  const normalizedRecentFoods = useMemo(() => 
    recentFoods.map(food => ({
      original: food,
      normalized: normalizeText(food),
    })),
    [recentFoods]
  );

  /**
   * Get autocomplete suggestions for input
   */
  const getSuggestions = useCallback((input: string, maxResults: number = 6): AutocompleteSuggestion[] => {
    if (input.length < 2) return [];

    const normalizedInput = normalizeText(input);
    if (!normalizedInput) return [];

    const results: Array<{ text: string; score: number; source: 'dictionary' | 'recent' }> = [];
    const seenLower = new Set<string>();

    // Search recent foods first (higher priority)
    for (const { original, normalized } of normalizedRecentFoods) {
      const lowerOriginal = original.toLowerCase();
      if (seenLower.has(lowerOriginal)) continue;

      // Check prefix match
      if (normalized.startsWith(normalizedInput)) {
        results.push({ text: original, score: 1.0, source: 'recent' });
        seenLower.add(lowerOriginal);
        continue;
      }

      // Check contains
      if (normalized.includes(normalizedInput)) {
        results.push({ text: original, score: 0.9, source: 'recent' });
        seenLower.add(lowerOriginal);
        continue;
      }

      // Fuzzy match
      const similarity = jaroWinklerSimilarity(normalizedInput, normalized);
      if (similarity >= 0.75) {
        results.push({ text: original, score: similarity * 0.95, source: 'recent' });
        seenLower.add(lowerOriginal);
      }
    }

    // Search dictionary
    for (const { original, normalized } of normalizedCommonFoods) {
      const lowerOriginal = original.toLowerCase();
      if (seenLower.has(lowerOriginal)) continue;

      // Check prefix match
      if (normalized.startsWith(normalizedInput)) {
        results.push({ text: original, score: 0.95, source: 'dictionary' });
        seenLower.add(lowerOriginal);
        continue;
      }

      // Check word-level prefix (e.g., "chi" matches "chicken breast")
      const normalizedWords = normalized.split(' ');
      const inputWords = normalizedInput.split(' ');
      let wordMatch = false;
      
      for (const inputWord of inputWords) {
        for (const normWord of normalizedWords) {
          if (normWord.startsWith(inputWord) && inputWord.length >= 2) {
            wordMatch = true;
            break;
          }
        }
        if (wordMatch) break;
      }
      
      if (wordMatch) {
        results.push({ text: original, score: 0.85, source: 'dictionary' });
        seenLower.add(lowerOriginal);
        continue;
      }

      // Fuzzy match for typos
      const similarity = jaroWinklerSimilarity(normalizedInput, normalized);
      if (similarity >= 0.78) {
        results.push({ text: original, score: similarity * 0.8, source: 'dictionary' });
        seenLower.add(lowerOriginal);
      }
    }

    // Sort by score descending, then by length (prefer shorter)
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) > 0.05) {
        return b.score - a.score;
      }
      return a.text.length - b.text.length;
    });

    return results.slice(0, maxResults).map(r => ({
      text: r.text,
      source: r.source,
    }));
  }, [normalizedRecentFoods]);

  return {
    getSuggestions,
    recentFoods,
    isLoadingRecent,
  };
}
