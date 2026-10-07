import { extractPage } from "./extract.js";
import { fetchOfficial } from "./http.js";
import { toMarkdown } from "./markdown.js";
import { blockText } from "./text.js";
import { checkUrl } from "./whitelist.js";

export interface OfficialPage {
  readonly requestedUrl: string;
  readonly url: string;
  readonly sourceLabel: string;
  readonly title: string;
  readonly lastUpdated: string | undefined;
  readonly published: string | undefined;
  readonly markdown: string;
  /** Visible text of the main content, one line per block element. */
  readonly text: string;
  /** Visible text of the whole page (navigation included), for text-fragment simulation. */
  readonly fullText: string;
}

/** Fetch, whitelist-check and read an official page. */
export async function readOfficialPage(input: string): Promise<OfficialPage> {
  const fetched = await fetchOfficial(input);
  if (!/html/i.test(fetched.contentType)) {
    throw new Error(`${fetched.finalUrl} is not an HTML page (${fetched.contentType}). Use "gspec qrg" for the rater guidelines.`);
  }
  const check = checkUrl(fetched.finalUrl);
  const sourceLabel = check.ok ? check.rule.label : "";
  const page = extractPage(fetched.body);
  const text = blockText(page.main);
  const markdown = toMarkdown(page.main, fetched.finalUrl);
  const requested = checkUrl(input);
  return {
    requestedUrl: requested.ok ? requested.url.href : input,
    url: fetched.finalUrl,
    sourceLabel,
    title: page.title,
    lastUpdated: page.lastUpdated,
    published: page.published,
    markdown,
    text,
    fullText: page.fullText,
  };
}
