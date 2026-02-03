/**
 * Utilities for cleaning and normalizing USDA food names
 * to create human-friendly display names
 */

// Filler words/phrases to remove from main title
const FILLER_PATTERNS = [
  /\b(raw|fresh|unprepared|uncooked|cooked|prepared|boiled|baked|roasted|grilled|steamed|fried)\b/gi,
  /\b(with skin|without skin|skin only|flesh only)\b/gi,
  /\b(usda|nfs|foundation|sr legacy)\b/gi,
  /\b(broilers or fryers|broiler|fryer|roaster)\b/gi,
  /\b(mature seeds|immature seeds|seeds)\b/gi,
  /\b(meat only|meat and skin|separable lean and fat)\b/gi,
  /\b(all commercial varieties|all varieties|commercial)\b/gi,
  /\b(includes usda commodity food)\b/gi,
  /\b(from concentrate|not from concentrate)\b/gi,
  /,\s*,/g, // double commas
  /\s+/g, // multiple spaces
];

// Suffix patterns to extract as subtext
const SUBTEXT_PATTERNS = [
  /\b(raw|fresh|cooked|boiled|baked|roasted|grilled|steamed|fried)\b/gi,
  /\b(with skin|without skin)\b/gi,
  /\b(canned|frozen|dried|dehydrated)\b/gi,
  /\b(salted|unsalted|sweetened|unsweetened)\b/gi,
];

// Common variety names to detect
const VARIETY_PATTERNS: Record<string, RegExp> = {
  // Apples
  'Fuji': /\bfuji\b/i,
  'Gala': /\bgala\b/i,
  'Honeycrisp': /\bhoneycrisp\b/i,
  'Granny Smith': /\bgranny\s*smith\b/i,
  'Red Delicious': /\bred\s*delicious\b/i,
  'Golden Delicious': /\bgolden\s*delicious\b/i,
  'McIntosh': /\bmcintosh\b/i,
  'Braeburn': /\bbraeburn\b/i,
  'Pink Lady': /\bpink\s*lady\b/i,
  // Oranges
  'Navel': /\bnavel\b/i,
  'Valencia': /\bvalencia\b/i,
  'Blood Orange': /\bblood\s*orange\b/i,
  // Bananas
  'Plantain': /\bplantain\b/i,
  // Grapes
  'Red': /\bred\s*(grapes?|seedless)?\b/i,
  'Green': /\bgreen\s*(grapes?|seedless)?\b/i,
  'Thompson': /\bthompson\b/i,
  // Chicken
  'Breast': /\bbreast\b/i,
  'Thigh': /\bthigh\b/i,
  'Wing': /\bwing\b/i,
  'Drumstick': /\bdrumstick\b/i,
  'Ground': /\bground\b/i,
  // Beef
  'Sirloin': /\bsirloin\b/i,
  'Ribeye': /\bribeye\b/i,
  'Chuck': /\bchuck\b/i,
  'Tenderloin': /\btenderloin\b/i,
  // Rice
  'White': /\bwhite\b/i,
  'Brown': /\bbrown\b/i,
  'Basmati': /\bbasmati\b/i,
  'Jasmine': /\bjasmine\b/i,
  // Potatoes
  'Russet': /\brusset\b/i,
  'Yukon Gold': /\byukon\s*gold\b/i,
  'Red Potato': /\bred\s*potato\b/i,
  'Sweet': /\bsweet\b/i,
};

// Base food extraction patterns
const BASE_FOOD_EXTRACTIONS: Array<[RegExp, string]> = [
  [/\bapples?\b/i, 'apple'],
  [/\boranges?\b/i, 'orange'],
  [/\bbananas?\b/i, 'banana'],
  [/\bgrapes?\b/i, 'grape'],
  [/\bstrawberr(y|ies)\b/i, 'strawberry'],
  [/\bblueberr(y|ies)\b/i, 'blueberry'],
  [/\braspberr(y|ies)\b/i, 'raspberry'],
  [/\bchicken\s*breast\b/i, 'chicken breast'],
  [/\bchicken\s*thigh\b/i, 'chicken thigh'],
  [/\bchicken\s*wing\b/i, 'chicken wing'],
  [/\bchicken\b/i, 'chicken'],
  [/\bbeef\b/i, 'beef'],
  [/\bpork\b/i, 'pork'],
  [/\bsalmon\b/i, 'salmon'],
  [/\btuna\b/i, 'tuna'],
  [/\beggs?\b/i, 'egg'],
  [/\bmilk\b/i, 'milk'],
  [/\byogurt\b/i, 'yogurt'],
  [/\bcheese\b/i, 'cheese'],
  [/\bbread\b/i, 'bread'],
  [/\brice\b/i, 'rice'],
  [/\bpasta\b/i, 'pasta'],
  [/\bpotato(es)?\b/i, 'potato'],
  [/\bcarrots?\b/i, 'carrot'],
  [/\bbroccoli\b/i, 'broccoli'],
  [/\bspinach\b/i, 'spinach'],
  [/\btomato(es)?\b/i, 'tomato'],
  [/\bonions?\b/i, 'onion'],
  [/\bavocado\b/i, 'avocado'],
  [/\balmonds?\b/i, 'almond'],
  [/\bpeanuts?\b/i, 'peanut'],
  [/\bwalnuts?\b/i, 'walnut'],
  [/\boats?\b/i, 'oats'],
  [/\bquinoa\b/i, 'quinoa'],
];

/**
 * Extract the base food name for grouping purposes
 */
