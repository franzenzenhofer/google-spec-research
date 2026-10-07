/** Elements that start a new block for text-fragment matching (non-inline display in browsers). */
const BLOCK_TAGS = new Set([
    "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "CAPTION", "DD", "DETAILS", "DIALOG", "DIV", "DL", "DT", "FIELDSET",
    "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "LI", "MAIN", "NAV",
    "OL", "P", "PRE", "SECTION", "SUMMARY", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL", "BR", "IMG",
]);
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
function collect(node, parts) {
    if (node.nodeType === TEXT_NODE) {
        // Source line breaks inside a text node render as plain spaces; only block elements break blocks.
        parts.push((node.textContent ?? "").replace(/\s+/g, " "));
        return;
    }
    if (node.nodeType !== ELEMENT_NODE)
        return;
    const isBlock = BLOCK_TAGS.has(node.tagName.toUpperCase());
    if (isBlock)
        parts.push("\n");
    for (const child of Array.from(node.childNodes))
        collect(child, parts);
    if (isBlock)
        parts.push("\n");
}
/** Collapse whitespace the way browsers render it; block boundaries become a single "\n". */
export function normaliseBlocks(raw) {
    return raw
        .replace(/[^\S\n]+/g, " ")
        .replace(/ *\n */g, "\n")
        .replace(/\n+/g, "\n")
        .trim();
}
/** Visible text of an element, one line per block. */
export function blockText(root) {
    const parts = [];
    collect(root, parts);
    return normaliseBlocks(parts.join(""));
}
/** Typographic variants that count as the same character when checking a quote. Same length in and out. */
export function foldTypography(text) {
    return text.replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u00A0/g, " ");
}
/** Text used for matching: typography folded, block breaks treated as spaces. Keeps every index aligned. */
export function searchable(text) {
    return foldTypography(text).replace(/\n/g, " ");
}
/** Normalise a user-supplied quote: fold typography and collapse all whitespace to single spaces. */
export function normaliseQuote(quote) {
    return foldTypography(quote).replace(/\s+/g, " ").trim();
}
