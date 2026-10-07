export const QRG_REPO = "franzenzenhofer/google-search-quality-rater-guidelines";
export const SOURCE_RULES = [
    { id: "search-central", label: "Google Search Central", kind: "google", host: "developers.google.com", pathPrefixes: ["/search"] },
    { id: "crawling", label: "Google Crawling infrastructure", kind: "google", host: "developers.google.com", pathPrefixes: ["/crawling"] },
    { id: "search-help", label: "Google Search Console Help", kind: "google", host: "support.google.com", pathPrefixes: ["/webmasters"] },
    { id: "web-dev", label: "web.dev (Google Chrome team)", kind: "google", host: "web.dev", pathPrefixes: ["/"] },
    { id: "chrome-dev", label: "Chrome for Developers", kind: "google", host: "developer.chrome.com", pathPrefixes: ["/"] },
    { id: "qrg-raw", label: "Search Quality Rater Guidelines (mirror repo)", kind: "qrg", host: "raw.githubusercontent.com", pathPrefixes: [`/${QRG_REPO}`] },
    { id: "qrg-github", label: "Search Quality Rater Guidelines (mirror repo)", kind: "qrg", host: "github.com", pathPrefixes: [`/${QRG_REPO}`] },
    { id: "qrg-pdf", label: "Search Quality Rater Guidelines (official PDF)", kind: "qrg", host: "services.google.com", pathPrefixes: ["/fh/files/misc/hsw-sqrg.pdf"] },
    { id: "qrg-pdf-raterhub", label: "Search Quality Rater Guidelines (official PDF)", kind: "qrg", host: "static.googleusercontent.com", pathPrefixes: ["/media/guidelines.raterhub.com/"] },
    { id: "schema-org", label: "schema.org (not Google)", kind: "secondary", host: "schema.org", pathPrefixes: ["/"] },
];
/** Hosts people commonly try that are rejected, with the reason the skill gives. */
export const REJECTION_REASON = "Only official Google documentation is accepted (Search Central, Search Console Help, web.dev, " +
    "developer.chrome.com, the Search Quality Rater Guidelines; schema.org only as a labelled secondary " +
    "vocabulary). SEO blogs, forums, Q&A sites, social posts and AI answers restate, guess or go stale; " +
    "a spec answer must come from the text Google itself publishes.";
/** Main entry and index pages. These also seed `gspec search`. */
export const ENTRY_PAGES = [
    { label: "Search Central documentation", url: "https://developers.google.com/search/docs" },
    { label: "Search essentials and spam policies", url: "https://developers.google.com/search/docs/essentials" },
    { label: "Structured data search gallery", url: "https://developers.google.com/search/docs/appearance/structured-data/search-gallery" },
    { label: "Search Central documentation updates", url: "https://developers.google.com/search/updates" },
    { label: "Search Central Blog", url: "https://developers.google.com/search/blog" },
    { label: "Google crawling infrastructure", url: "https://developers.google.com/crawling" },
    { label: "Google crawlers and fetchers", url: "https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers" },
    { label: "Search Console Help", url: "https://support.google.com/webmasters/" },
    { label: "web.dev Core Web Vitals", url: "https://web.dev/articles/vitals" },
    { label: "web.dev Learn Core Web Vitals", url: "https://web.dev/explore/learn-core-web-vitals" },
    { label: "web.dev Learn Performance", url: "https://web.dev/learn/performance" },
    { label: "Lighthouse", url: "https://developer.chrome.com/docs/lighthouse/overview" },
    { label: "Chrome UX Report", url: "https://developer.chrome.com/docs/crux" },
    { label: "Search Quality Rater Guidelines mirror", url: `https://github.com/${QRG_REPO}` },
    { label: "schema.org vocabulary (not Google)", url: "https://schema.org/docs/full.html" },
];
/** Google validators the skill points to. They are tools, not documentation, so `gspec fetch` does not read them. */
export const VALIDATORS = [
    { label: "Rich Results Test", url: "https://search.google.com/test/rich-results" },
    { label: "Schema Markup Validator (schema.org, not Google rich results)", url: "https://validator.schema.org/" },
    { label: "PageSpeed Insights", url: "https://pagespeed.web.dev/" },
];
