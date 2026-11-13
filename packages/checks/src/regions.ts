/**
 * Nested-region helper (STUB-LEVEL; Engine owns tests and refinement).
 * Regions nest by "-": "FI" covers "FI-UUS". Comparison is case-insensitive.
 */
const norm = (r: string) => r.trim().toUpperCase();

/** True if `outer` equals `inner` or is an ancestor of it. */
export function regionCovers(outer: string, inner: string): boolean {
  const o = norm(outer);
  const i = norm(inner);
  return o === i || i.startsWith(o + "-");
}

/** True if either region covers the other (they overlap geographically). */
export function regionsOverlap(a: string, b: string): boolean {
  return regionCovers(a, b) || regionCovers(b, a);
}