export function getBaseFoodKey(description: string): string {
  const lower = description.toLowerCase();
  
  for (const [pattern, baseName] of BASE_FOOD_EXTRACTIONS) {
    if (pattern.test(lower)) {
      return baseName;
    }
  }
  
  // Fallback: use first word(s) before comma, cleaned up
  const firstPart = description.split(',')[0].trim().toLowerCase();
  // Remove trailing 's' for simple plurals
  return firstPart.replace(/s$/, '');
}

/**
 * Extract variety name if present
 */
export function extractVariety(description: string): string | null {
  for (const [variety, pattern] of Object.entries(VARIETY_PATTERNS)) {
    if (pattern.test(description)) {
      return variety;
    }
  }
  return null;
}

/**
 * Clean the display name to be human-friendly
 * Returns title and optional subtext
 */
export function cleanDisplayName(description: string, query?: string): string {
  const { title } = getDisplayParts(description, query);
  return title;
}

/**
 * Get display parts (title + subtext) for improved presentation
 */
export function getDisplayParts(description: string, query?: string): { title: string; subtext: string | null } {
  let cleaned = description;
  const subtextParts: string[] = [];
  
  // Extract subtext-worthy parts before removing
  for (const pattern of SUBTEXT_PATTERNS) {
    const matches = description.match(pattern);
    if (matches) {
      subtextParts.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  // Apply all filler patterns
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Clean up commas and extra spaces
  cleaned = cleaned
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .replace(/^\s*,/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split by comma, take meaningful parts
  const parts = cleaned.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { title: description, subtext: null };
  }
  
  // Capitalize first letter of each word in first part
  let mainFood = capitalizeWords(parts[0]);
  
  // Check for variety
  const variety = extractVariety(description);
  const queryLower = query?.toLowerCase() || '';
  
  // Only show variety in title if user queried for it
  const userWantsVariety = variety && queryLower.includes(variety.toLowerCase());
  
  if (variety && userWantsVariety) {
    // User asked for this variety, show it prominently
    mainFood = `${mainFood} (${variety})`;
  } else if (variety && !userWantsVariety) {
    // User didn't ask for variety, add it to subtext instead
    subtextParts.unshift(variety.toLowerCase());
  }
  
  // Build subtext from collected parts
  const uniqueSubtext = [...new Set(subtextParts)].slice(0, 3);
  const subtext = uniqueSubtext.length > 0 ? uniqueSubtext.join(', ') : null;
  
  return { title: mainFood, subtext };
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a result is "generic" (no specific variety)
 */
export function isGenericResult(description: string): boolean {
  const variety = extractVariety(description);
  return variety === null;
}

/**
 * Calculate a ranking score (lower is better)
 */
export function calculateRankScore(description: string, query: string): number {
  const cleanedName = cleanDisplayName(description);
  const queryLower = query.toLowerCase();
  const descLower = description.toLowerCase();
  
  let score = 0;
  
  // Prefer shorter cleaned names
  score += cleanedName.length * 0.5;
  
  // Prefer generic results
  if (!isGenericResult(description)) {
    score += 50;
  }
  
  // Boost exact base food matches
  const baseFood = getBaseFoodKey(description);
  if (queryLower.includes(baseFood) || baseFood.includes(queryLower)) {
    score -= 30;
  }
  
  // If query contains a variety name, boost that variety
  for (const [variety, pattern] of Object.entries(VARIETY_PATTERNS)) {
    if (pattern.test(query) && pattern.test(description)) {
      score -= 100; // Big boost for matching user-requested variety
    }
  }
  
  // Penalize very long descriptions (scientific names, etc.)
  if (description.length > 60) {
    score += 20;
  }
  
  return score;
}

export interface GroupedFoodResult<T> {
  key: string;
  displayName: string;
  mainItem: T;
  variants: T[];
  hasVariants: boolean;
}

/**
 * Group and sort food results for display
 */
export function groupFoodResults<T extends { description: string }>(
  results: T[],
  query: string
): GroupedFoodResult<T>[] {
  // First, score and sort all results
  const scored = results.map(item => ({
    item,
    score: calculateRankScore(item.description, query),
    baseKey: getBaseFoodKey(item.description),
    isGeneric: isGenericResult(item.description),
  }));
  
  scored.sort((a, b) => a.score - b.score);
  
  // Group by base food key
  const groups = new Map<string, typeof scored>();
  
  for (const entry of scored) {
    const existing = groups.get(entry.baseKey);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(entry.baseKey, [entry]);
    }
  }
  
  // Convert to grouped results
  const groupedResults: GroupedFoodResult<T>[] = [];
  
  for (const [key, entries] of groups) {
    // Sort within group: generic first, then by score
    entries.sort((a, b) => {
      if (a.isGeneric && !b.isGeneric) return -1;
      if (!a.isGeneric && b.isGeneric) return 1;
      return a.score - b.score;
    });
    
    const mainItem = entries[0].item;
    const variants = entries.slice(1).map(e => e.item);
    
    groupedResults.push({
      key,
      displayName: cleanDisplayName(mainItem.description),
      mainItem,
      variants,
      hasVariants: variants.length > 0,
    });
  }
  
  // Sort groups by their main item's score
  groupedResults.sort((a, b) => {
    const scoreA = calculateRankScore(a.mainItem.description, query);
    const scoreB = calculateRankScore(b.mainItem.description, query);
    return scoreA - scoreB;
  });
  
  return groupedResults;
}
