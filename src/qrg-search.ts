import type { QrgDocument, QrgSection } from "./qrg-data.js";
import { tokenize } from "./search.js";

export interface QrgPassage {
  readonly section: QrgSection;
  readonly text: string;
  readonly score: number;
  readonly link: string;
}

const MIN_PASSAGE_CHARS = 40;

/** Split section text into paragraphs (blank-line separated, falling back to single lines). */
export function paragraphs(text: string): string[] {
  const blocks = text.split(/\n\s*\n/).map((block) => block.replace(/\s+/g, " ").trim());
  return blocks.filter((block) => block.length >= MIN_PASSAGE_CHARS);
}

/** Official PDF deep link to the first page of a section. */
export function pageLink(sourceUrl: string, page: number): string {
  const url = new URL(sourceUrl);
  url.hash = `page=${page}`;
  return url.href;
}

function passageScore(passage: string, terms: readonly string[], section: QrgSection): number {
  const tokens = tokenize(passage);
  const titleTokens = new Set(tokenize(section.title));
  let score = 0;
  for (const term of terms) {
    const hits = tokens.filter((token) => token === term).length;
    if (hits > 0) score += 10 + Math.min(hits, 5);
    if (titleTokens.has(term)) score += 4;
  }
  const phrase = terms.join(" ");
  return tokens.join(" ").includes(phrase) && terms.length > 1 ? score + 15 : score;
}

/** Rank QRG paragraphs for a query. Every query term must appear in the passage or its section title. */
export function searchQrg(doc: QrgDocument, query: string, limit = 8): QrgPassage[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const hits: QrgPassage[] = [];
  for (const section of doc.sections) {
    const titleTokens = new Set(tokenize(section.title));
    for (const text of paragraphs(section.text)) {
      const tokens = new Set(tokenize(text));
      if (!terms.every((term) => tokens.has(term) || titleTokens.has(term))) continue;
      hits.push({ section, text, score: passageScore(text, terms, section), link: pageLink(doc.sourceUrl, section.pageStart) });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
