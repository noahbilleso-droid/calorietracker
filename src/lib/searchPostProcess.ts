/**
 * Post-processing for USDA search results:
 * - Smart display name generation
 * - Deduplication by normalized name
 * - Query-aware ranking
 * - Result limiting
 */

import { USDANutrients } from '@/hooks/useUSDASearch';
import { getDefaultServing, DefaultServing } from './servingSizes';

export interface ProcessedFoodResult {
  fdcId: number;
  description: string;         // Original USDA description
  displayName: string;         // Clean, human-friendly name
  subtext: string | null;      // e.g. "raw, with skin"
  foodCategory?: string;
  nutrients: USDANutrients;    // per 100g
  defaultServing: DefaultServing | null;
  servingNutrients: USDANutrients | null; // scaled to default serving
}

// ──── Display name cleaning ────

/** Phrases to strip entirely */
const STRIP_PATTERNS = [
  /\b(NFS|USDA|UPC|SR Legacy|Foundation|nfs)\b/gi,
  /\b(commercial(ly)?|industrial(ly)?)\b/gi,
  /\b(includes usda commodity food[s]?)\b/gi,
  /\b(all (commercial )?varieties)\b/gi,
  /\b(separable lean (and|&) fat)\b/gi,
  /\b(meat (and|&) skin|meat only|skin only|flesh only)\b/gi,
  /\b(broilers? or fryers?|broiler|fryer|roaster)\b/gi,
  /\b(mature seeds|immature seeds)\b/gi,
  /\b(from concentrate|not from concentrate)\b/gi,
];

/** Cooking methods to extract as subtext */
const COOKING_METHODS = /\b(raw|fresh|cooked|boiled|baked|roasted|grilled|steamed|fried|toasted|braised|sauteed|microwaved|stewed|smoked|cured|dried|dehydrated|frozen|canned)\b/gi;

/** Qualifiers to extract as subtext */
const QUALIFIERS = /\b(with skin|without skin|salted|unsalted|sweetened|unsweetened|enriched|unenriched|fortified|unfortified|bleached|unbleached)\b/gi;

/**
 * Turn a raw USDA description into a clean display name.
 * E.g. "Bread, white, commercially prepared, toasted" → "White Bread"
 *       subtext: "toasted, commercially prepared"
 *
 * When the user searched "toast", the query-aware logic keeps "toast" in the title.
 */
export function buildDisplayName(
  description: string,
  query: string,
): { displayName: string; subtext: string | null } {
  const queryLower = query.toLowerCase().trim();
  const isToastQuery = /\btoast\b/.test(queryLower);

  let working = description;
  const subtextParts: string[] = [];

  // Extract cooking methods & qualifiers into subtext
  const cookMatches = working.match(COOKING_METHODS) || [];
  const qualMatches = working.match(QUALIFIERS) || [];
  subtextParts.push(...cookMatches.map(s => s.toLowerCase()));
  subtextParts.push(...qualMatches.map(s => s.toLowerCase()));

  // Strip junk
  for (const pat of STRIP_PATTERNS) {
    working = working.replace(pat, ' ');
  }
  // Remove cooking methods & qualifiers from main title
  working = working.replace(COOKING_METHODS, ' ');
  working = working.replace(QUALIFIERS, ' ');

  // Clean commas, spaces
  working = working
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,|,\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split comma parts and reverse for more natural order
  // USDA: "Bread, white, commercially prepared" → parts: ["Bread", "white"]
  const parts = working.split(',').map(p => p.trim()).filter(Boolean);

  let title: string;
  if (parts.length >= 2) {
    // Reverse: "white" + "Bread" → "White Bread"
    const [basePart, ...modifiers] = parts;
    title = [...modifiers, basePart].map(capitalizeWord).join(' ');
  } else {
    title = parts.map(capitalizeWord).join(' ');
  }

  // Query-aware adjustments
  if (isToastQuery && subtextParts.includes('toasted')) {
    // Replace "Bread" with "Toast" in title when user searched for toast
    title = title.replace(/\bBread\b/i, 'Toast');
    // Remove "toasted" from subtext since it's now in the title
    const idx = subtextParts.indexOf('toasted');
    if (idx !== -1) subtextParts.splice(idx, 1);
  }

  // Build subtext
  const uniqueSubtext = [...new Set(subtextParts)].filter(Boolean).slice(0, 3);
  const subtext = uniqueSubtext.length > 0 ? uniqueSubtext.join(', ') : null;

  return { displayName: title || description, subtext };
}

