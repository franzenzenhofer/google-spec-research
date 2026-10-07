import { readOfficialPage } from "./page.js";
import { loadQrg } from "./qrg-data.js";
import { searchQrg } from "./qrg-search.js";
import { verifyQuote } from "./quote.js";
import { searchOfficial } from "./search.js";
import { ENTRY_PAGES, SOURCE_RULES, VALIDATORS } from "./sources.js";
import { checkUrl } from "./whitelist.js";
/** Exit codes: 0 ok, 1 not found (quote or search), 2 rejected source or usage error, 3 network or data error. */
export const EXIT = { ok: 0, notFound: 1, rejected: 2, error: 3 };
function dateLines(page) {
    const lines = [];
    if (page.published)
        lines.push(`Published: ${page.published}`);
    lines.push(`Last updated: ${page.lastUpdated ?? "not shown on the page"}`);
    return lines;
}
function header(page) {
    const redirect = page.url === page.requestedUrl ? [] : [`Redirected from: ${page.requestedUrl}`];
    return [`Source: ${page.url}`, ...redirect, `Source type: ${page.sourceLabel}`, `Title: ${page.title}`, ...dateLines(page)];
}
function rejectIfNeeded(url, io) {
    const check = checkUrl(url);
    if (check.ok)
        return false;
    io.err(`REJECTED: ${check.reason}`);
    return true;
}
export async function fetchCommand(url, io) {
    if (rejectIfNeeded(url, io))
        return EXIT.rejected;
    const page = await readOfficialPage(url);
    for (const line of [...header(page), "", "---", "", page.markdown])
        io.out(line);
    return EXIT.ok;
}
export async function quoteCommand(url, quote, io) {
    if (rejectIfNeeded(url, io))
        return EXIT.rejected;
    const page = await readOfficialPage(url);
    const result = verifyQuote(page, quote);
    if (!result.found) {
        io.err(`NOT FOUND: the text does not appear verbatim on ${page.url}`);
        if (result.nearest)
            io.err(`Longest matching start: "${result.nearest}"`);
        return EXIT.notFound;
    }
    for (const line of [`VERIFIED: "${result.pageQuote.replace(/\n/g, " ")}"`, ...header(page), `Link: ${result.link}`])
        io.out(line);
    if (!result.highlightVerified)
        io.err("Note: no text fragment resolves uniquely to this passage; the link points to the page only.");
    if (result.occurrences > 1) {
        io.err(`WARNING: this text appears ${result.occurrences} times on the page; the link highlights the first one. Quote more words (for example the sentence before it) until it is unique.`);
    }
    return EXIT.ok;
}
export async function searchCommand(query, io) {
    const hits = await searchOfficial(query);
    if (hits.length === 0) {
        io.err(`No official page title matches "${query}". Try other words or start from "gspec sources".`);
        return EXIT.notFound;
    }
    for (const hit of hits)
        io.out(`${hit.entry.title}\n  ${hit.entry.url}`);
    return EXIT.ok;
}
function passageHeading(passage) {
    const { section } = passage;
    const label = section.number === "" ? `"${section.title}"` : `Section ${section.number} "${section.title}"`;
    if (passage.page !== undefined)
        return `${label}, PDF page ${passage.page}`;
    const range = section.pageStart === section.pageEnd ? `${section.pageStart}` : `${section.pageStart}-${section.pageEnd}`;
    return `${label}, PDF pages ${range} (section range; link opens the first page)`;
}
export async function qrgCommand(query, io) {
    const corpus = await loadQrg();
    const passages = searchQrg(corpus, query);
    io.out(`Search Quality Rater Guidelines, version ${corpus.doc.version}, official PDF ${corpus.doc.sourceUrl}`);
    io.out("Raters' guidelines describe how raters evaluate pages. They are not ranking signals.\n");
    if (passages.length === 0) {
        io.err(`No QRG passage contains all of: ${query}`);
        return EXIT.notFound;
    }
    for (const passage of passages) {
        io.out(passageHeading(passage));
        io.out(`  ${passage.link}`);
        io.out(`  > ${passage.text}\n`);
    }
    return EXIT.ok;
}
export function sourcesCommand(io) {
    io.out("Accepted sources (enforced by gspec):");
    for (const rule of SOURCE_RULES)
        io.out(`  [${rule.kind}] ${rule.label}: https://${rule.host}${rule.pathPrefixes.join(", ")}`);
    io.out("\nEntry and index pages:");
    for (const page of ENTRY_PAGES)
        io.out(`  ${page.label}: ${page.url}`);
    io.out("\nValidators (tools, not documentation):");
    for (const page of VALIDATORS)
        io.out(`  ${page.label}: ${page.url}`);
    io.out("\nEverything else (SEO blogs, forums, Stack Overflow, social posts, AI answers) is rejected.");
    return EXIT.ok;
}
