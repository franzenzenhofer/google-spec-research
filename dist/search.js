import { cached } from "./cache.js";
import { buildIndex } from "./index-build.js";
const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "does", "do", "what", "how", "with", "about", "google"]);
/** Crude English plural folding so "interstitials" matches "interstitial". */
function stem(token) {
    if (token.length > 4 && token.endsWith("ies"))
        return `${token.slice(0, -3)}y`;
    if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss"))
        return token.slice(0, -1);
    return token;
}
/** Lowercase, plural-folded word tokens, stop words removed. Letter-hyphen acronyms fold: "E-E-A-T" is "eeat". */
export function tokenize(text) {
    return text
        .replace(/(?<![\p{L}\p{N}])(?:\p{L}-)+\p{L}(?![\p{L}\p{N}])/gu, (acronym) => acronym.replace(/-/g, ""))
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
        .map(stem);
}
function tokenScore(token, titleTokens, pathTokens) {
    if (titleTokens.has(token))
        return 3;
    if (pathTokens.has(token))
        return 2;
    if (token.length < 4)
        return 0;
    for (const candidate of titleTokens)
        if (candidate.length >= 4 && (candidate.startsWith(token) || token.startsWith(candidate)))
            return 1;
    return 0;
}
/** Score one entry: number of terms matched first (title beats URL path), docs above blog posts. */
export function scoreEntry(entry, terms) {
    const titleTokens = new Set(tokenize(entry.titles.join(" ")));
    const pathTokens = new Set(tokenize(new URL(entry.url).pathname));
    const points = terms.map((term) => tokenScore(term, titleTokens, pathTokens));
    const matched = points.filter((value) => value > 0).length;
    if (matched === 0)
        return 0;
    const score = matched * 10 + points.reduce((sum, value) => sum + value, 0);
    return entry.url.includes("/blog/") ? score - 0.5 : score;
}
/** Rank index entries for a free-text query. */
export function rank(index, query, limit = 15) {
    const terms = tokenize(query);
    if (terms.length === 0)
        return [];
    return index
        .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
        .filter((hit) => hit.score > 0)
        .sort((a, b) => b.score - a.score || a.entry.url.length - b.entry.url.length)
        .slice(0, limit);
}
/** Search the official-page index (built from the entry pages, cached for a day). */
export async function searchOfficial(query, limit) {
    const index = await cached("index-v1", buildIndex);
    return rank(index, query, limit);
}
