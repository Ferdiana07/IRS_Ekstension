// ============================================================
// Utils: Text Normalization
// ============================================================

/**
 * Normalize text for case-insensitive comparison.
 * Strips leading/trailing whitespace and converts to lowercase.
 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check whether `haystack` contains any of the `needles` (normalized).
 */
export function containsAny(haystack: string, needles: readonly string[]): boolean {
  const h = normalizeText(haystack);
  return needles.some((n) => h.includes(normalizeText(n)));
}

/**
 * Parse a quota string like "29/30" or "0 / 50" into { current, capacity }.
 * Returns null if the format is not recognized.
 */
export function parseQuota(text: string): { current: number; capacity: number } | null {
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  const current = parseInt(match[1], 10);
  const capacity = parseInt(match[2], 10);
  if (isNaN(current) || isNaN(capacity)) return null;
  return { current, capacity };
}

/**
 * Loosely compare two course names, ignoring case, spaces, and common abbreviations.
 * Returns a similarity score 0–1. Threshold for "match" is 0.6.
 */
export function courseNameSimilarity(a: string, b: string): number {
  const na = normalizeText(a).replace(/[^a-z0-9]/g, '');
  const nb = normalizeText(b).replace(/[^a-z0-9]/g, '');
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  // Bigram similarity
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const setA = bigrams(na);
  const setB = bigrams(nb);
  let intersection = 0;
  setA.forEach((bg) => { if (setB.has(bg)) intersection++; });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Compare class labels, e.g. "A" === "a", "Kelas A" ≈ "A".
 */
export function classMatches(detected: string, target: string): boolean {
  const extract = (s: string) =>
    normalizeText(s).replace(/kelas\s*/i, '').replace(/\s/g, '');
  return extract(detected) === extract(target);
}
