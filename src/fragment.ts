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

/** First case-insensitive, word-bounded occurrence of term at or after from. A term without "\n" never crosses a block break. */
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

/** First occurrence of the whole quote: where a correct directive must land. */
function locateTarget(text: string, quote: string): Resolved | undefined {
  const start = findTerm(text, quote, 0);
  return start === -1 ? undefined : { start, end: start + quote.length };
}

function words(block: string): string[] {
  return block.split(" ").filter(Boolean);
}

/** Fewest leading words whose first occurrence is the target start. */
function minimalStart(text: string, edge: readonly string[], target: Resolved): string | undefined {
  for (let count = Math.min(MIN_EDGE_WORDS, edge.length); count <= edge.length; count++) {
    const term = edge.slice(0, count).join(" ");
    if (findTerm(text, term, 0) === target.start) return term;
  }
  return undefined;
}

/** Fewest trailing words whose first occurrence after the start term ends exactly at the target end. */
function minimalEnd(text: string, edge: readonly string[], target: Resolved, from: number): string | undefined {
  for (let count = Math.min(MIN_EDGE_WORDS, edge.length); count <= edge.length; count++) {
    const term = edge.slice(edge.length - count).join(" ");
    const at = findTerm(text, term, from);
    if (at !== -1 && at + term.length === target.end) return term;
  }
  return undefined;
}

function rangeDirective(text: string, quote: string, target: Resolved): string | undefined {
  const blocks = quote.split("\n");
  const startTerm = minimalStart(text, words(blocks[0] ?? ""), target);
  if (startTerm === undefined) return undefined;
  const endTerm = minimalEnd(text, words(blocks[blocks.length - 1] ?? ""), target, target.start + startTerm.length);
  if (endTerm === undefined) return undefined;
  // Edges covering nearly a single-block quote are no shorter than the quote: the exact form is used instead.
  const edgeWords = words(startTerm).length + words(endTerm).length;
  if (blocks.length === 1 && edgeWords > words(quote).length - 2) return undefined;
  return `${encodeTerm(startTerm)},${encodeTerm(endTerm)}`;
}

/**
 * Build the directive for a quote exactly as it appears in the page text (with "\n" at block breaks).
 * Returns undefined when no directive would land on this passage.
 */
export function buildDirective(text: string, pageQuote: string): string | undefined {
  const target = locateTarget(text, pageQuote);
  if (!target) return undefined;
  const singleBlock = !pageQuote.includes("\n");
  if (singleBlock && words(pageQuote).length <= EXACT_MAX_WORDS) return encodeTerm(pageQuote);
  const range = rangeDirective(text, pageQuote, target);
  if (range) return range;
  return singleBlock ? encodeTerm(pageQuote) : undefined;
}

/** Append a text directive to a URL, keeping any existing #anchor. */
export function withDirective(url: string, directive: string): string {
  const parsed = new URL(url);
  const anchor = parsed.hash.replace(/^#/, "").split(":~:")[0] ?? "";
  parsed.hash = "";
  return `${parsed.href}#${anchor}:~:text=${directive}`;
}
