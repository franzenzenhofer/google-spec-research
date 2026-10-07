import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDirective } from "./fragment.js";
import { fetchOfficial } from "./http.js";
import { readOfficialPage } from "./page.js";
import { countOccurrences } from "./quote.js";
import { QRG_REPO, VALIDATORS } from "./sources.js";
import { checkUrl } from "./whitelist.js";

const ROOT = join(import.meta.dirname, "..");
const SKILL_DIR = join(ROOT, "skills", "google-spec-research");
const DOCS = [join(ROOT, "README.md"), ...readdirSync(SKILL_DIR).filter((f) => f.endsWith(".md")).map((f) => join(SKILL_DIR, f))];

/** Links in our own docs that are not documentation sources: validators and this project's repositories. */
const OWN_REPOS = [`https://github.com/${QRG_REPO}`, "https://github.com/franzenzenhofer/google-spec-research"];
const VALIDATOR_URLS = VALIDATORS.map((v) => v.url);

function urlsIn(markdown: string): string[] {
  const found = markdown.match(/https?:\/\/[^\s)<>"`]+/g) ?? [];
  return [...new Set(found.map((url) => url.replace(/[.,;:]+$/, "")))];
}

const ALL_URLS = [...new Set(DOCS.flatMap((file) => urlsIn(readFileSync(file, "utf8"))))];
const FRAGMENT_URLS = ALL_URLS.filter((url) => url.includes(":~:text="));
const SOURCE_URLS = ALL_URLS.filter((url) => !url.includes(":~:text=") && !OWN_REPOS.some((repo) => url.startsWith(repo)));

describe("deep links in README and skill docs (live)", () => {
  it("documents contain text-fragment links to check", () => {
    expect(FRAGMENT_URLS.length).toBeGreaterThan(10);
  });

  it.each(FRAGMENT_URLS)("%s resolves to a passage that is unique on the page", async (link) => {
    const [base, directive] = link.split("#:~:text=");
    const page = await readOfficialPage(base ?? "");
    const [start, end] = (directive ?? "").split(",").map(decodeURIComponent);
    const hit = resolveDirective(page.fullText, start ?? "", end);
    expect(hit).toBeDefined();
    const passage = page.fullText.slice(hit?.start ?? 0, hit?.end ?? 0);
    expect(countOccurrences(page.text, passage)).toBe(1);
  });

  it.each(SOURCE_URLS)("%s is whitelisted or a validator, and live", async (url) => {
    const allowed = checkUrl(url).ok || VALIDATOR_URLS.some((validator) => url.startsWith(validator));
    expect(allowed).toBe(true);
    if (checkUrl(url).ok) await fetchOfficial(url.split("#")[0] ?? url);
    else expect((await fetch(url, { signal: AbortSignal.timeout(30_000) })).status).toBeLessThan(400);
  });
});
