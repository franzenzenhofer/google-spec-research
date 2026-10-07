import { describe, expect, it } from "vitest";
import { run } from "./cli.js";
import { resolveDirective } from "./fragment.js";
import { readOfficialPage } from "./page.js";
import { verifyQuote } from "./quote.js";
import { collector } from "./test-support/collect.js";

const JS_BASICS = "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics";
const KNOWN = "Googlebot queues all pages with a 200 HTTP status code for rendering, unless a robots meta tag or header tells Google not to index the page.";
const FAKE = "Googlebot always clicks the accept button on cookie consent banners before rendering.";

function directiveTerms(link: string): string[] {
  return (link.split(":~:text=")[1] ?? "").split(",").map(decodeURIComponent);
}

describe("quote (live)", () => {
  it("verifies a known Search Central sentence and builds a link that resolves to it", async () => {
    const page = await readOfficialPage(JS_BASICS);
    const result = verifyQuote(page, KNOWN);
    expect(result.found).toBe(true);
    if (!result.found) return;
    expect(result.link.startsWith(`${JS_BASICS}#:~:text=`)).toBe(true);
    const [start, end] = directiveTerms(result.link);
    const hit = resolveDirective(page.fullText, start ?? "", end);
    expect(hit && page.fullText.slice(hit.start, hit.end).replace(/\s+/g, " ")).toBe(KNOWN);
  });

  it("accepts curly apostrophes for straight ones", async () => {
    const page = await readOfficialPage("https://web.dev/articles/inp");
    const result = verifyQuote(page, "An INP above 200 milliseconds and below or at 500 milliseconds means a page’s responsiveness needs improvement.");
    expect(result.found).toBe(true);
  });

  it("CLI prints VERIFIED and a deep link, exit 0", async () => {
    const io = collector();
    expect(await run(["quote", JS_BASICS, KNOWN], io)).toBe(0);
    expect(io.stdout.join("\n")).toMatch(/Link: https:\/\/developers\.google\.com\/.+#:~:text=Googlebot%20queues/);
  });

  it("CLI exits 1 for a sentence that is not on the page", async () => {
    const io = collector();
    expect(await run(["quote", JS_BASICS, FAKE], io)).toBe(1);
    expect(io.stderr.join("\n")).toContain("NOT FOUND");
  });

  it("CLI rejects a non-Google source with exit 2 and says why", async () => {
    const io = collector();
    expect(await run(["quote", "https://moz.com/learn/seo/robotstxt", "robots"], io)).toBe(2);
    expect(io.stderr.join("\n")).toContain("SEO blogs, forums");
  });
});
