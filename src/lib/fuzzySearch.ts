/**
 * Fuzzy search utilities for typo-tolerant food search
 */

// Common filler/stopwords to remove
const STOPWORDS = new Set([
  'raw', 'fresh', 'with', 'without', 'skin', 'cooked', 'prepared',
  'unprepared', 'uncooked', 'boiled', 'fried', 'baked', 'roasted',
  'grilled', 'steamed', 'the', 'a', 'an', 'and', 'or', 'of', 'in',
  'from', 'to', 'for', 'on', 'at', 'by', 'as', 'is', 'it', 'all',
  'only', 'meat', 'flesh', 'mature', 'immature', 'seeds', 'commercial',
  'varieties', 'usda', 'nfs', 'foundation', 'sr', 'legacy'
]);

/**
 * Normalize text for comparison
 * - lowercase
 * - remove punctuation
 * - collapse spaces
 * - remove stopwords
 * - singularize simple plurals
 */
export function normalizeText(str: string): string {
  let normalized = str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // remove punctuation
    .replace(/\s+/g, ' ')       // collapse spaces
    .trim();

  // Split into words, filter stopwords, singularize
  const words = normalized.split(' ')
    .filter(word => word.length > 0 && !STOPWORDS.has(word))
    .map(singularize);

  return words.join(' ');
}

/**
 * Simple singularization for common food plurals
 */
function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 4) {
    return word.slice(0, -3) + 'y'; // berries -> berry
  }
  if (word.endsWith('oes') && word.length > 4) {
    return word.slice(0, -2); // potatoes -> potato
  }
  if (word.endsWith('es') && word.length > 3) {
    // Check for common patterns
    const base = word.slice(0, -2);
    if (base.endsWith('ss') || base.endsWith('sh') || base.endsWith('ch') || base.endsWith('x')) {
      return base; // dishes -> dish
    }
    return word.slice(0, -1); // oranges -> orange
  }
  if (word.endsWith('s') && word.length > 2 && !word.endsWith('ss')) {
    return word.slice(0, -1); // apples -> apple
  }
  return word;
}

/**
 * Calculate Jaro-Winkler similarity between two strings
 * Returns 0-1 (1 = exact match)
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchDistance = Math.max(Math.floor(Math.max(s1.length, s2.length) / 2) - 1, 0);
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

  // Winkler modification: boost for common prefix
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Calculate similarity score between query and food name
 * Returns 0-1
 */
export function similarityScore(query: string, foodName: string): number {
  const normQuery = normalizeText(query);
  const normFood = normalizeText(foodName);

  if (normQuery.length === 0 || normFood.length === 0) return 0;

  // Exact match after normalization
  if (normQuery === normFood) return 1;

  // Check if query is contained in food name
  if (normFood.includes(normQuery)) return 0.95;

  // Check word-level matches
  const queryWords = normQuery.split(' ');
  const foodWords = normFood.split(' ');
  
  let wordMatchScore = 0;
  for (const qWord of queryWords) {
    let bestWordMatch = 0;
    for (const fWord of foodWords) {
      // Exact word match
      if (qWord === fWord) {
        bestWordMatch = 1;
        break;
      }
      // Prefix match (user typing partial word)
      if (fWord.startsWith(qWord) && qWord.length >= 3) {
        bestWordMatch = Math.max(bestWordMatch, 0.9);
      }
      // Jaro-Winkler for fuzzy word match
      const similarity = jaroWinklerSimilarity(qWord, fWord);
      if (similarity > 0.8) {
        bestWordMatch = Math.max(bestWordMatch, similarity * 0.85);
      }
    }
    wordMatchScore += bestWordMatch;
  }

  // Normalize by query word count
  const avgWordScore = wordMatchScore / queryWords.length;

  // Also compute full string similarity for short queries
  const fullStringSimilarity = jaroWinklerSimilarity(normQuery, normFood);

  // Return the better of the two approaches
  return Math.max(avgWordScore, fullStringSimilarity);
}

/**
 * Extract main search tokens from a potentially misspelled query
 * Returns first 1-2 significant words
 */
export function extractMainTokens(query: string): string {
  const normalized = normalizeText(query);
  const words = normalized.split(' ').filter(w => w.length >= 2);
  
  // Return first 1-2 words
  return words.slice(0, 2).join(' ');
}

export interface ScoredResult<T> {
  item: T;
  score: number;
  normalizedName: string;
}

/**
 * Re-rank results based on fuzzy similarity to query
 */
export function rerankResults<T extends { description: string }>(
  query: string,
  results: T[]
): ScoredResult<T>[] {
  const normQuery = normalizeText(query);
  
  const scored = results.map(item => {
    const score = similarityScore(query, item.description);
    const normalizedName = normalizeText(item.description);
    
    // Bonus for shorter names (less jargon)
    const lengthPenalty = Math.max(0, (item.description.length - 30) * 0.002);
    
    return {
      item,
      score: Math.max(0, score - lengthPenalty),
      normalizedName
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Determine if we should show a "Did you mean" suggestion
 * Returns the suggested term or null
 */
export function getDidYouMean<T extends { description: string }>(
  query: string,
  results: T[]
): string | null {
  if (results.length === 0 || query.length < 3) return null;

  const normQuery = normalizeText(query);
  const topResult = results[0];
  const topNormalized = normalizeText(topResult.description);

  // Check if query might be a typo of the top result
  const similarity = similarityScore(query, topResult.description);
  
  // If high similarity but query text differs significantly
  if (similarity >= 0.7 && similarity < 1) {
    // Extract the likely intended word from top result
    const topWords = topNormalized.split(' ');
    const queryWords = normQuery.split(' ');
    
    // Find best matching word that differs from query
    for (const qWord of queryWords) {
      for (const tWord of topWords) {
        const wordSim = jaroWinklerSimilarity(qWord, tWord);
        // Word is similar but not exact - likely a typo
        if (wordSim >= 0.75 && wordSim < 1 && qWord !== tWord && tWord.length >= 3) {
          // Suggest the correct word
          return tWord;
        }
      }
    }
  }

  return null;
}

/**
 * Check if results are "weak" (few results or low relevance)
 */
export function hasWeakResults<T extends { description: string }>(
  query: string,
  results: T[]
): boolean {
  if (results.length === 0) return true;
  if (results.length <= 2) return true;

  // Check if top results have low similarity
  const topScores = results.slice(0, 3).map(r => similarityScore(query, r.description));
  const avgTopScore = topScores.reduce((a, b) => a + b, 0) / topScores.length;

  return avgTopScore < 0.5;
}
