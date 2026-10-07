import { describe, expect, it } from "vitest";
import { run } from "./cli.js";
import { searchOfficial } from "./search.js";
import { collector } from "./test-support/collect.js";
import { checkUrl } from "./whitelist.js";

describe("search (live index from official entry pages)", () => {
  it("finds the FAQ structured data URL", async () => {
    const hits = await searchOfficial("FAQ rich result");
    expect(hits.map((hit) => hit.entry.url)).toContain("https://developers.google.com/search/docs/appearance/structured-data/faqpage");
  });

  it("finds the web.dev INP article", async () => {
    const hits = await searchOfficial("INP interaction to next paint");
    expect(hits.map((hit) => hit.entry.url)).toContain("https://web.dev/articles/inp");
  });

  it("only ever returns whitelisted Google URLs", async () => {
    const hits = await searchOfficial("structured data");
    expect(hits.length).toBeGreaterThan(3);
    for (const hit of hits) expect(checkUrl(hit.entry.url).ok).toBe(true);
  });

  it("CLI exits 1 when nothing matches", async () => {
    const io = collector();
    expect(await run(["search", "zzqxv"], io)).toBe(1);
  });
});
