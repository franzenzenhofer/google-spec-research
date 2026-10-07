import { describe, expect, it } from "vitest";
import { checkUrl } from "./whitelist.js";

const accepted = [
  "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics",
  "https://developers.google.com/search",
  "https://developers.google.com/search/blog/2023/08/howto-faq-changes",
  "https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers",
  "https://support.google.com/webmasters/answer/9128668?hl=en",
  "https://web.dev/articles/inp",
  "https://developer.chrome.com/docs/lighthouse/overview",
  "http://web.dev/articles/vitals",
  "https://raw.githubusercontent.com/franzenzenhofer/google-search-quality-rater-guidelines/main/json/qrg.json",
  "https://schema.org/FAQPage",
];

const rejected = [
  "https://moz.com/learn/seo/what-is-seo",
  "https://searchengineland.com/google-faq-rich-results",
  "https://stackoverflow.com/questions/1",
  "https://www.reddit.com/r/SEO/",
  "https://developers.google.com/search-ads/v2/how-tos",
  "https://developers.google.com/maps/documentation",
  "https://developers.google.com.evil.example/search/docs",
  "https://evil.example/developers.google.com/search/docs",
  "https://developers.google.com@evil.example/search/docs",
  "https://support.google.com/adsense/answer/1",
  "https://raw.githubusercontent.com/someone-else/google-search-quality-rater-guidelines/main/json/qrg.json",
  "https://web.dev:8443/articles/inp",
  "ftp://web.dev/articles/inp",
  "not a url",
];

describe("checkUrl", () => {
  it.each(accepted)("accepts %s", (url) => {
    expect(checkUrl(url).ok).toBe(true);
  });

  it.each(rejected)("rejects %s", (url) => {
    const result = checkUrl(url);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Only official Google documentation is accepted");
  });

  it("normalises dot segments before matching", () => {
    expect(checkUrl("https://developers.google.com/search/../maps/documentation").ok).toBe(false);
  });

  it("upgrades http to https", () => {
    const result = checkUrl("http://web.dev/articles/inp");
    expect(result.ok && result.url.protocol).toBe("https:");
  });

  it("labels schema.org as secondary", () => {
    const result = checkUrl("https://schema.org/Article");
    expect(result.ok && result.rule.label).toBe("schema.org (not Google)");
  });
});
