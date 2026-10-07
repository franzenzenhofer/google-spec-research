import { describe, expect, it } from "vitest";
import { readOfficialPage } from "./page.js";

const JS_BASICS = "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics";

describe("readOfficialPage (live)", () => {
  it("reads a Search Central page as clean English markdown with its date", async () => {
    const page = await readOfficialPage(JS_BASICS);
    expect(page.url).toBe(JS_BASICS);
    expect(page.title).toBe("Understand the JavaScript SEO basics");
    expect(page.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2} UTC$/);
    expect(page.markdown).toContain("## ");
    expect(page.markdown).toContain("Google processes JavaScript web apps in three main phases");
    expect(page.markdown).not.toContain("Stay organized with collections");
    expect(page.markdown).not.toContain("Except as otherwise noted");
  });

  it("reads web.dev and keeps the page's last-updated date", async () => {
    const page = await readOfficialPage("https://web.dev/articles/inp");
    expect(page.title).toBe("Interaction to Next Paint (INP)");
    expect(page.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2} UTC$/);
    expect(page.text).toContain("Interaction to Next Paint");
  });

  it("reads a Search Console Help article", async () => {
    const page = await readOfficialPage("https://support.google.com/webmasters/answer/9128668?hl=en");
    expect(page.title).toBe("About Search Console");
    expect(page.sourceLabel).toBe("Google Search Console Help");
    expect(page.markdown).toContain("Search Console");
  });

  it("reports the publication date of a Search Central Blog post", async () => {
    const page = await readOfficialPage("https://developers.google.com/search/blog/2023/08/howto-faq-changes");
    expect(page.published).toBe("Tuesday, August 8, 2023");
  });

  it("follows a redirect only while it stays on the whitelist and reports the final URL", async () => {
    const page = await readOfficialPage("https://developers.google.com/search/docs/appearance/structured-data/faqpage");
    expect(page.url).not.toBe(page.requestedUrl);
    expect(page.url.startsWith("https://developers.google.com/search/")).toBe(true);
  });
});
