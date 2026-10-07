import { describe, expect, it } from "vitest";
import { buildDirective, encodeTerm, findTerm, resolveDirective, withDirective } from "./fragment.js";

describe("encodeTerm", () => {
  it("percent-encodes the directive syntax characters", () => {
    expect(encodeTerm("well-known, safe & sound")).toBe("well%2Dknown%2C%20safe%20%26%20sound");
  });
});

describe("findTerm", () => {
  it("matches case-insensitively on word boundaries only", () => {
    expect(findTerm("Rendering and render", "render", 0)).toBe(14);
    expect(findTerm("Rendering and RENDER", "render", 0)).toBe(14);
  });

  it("never matches across a block break", () => {
    expect(findTerm("first block\nsecond block", "block second", 0)).toBe(-1);
  });
});

describe("buildDirective", () => {
  const text = "Intro mentions Google renders pages.\nGoogle renders pages with an evergreen Chromium and queues them for rendering first.";

  it("uses the exact form for a short unique quote", () => {
    expect(buildDirective(text, "evergreen Chromium")).toBe("evergreen%20Chromium");
  });

  it("uses start,end for a long quote and extends the start past an earlier duplicate", () => {
    const quote = "Google renders pages with an evergreen Chromium and queues them for rendering first.";
    const directive = buildDirective(text, quote);
    expect(directive).toContain(",");
    const [start, end] = (directive ?? "").split(",").map(decodeURIComponent);
    const hit = resolveDirective(text, start ?? "", end);
    expect(hit && text.slice(hit.start, hit.end)).toBe(quote);
  });

  it("spans blocks with a range whose edges each stay inside one block", () => {
    const quote = "Google renders pages.\nGoogle renders pages with an evergreen";
    const directive = buildDirective(text, quote) ?? "";
    const [start, end] = directive.split(",").map(decodeURIComponent);
    expect(start).not.toContain("\n");
    const hit = resolveDirective(text, start ?? "", end);
    expect(hit && text.slice(hit.start, hit.end)).toBe(quote);
  });
});

describe("withDirective", () => {
  it("keeps an existing anchor and the query string", () => {
    expect(withDirective("https://web.dev/articles/inp?hl=en#what-is-a-good-inp-score", "INP")).toBe(
      "https://web.dev/articles/inp?hl=en#what-is-a-good-inp-score:~:text=INP",
    );
  });
});
