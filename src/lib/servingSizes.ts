/**
 * Default serving sizes for common foods.
 * Maps normalized food keywords to a human-friendly serving description and grams.
 */

export interface DefaultServing {
  label: string;  // e.g. "1 slice"
  grams: number;  // e.g. 28
}

/**
 * Lookup table: keyword → default serving.
 * Checked in order; first match wins.
 */
const SERVING_RULES: Array<{ pattern: RegExp; serving: DefaultServing }> = [
  // Bread & toast
  { pattern: /\btoast\b/i, serving: { label: '1 slice', grams: 28 } },
  { pattern: /\bbread\b/i, serving: { label: '1 slice', grams: 30 } },
  { pattern: /\bbagel\b/i, serving: { label: '1 bagel', grams: 95 } },
  { pattern: /\btortilla\b/i, serving: { label: '1 tortilla', grams: 45 } },
  { pattern: /\bmuffin\b/i, serving: { label: '1 muffin', grams: 57 } },
  { pattern: /\bcroissant\b/i, serving: { label: '1 croissant', grams: 57 } },

  // Eggs
  { pattern: /\begg\b/i, serving: { label: '1 large egg', grams: 50 } },

  // Fruits
  { pattern: /\bapple\b/i, serving: { label: '1 medium', grams: 182 } },
  { pattern: /\bbanana\b/i, serving: { label: '1 medium', grams: 118 } },
  { pattern: /\borange\b/i, serving: { label: '1 medium', grams: 131 } },
  { pattern: /\bstrawberr/i, serving: { label: '1 cup', grams: 152 } },
  { pattern: /\bblueberr/i, serving: { label: '1 cup', grams: 148 } },
  { pattern: /\bgrape\b/i, serving: { label: '1 cup', grams: 151 } },
  { pattern: /\bavocado\b/i, serving: { label: '½ avocado', grams: 68 } },

  // Dairy
  { pattern: /\bmilk\b/i, serving: { label: '1 cup', grams: 244 } },
  { pattern: /\byogurt\b/i, serving: { label: '1 cup', grams: 245 } },
  { pattern: /\bcheese\b/i, serving: { label: '1 slice', grams: 28 } },
  { pattern: /\bbutter\b/i, serving: { label: '1 tbsp', grams: 14 } },

  // Protein
  { pattern: /\bchicken breast\b/i, serving: { label: '1 breast', grams: 120 } },
  { pattern: /\bchicken thigh\b/i, serving: { label: '1 thigh', grams: 90 } },
  { pattern: /\bchicken wing\b/i, serving: { label: '1 wing', grams: 34 } },
  { pattern: /\bchicken\b/i, serving: { label: '1 serving', grams: 120 } },
  { pattern: /\bbeef\b/i, serving: { label: '1 serving', grams: 113 } },
  { pattern: /\bsalmon\b/i, serving: { label: '1 fillet', grams: 113 } },
  { pattern: /\btuna\b/i, serving: { label: '1 can', grams: 142 } },
  { pattern: /\bbacon\b/i, serving: { label: '2 slices', grams: 16 } },

  // Grains
  { pattern: /\brice\b/i, serving: { label: '1 cup cooked', grams: 158 } },
  { pattern: /\bpasta\b/i, serving: { label: '1 cup cooked', grams: 140 } },
  { pattern: /\boats\b|oatmeal|porridge/i, serving: { label: '½ cup dry', grams: 40 } },

  // Snacks
  { pattern: /\bpeanut butter\b/i, serving: { label: '2 tbsp', grams: 32 } },
  { pattern: /\balmond/i, serving: { label: '¼ cup', grams: 35 } },
  { pattern: /\bwalnut/i, serving: { label: '¼ cup', grams: 30 } },

  // Beverages
  { pattern: /\bjuice\b/i, serving: { label: '1 cup', grams: 248 } },
];

/**
 * Look up a default serving size for a food description or cleaned name.
 * Returns null if no match is found (caller should default to 100g).
 */
export function getDefaultServing(foodName: string): DefaultServing | null {
  const lower = foodName.toLowerCase();
  for (const rule of SERVING_RULES) {
    if (rule.pattern.test(lower)) {
      return rule.serving;
    }
  }
  return null;
}
