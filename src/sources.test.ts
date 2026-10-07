import { describe, expect, it } from "vitest";
import { run } from "./cli.js";
import { fetchOfficial } from "./http.js";
import { ENTRY_PAGES, QRG_REPO } from "./sources.js";
import { collector } from "./test-support/collect.js";
import { checkUrl } from "./whitelist.js";

const DOC_ENTRIES = ENTRY_PAGES.filter((page) => !page.url.includes(QRG_REPO));

describe("sources", () => {
  it.each(DOC_ENTRIES.map((page) => page.url))("entry page %s is whitelisted and live", async (url) => {
    expect(checkUrl(url).ok).toBe(true);
    const page = await fetchOfficial(url);
    expect(page.body.length).toBeGreaterThan(1000);
  });

  it("CLI prints the whitelist and the rejection rule", async () => {
    const io = collector();
    expect(await run(["sources"], io)).toBe(0);
    const text = io.stdout.join("\n");
    expect(text).toContain("developers.google.com/search");
    expect(text).toContain("schema.org (not Google)");
    expect(text).toContain("https://search.google.com/test/rich-results");
  });

  it("CLI fetch rejects an SEO blog with exit 2", async () => {
    const io = collector();
    expect(await run(["fetch", "https://searchengineland.com/"], io)).toBe(2);
  });
});
