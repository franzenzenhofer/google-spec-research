import { describe, expect, it } from "vitest";
import { run } from "./cli.js";
import { loadQrg, parseQrg } from "./qrg-data.js";
import { pageIndex, passageKey } from "./qrg-pages.js";
import { searchQrg } from "./qrg-search.js";
import { collector } from "./test-support/collect.js";
import { checkUrl } from "./whitelist.js";

describe("QRG contract parsing", () => {
  it("rejects data that drifts from the contract", () => {
    expect(() => parseQrg({ version: "x", sourceUrl: "y", sha256: "z", sections: [] })).toThrow(/contract/);
    expect(() => parseQrg({ version: "x", sourceUrl: "y", sha256: "z", sections: [{ id: "a" }] })).toThrow(/contract/);
  });

  it("maps paragraphs to the page marker before them, ignoring link targets", () => {
    const markdown = "<!-- page 41 -->\n\nFirst paragraph on page forty one is here.\n\n<!-- page 42 -->\n\nSecond [paragraph](https://example.com/x) starts on page forty two.";
    const pages = pageIndex(markdown);
    expect(pages.get(passageKey("Second paragraph starts on page forty two."))).toBe(42);
    expect(pages.get(passageKey("First paragraph on page forty one is here."))).toBe(41);
  });
});

describe("QRG search against the published mirror (live)", () => {
  it("loads the real guidelines with an official PDF source", async () => {
    const corpus = await loadQrg();
    expect(corpus.doc.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(checkUrl(corpus.doc.sourceUrl).ok).toBe(true);
    expect(corpus.doc.sections.length).toBeGreaterThan(50);
    expect(corpus.markdown).toContain("<!-- page ");
  });

  it("finds the Lowest rating passage on AI-generated main content with an exact page link", async () => {
    const corpus = await loadQrg();
    const hits = searchQrg(corpus, "AI generated little to no effort");
    const definition = hits.find((hit) => hit.text.startsWith("The Lowest rating applies if all or almost all of the MC"));
    expect(definition?.section.number).toBe("4.6.6");
    expect(definition?.page).toBeGreaterThan(0);
    expect(definition?.link).toBe(`${corpus.doc.sourceUrl}#page=${definition?.page}`);
  });

  it("CLI prints the not-a-ranking-signal caveat and PDF page links", async () => {
    const io = collector();
    expect(await run(["qrg", "E-E-A-T", "trust"], io)).toBe(0);
    const text = io.stdout.join("\n");
    expect(text).toContain("They are not ranking signals.");
    expect(text).toMatch(/\.pdf#page=\d+/);
  });
});
