import { parseHTML } from "linkedom";
import { fetchOfficial } from "./http.js";
import { ENTRY_PAGES } from "./sources.js";
import { checkUrl } from "./whitelist.js";

export interface IndexEntry {
  readonly url: string;
  /** Best display title: navigation text when the page is in a nav, otherwise the shortest link text. */
  readonly title: string;
  /** Every distinct link text that pointed at this URL, used for matching. */
  readonly titles: readonly string[];
}

interface RawLink {
  readonly url: string;
  readonly text: string;
  readonly inNav: boolean;
}

const NAV_SELECTOR = "devsite-book-nav, .devsite-nav-list, devsite-tabs, .devsite-tabs-dropdown, nav";

/** Canonical form used for de-duplication: https, no query, no hash, no trailing slash. */
export function canonical(url: URL): string {
  const copy = new URL(url.href);
  copy.hash = "";
  copy.search = "";
  return copy.href.replace(/\/$/, "");
}

/** Every whitelisted Google link on one official index page. */
export function linksOf(html: string, baseUrl: string): RawLink[] {
  const { document } = parseHTML(html) as unknown as { document: Document };
  const links: RawLink[] = [];
  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    const text = anchor.textContent.replace(/\s+/g, " ").trim();
    const href = anchor.getAttribute("href") ?? "";
    if (text.length < 3 || href.startsWith("#")) continue;
    const check = checkUrl(new URL(href, baseUrl).href);
    if (!check.ok || check.rule.kind !== "google") continue;
    links.push({ url: canonical(check.url), text, inNav: anchor.closest(NAV_SELECTOR) !== null });
  }
  return links;
}

function pickTitle(links: readonly RawLink[]): string {
  const nav = links.filter((link) => link.inNav).map((link) => link.text);
  const pool = nav.length > 0 ? nav : links.map((link) => link.text);
  return [...pool].sort((a, b) => a.length - b.length)[0] ?? "";
}

/** Group raw links by URL into index entries. */
export function mergeLinks(links: readonly RawLink[]): IndexEntry[] {
  const byUrl = new Map<string, RawLink[]>();
  for (const link of links) byUrl.set(link.url, [...(byUrl.get(link.url) ?? []), link]);
  return [...byUrl.entries()].map(([url, group]) => ({
    url,
    title: pickTitle(group),
    titles: [...new Set(group.map((link) => link.text))],
  }));
}

async function crawlEntry(url: string): Promise<RawLink[]> {
  try {
    const page = await fetchOfficial(url);
    return linksOf(page.body, page.finalUrl);
  } catch (error) {
    process.stderr.write(`gspec: skipped index page ${url}: ${error instanceof Error ? error.message : String(error)}\n`);
    return [];
  }
}

/** Build the title index from the navigation and body links of the official entry pages. */
export async function buildIndex(): Promise<IndexEntry[]> {
  const seeds = ENTRY_PAGES.filter((page) => {
    const check = checkUrl(page.url);
    return check.ok && check.rule.kind === "google";
  });
  const lists = await Promise.all(seeds.map((page) => crawlEntry(page.url)));
  return mergeLinks(lists.flat());
}