function capitalizeWord(str: string): string {
  return str.trim().split(/\s+/).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ');
}

// ──── Deduplication ────

/** Normalize a name for dedup comparison */
function normalizeForDedup(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ──── Main post-processing pipeline ────

interface RawFoodResult {
  fdcId: number;
  description: string;
  foodCategory?: string;
  nutrients: USDANutrients;
}

export function postProcessResults(
  rawResults: RawFoodResult[],
  query: string,
  maxResults = 8,
): ProcessedFoodResult[] {
  const queryLower = query.toLowerCase().trim();

  // 1. Build display names
  const withDisplay = rawResults.map(item => {
    const { displayName, subtext } = buildDisplayName(item.description, query);
    const defaultServing = getDefaultServing(displayName) || getDefaultServing(item.description);
    let servingNutrients: USDANutrients | null = null;
    if (defaultServing) {
      const scale = defaultServing.grams / 100;
      servingNutrients = {
        calories: Math.round(item.nutrients.calories * scale),
        protein: Math.round(item.nutrients.protein * scale * 10) / 10,
        carbs: Math.round(item.nutrients.carbs * scale * 10) / 10,
        fat: Math.round(item.nutrients.fat * scale * 10) / 10,
      };
    }
    return {
      ...item,
      displayName,
      subtext,
      defaultServing,
      servingNutrients,
      _normKey: normalizeForDedup(displayName),
    };
  });

  // 2. Deduplicate by normalized display name (keep best-scoring)
  const seen = new Map<string, typeof withDisplay[0]>();
  for (const item of withDisplay) {
    const existing = seen.get(item._normKey);
    if (!existing) {
      seen.set(item._normKey, item);
    } else {
      // Keep the one with more complete nutrient data
      const existingScore = nutrientCompleteness(existing.nutrients);
      const newScore = nutrientCompleteness(item.nutrients);
      if (newScore > existingScore) {
        seen.set(item._normKey, item);
      }
    }
  }

  let deduped = Array.from(seen.values());

  // 3. Query-aware ranking
  deduped.sort((a, b) => {
    const scoreA = relevanceScore(a.displayName, a.description, queryLower);
    const scoreB = relevanceScore(b.displayName, b.description, queryLower);
    return scoreB - scoreA; // Higher is better
  });

  // 4. Filter out irrelevant items (e.g. crackers when searching toast)
  if (/\btoast\b/i.test(queryLower)) {
    deduped = deduped.filter(item => {
      const desc = item.description.toLowerCase();
      // Keep bread/toast items, filter obvious non-matches
      if (/\bcracker/i.test(desc) && !/toast/i.test(desc)) return false;
      return true;
    });
  }

  // 5. Limit results
  return deduped.slice(0, maxResults).map(({ _normKey, ...rest }) => rest);
}

function nutrientCompleteness(n: USDANutrients): number {
  let score = 0;
  if (n.calories > 0) score++;
  if (n.protein > 0) score++;
  if (n.carbs > 0) score++;
  if (n.fat > 0) score++;
  return score;
}

function relevanceScore(displayName: string, rawDescription: string, queryLower: string): number {
  const nameLower = displayName.toLowerCase();
  const descLower = rawDescription.toLowerCase();
  let score = 0;

  // Exact query in display name → big boost
  if (nameLower.includes(queryLower)) score += 100;

  // Query words present in display name
  const queryWords = queryLower.split(/\s+/);
  for (const w of queryWords) {
    if (nameLower.includes(w)) score += 30;
  }

  // Prefer shorter, simpler names
  score -= displayName.length * 0.3;

  // Boost items with "toasted" when query is toast
  if (/\btoast\b/.test(queryLower) && /\btoast(ed)?\b/i.test(descLower)) {
    score += 50;
  }

  // Penalize very long USDA descriptions (scientific/compound entries)
  if (rawDescription.length > 80) score -= 20;

  return score;
}
