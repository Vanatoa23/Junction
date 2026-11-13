/**
 * Verbatim-quote check. Run this in code on EVERY classifier quote (Gemini or rule-based).
 * Whitespace is normalised (runs collapse to one space); case and punctuation must match exactly.
 */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export function verifyQuote(fetchedText: string, quote: string): boolean {
  const q = norm(quote);
  return q.length > 0 && norm(fetchedText).includes(q);
}
