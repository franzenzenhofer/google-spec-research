import { extractPage } from "./extract.js";
import { fetchOfficial } from "./http.js";
import { toMarkdown } from "./markdown.js";
import { blockText } from "./text.js";
import { checkUrl } from "./whitelist.js";
/** Fetch, whitelist-check and read an official page. */
export async function readOfficialPage(input) {
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
