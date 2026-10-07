/**
 * Text fragments (https://wicg.github.io/scroll-to-text-fragment/): build a #:~:text= directive and simulate
 * how a browser resolves it, so we only emit links that highlight the intended passage.
 */

const EXACT_MAX_WORDS = 10;
const MIN_EDGE_WORDS = 3;

/** Percent-encode one directive term. "-", "&" and "," are syntax inside the directive and must be encoded. */
export function encodeTerm(term: string): string {
  return encodeURIComponent(term).replace(/-/g, "%2D");
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

function isBoundary(haystack: string, index: number): boolean {
  if (index <= 0 || index >= haystack.length) return true;
  return !(WORD_CHAR.test(haystack.charAt(index - 1)) && WORD_CHAR.test(haystack.charAt(index)));
}

/** First case-insensitive, word-bounded occurrence of term at or after from, not crossing a block break. */
export function findTerm(haystack: string, term: string, from: number): number {
  const lowerHay = haystack.toLowerCase();
  const lowerTerm = term.toLowerCase();
  let index = lowerHay.indexOf(lowerTerm, from);
  while (index !== -1) {
    const end = index + lowerTerm.length;
    if (isBoundary(haystack, index) && isBoundary(haystack, end)) return index;
    index = lowerHay.indexOf(lowerTerm, index + 1);
  }
  return -1;
}

export interface Resolved {
  readonly start: number;
  readonly end: number;
}

/** Simulate a browser: textStart, then the first textEnd after it. Text uses "\n" for block breaks. */
export function resolveDirective(text: string, startTerm: string, endTerm?: string): Resolved | undefined {
  const start = findTerm(text, startTerm, 0);
  if (start === -1) return undefined;
  if (endTerm === undefined) return { start, end: start + startTerm.length };
  const endAt = findTerm(text, endTerm, start + startTerm.length);
  return endAt === -1 ? undefined : { start, end: endAt + endTerm.length };
}

function sameText(a: string, b: string): boolean {
  const fold = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();
  return fold(a) === fold(b);
}

function edgeCandidates(quote: string): { first: string[]; last: string[] } {
  const blocks = quote.split("\n");
  const first = (blocks[0] ?? "").split(" ").filter(Boolean);
  const last = (blocks[blocks.length - 1] ?? "").split(" ").filter(Boolean);
  return { first, last };
}

function tryRange(text: string, quote: string, startTerm: string, endTerm: string): boolean {
  const hit = resolveDirective(text, startTerm, endTerm);
  return hit !== undefined && sameText(text.slice(hit.start, hit.end), quote);
}

function rangeDirective(text: string, quote: string): string | undefined {
  const { first, last } = edgeCandidates(quote);
  const singleBlock = !quote.includes("\n");
  const limit = Math.max(first.length, last.length);
  for (let words = MIN_EDGE_WORDS; words <= limit; words++) {
    const startWords = first.slice(0, Math.min(words, first.length));
    const endWords = last.slice(Math.max(0, last.length - words));
    // Edges covering nearly the whole quote are no shorter than the quote: the exact form is used instead.
    if (singleBlock && startWords.length + endWords.length > first.length - 2) break;
    const startTerm = startWords.join(" ");
    const endTerm = endWords.join(" ");
    if (tryRange(text, quote, startTerm, endTerm)) return `${encodeTerm(startTerm)},${encodeTerm(endTerm)}`;
  }
  return undefined;
}

/**
 * Build the directive for a quote exactly as it appears in the page text (with "\n" at block breaks).
 * Returns undefined when no directive would highlight this exact passage first.
 */
export function buildDirective(text: string, pageQuote: string): string | undefined {
  const wordCount = pageQuote.split(/\s+/).filter(Boolean).length;
  const singleBlock = !pageQuote.includes("\n");
  if (singleBlock && wordCount <= EXACT_MAX_WORDS) {
    const hit = resolveDirective(text, pageQuote);
    if (hit && sameText(text.slice(hit.start, hit.end), pageQuote)) return encodeTerm(pageQuote);
  }
  const range = rangeDirective(text, pageQuote);
  if (range) return range;
  if (singleBlock && resolveDirective(text, pageQuote)) return encodeTerm(pageQuote);
  return undefined;
}

/** Append a text directive to a URL, keeping any existing #anchor. */
export function withDirective(url: string, directive: string): string {
  const parsed = new URL(url);
  const anchor = parsed.hash.replace(/^#/, "").split(":~:")[0] ?? "";
  parsed.hash = "";
  return `${parsed.href}#${anchor}:~:text=${directive}`;
}
