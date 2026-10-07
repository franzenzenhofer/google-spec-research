/** Per-paragraph PDF pages from the "<!-- page N -->" markers in markdown/qrg.md of the mirror. */

const PAGE_MARKER = /^<!-- page (\d+) -->$/;
const KEY_LENGTH = 80;

/** Matching key for a paragraph: link targets and markup dropped, first letters and digits only. */
export function passageKey(text: string): string {
  const plain = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  return plain.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").slice(0, KEY_LENGTH);
}

/** Map each paragraph key to the PDF page on which the paragraph starts. */
export function pageIndex(markdown: string): Map<string, number> {
  const index = new Map<string, number>();
  let page = 0;
  for (const block of markdown.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    const marker = PAGE_MARKER.exec(trimmed);
    if (marker?.[1]) {
      page = Number(marker[1]);
      continue;
    }
    const key = passageKey(trimmed);
    if (page > 0 && key.length >= 20 && !index.has(key)) index.set(key, page);
  }
  return index;
}
