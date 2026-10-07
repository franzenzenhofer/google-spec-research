import { buildDirective, withDirective } from "./fragment.js";
import { normaliseQuote, searchable } from "./text.js";
/** Locate a quote verbatim (whitespace and curly quotes folded) in page text; returns the page's own wording. */
export function locateQuote(text, quote) {
    const needle = normaliseQuote(quote);
    if (needle === "")
        return undefined;
    const index = searchable(text).indexOf(needle);
    return index === -1 ? undefined : text.slice(index, index + needle.length);
}
/** Count non-overlapping occurrences of the normalised quote in the page text. */
export function countOccurrences(text, quote) {
    const needle = normaliseQuote(quote);
    if (needle === "")
        return 0;
    return searchable(text).split(needle).length - 1;
}
/** Longest leading run of the quote's words that does appear, to help the user fix a near miss. */
export function nearestPrefix(text, quote) {
    const words = normaliseQuote(quote).split(" ");
    for (let count = words.length - 1; count >= 3; count--) {
        const prefix = words.slice(0, count).join(" ");
        if (locateQuote(text, prefix))
            return prefix;
    }
    return undefined;
}
/** Verify a quote against a page and build a deep link that highlights it. */
export function verifyQuote(page, quote) {
    const pageQuote = locateQuote(page.text, quote);
    if (!pageQuote)
        return { found: false, nearest: nearestPrefix(page.text, quote) };
    const occurrences = countOccurrences(page.text, quote);
    const directive = buildDirective(page.fullText, pageQuote);
    if (directive)
        return { found: true, pageQuote, link: withDirective(page.url, directive), highlightVerified: true, occurrences };
    return { found: true, pageQuote, link: page.url, highlightVerified: false, occurrences };
}
