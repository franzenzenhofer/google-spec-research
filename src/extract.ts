import { parseHTML } from "linkedom";
import { blockText } from "./text.js";

/** Main-content containers, most specific first: devsite (Search Central, web.dev, Chrome), Help Center, schema.org, generic. */
const MAIN_SELECTORS = [".devsite-article-body", ".article-content-container", "#mainContent", "main article", "article", "main", "body"];

/** Never rendered as text, so a browser cannot match a text fragment inside it. */
const INVISIBLE_SELECTORS = ["script", "style", "noscript", "template", "[hidden]"];

/** Page chrome that is never part of the citable text. */
const STRIP_SELECTORS = [
  "script", "style", "noscript", "template", "svg", "iframe", "nav", "footer", "header", "aside.devsite-feedback",
  "devsite-toc", "devsite-feedback", "devsite-thumb-rating", "devsite-actions", "devsite-llm-tools",
  "devsite-page-rating", "devsite-bookmark", ".devsite-article-meta", ".devsite-breadcrumb-list",
  ".devsite-banner", "devsite-content-footer", ".devsite-content-footer", ".devsite-heading-link", ".article-survey-container",
  ".article-feedback", "button", "[hidden]", "[aria-hidden='true']",
];

export interface ExtractedPage {
  readonly title: string;
  readonly lastUpdated: string | undefined;
  readonly published: string | undefined;
  readonly main: Element;
  /** Visible text of the whole page, used to simulate where a browser lands a text fragment. */
  readonly fullText: string;
}

const LAST_UPDATED = /Last updated:?\s+(\d{4}-\d{2}-\d{2}(?: UTC)?|[A-Z][a-z]+ \d{1,2}, \d{4})/;

function findLastUpdated(document: Document): string | undefined {
  const footer = document.querySelector("devsite-content-footer, .devsite-content-footer");
  const footerMatch = footer?.textContent.match(LAST_UPDATED);
  if (footerMatch?.[1]) return footerMatch[1];
  const article = document.querySelector("article")?.textContent ?? "";
  return article.match(LAST_UPDATED)?.[1];
}

function findPublished(document: Document): string | undefined {
  const blogDate = document.querySelector(".gargardate")?.textContent.trim();
  return blogDate === undefined || blogDate === "" ? undefined : blogDate;
}

function findTitle(document: Document): string {
  const heading = document.querySelector("h1.devsite-page-title, article h1, h1");
  const text = heading?.textContent.replace(/\s+/g, " ").trim();
  if (text) return text;
  return document.querySelector("title")?.textContent.trim() ?? "";
}

function pickMain(document: Document): Element {
  for (const selector of MAIN_SELECTORS) {
    const found = document.querySelector(selector);
    if (found && found.textContent.trim().length > 0) return found;
  }
  throw new Error("Page has no readable content");
}

function strip(root: Element, selectors: readonly string[]): void {
  for (const selector of selectors) {
    for (const node of Array.from(root.querySelectorAll(selector))) node.remove();
  }
}

/** Parse an official page: title, dates and the cleaned main-content element. */
export function extractPage(html: string): ExtractedPage {
  const { document } = parseHTML(html) as unknown as { document: Document };
  const lastUpdated = findLastUpdated(document);
  const published = findPublished(document);
  strip(document.documentElement, INVISIBLE_SELECTORS);
  const title = findTitle(document);
  const fullText = blockText(document.body);
  const main = pickMain(document);
  strip(main, STRIP_SELECTORS);
  return { title, lastUpdated, published, main, fullText };
}
