/**
 * Food synonyms for query expansion
 * Maps common alternative terms to standard search terms
 */

export const FOOD_SYNONYMS: Record<string, string[]> = {
  // Beverages
  'coke': ['coca cola', 'cola'],
  'pepsi': ['cola', 'soda'],
  'soda': ['soft drink', 'cola', 'pop'],
  'pop': ['soda', 'soft drink'],
  'juice': ['fruit juice'],
  
  // Snacks & Sides
  'fries': ['french fries', 'potato fries'],
  'french fries': ['fries', 'chips'],
  'chips': ['crisps', 'potato chips'],
  'crisps': ['chips', 'potato chips'],
  
  // Dairy
  'yoghurt': ['yogurt'],
  'yogurt': ['yoghurt'],
  'greek yoghurt': ['greek yogurt'],
  'greek yogurt': ['greek yoghurt'],
  
  // Meat
  'minced beef': ['ground beef'],
  'ground beef': ['minced beef', 'beef mince'],
  'minced meat': ['ground meat'],
  'ground meat': ['minced meat'],
  'mince': ['ground beef', 'ground meat'],
  'bacon': ['pork bacon', 'bacon strips'],
  'ham': ['pork ham'],
  
  // Breakfast
  'oats': ['oatmeal', 'rolled oats'],
  'oatmeal': ['oats', 'porridge'],
  'porridge': ['oatmeal', 'oats'],
  
  // Supplements & Shakes
  'protein shake': ['shake', 'whey shake', 'protein powder'],
  'whey': ['whey protein', 'protein powder'],
  'shake': ['protein shake', 'milkshake'],
  
  // Common foods
  'tater tots': ['potato tots', 'hash brown bites'],
  'hash browns': ['shredded potatoes', 'hash brown'],
  'pb': ['peanut butter'],
  'peanut butter': ['pb', 'nut butter'],
  'almond milk': ['almond beverage'],
  'oat milk': ['oat beverage'],
  
  // Fast food
  'burger': ['hamburger', 'beef burger'],
  'hamburger': ['burger', 'beef patty'],
  'hot dog': ['frankfurter', 'wiener'],
  'pizza': ['cheese pizza', 'pizza pie'],
  
  // Vegetables
  'aubergine': ['eggplant'],
  'eggplant': ['aubergine'],
  'courgette': ['zucchini'],
  'zucchini': ['courgette'],
  'capsicum': ['bell pepper', 'pepper'],
  'bell pepper': ['capsicum', 'sweet pepper'],
  'rocket': ['arugula'],
  'arugula': ['rocket'],
  'coriander': ['cilantro'],
  'cilantro': ['coriander'],
  'spring onion': ['scallion', 'green onion'],
  'scallion': ['spring onion', 'green onion'],
  'green onion': ['scallion', 'spring onion'],
  'corn': ['maize', 'sweet corn'],
  'sweetcorn': ['corn', 'sweet corn'],
  
  // Grains
  'pasta': ['noodles', 'spaghetti'],
  'noodles': ['pasta'],
  'rice': ['white rice'],
  
  // Seafood
  'prawns': ['shrimp'],
  'shrimp': ['prawns'],
  
  // Sweets
  'candy': ['sweets', 'lollies'],
  'sweets': ['candy'],
  'biscuit': ['cookie'],
  'cookie': ['biscuit'],
  'biscuits': ['cookies'],
  'cookies': ['biscuits'],
};

/**
 * Get synonym expansions for a query
 * Returns array of alternative search terms
 */
export function getSynonymExpansions(query: string): string[] {
  const lowerQuery = query.toLowerCase().trim();
  const expansions: string[] = [];
  
  // Direct lookup
  if (FOOD_SYNONYMS[lowerQuery]) {
    expansions.push(...FOOD_SYNONYMS[lowerQuery]);
  }
  
  // Check if query contains any synonym keys
  for (const [key, synonyms] of Object.entries(FOOD_SYNONYMS)) {
    if (lowerQuery.includes(key) && key !== lowerQuery) {
      // Replace the synonym key with alternatives
      for (const syn of synonyms) {
        const expanded = lowerQuery.replace(key, syn);
        if (!expansions.includes(expanded)) {
          expansions.push(expanded);
        }
      }
    }
  }
  
  return expansions;
}
