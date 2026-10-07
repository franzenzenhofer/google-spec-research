# google-spec-research

Answer SEO and GEO questions **only from official Google sources**, the way a careful spec lawyer would: every claim is a verbatim quote that was verified on the live page, followed by a deep link that highlights exactly that sentence.

Two parts:

- **`gspec`**, a small cross-platform CLI (macOS, Linux, Windows, Node 20+). It enforces a source whitelist, reads official pages as clean markdown, verifies quotes and builds `#:~:text=` deep links, searches the Search Quality Rater Guidelines, and finds official pages by title.
- **A Claude skill** (`skills/google-spec-research/SKILL.md`) that teaches an agent the research loop and the answer format: Google requires / Google recommends / Google states / not documented by Google, page dates, the Rich Results Test for structured data, and the "raters are not ranking signals" caveat for the QRG.

## Accepted sources

| Source | Scope |
|---|---|
| Google Search Central | `developers.google.com/search/**`, `developers.google.com/crawling/**` (docs, structured data gallery, blog, changelog) |
| Search Console Help | `support.google.com/webmasters/**` |
| web.dev, Chrome for Developers | `web.dev/**`, `developer.chrome.com/**` (Core Web Vitals, Lighthouse, rendering) |
| Search Quality Rater Guidelines | the official PDF, searched through the mirror [franzenzenhofer/google-search-quality-rater-guidelines](https://github.com/franzenzenhofer/google-search-quality-rater-guidelines) |
| schema.org | vocabulary only, always labelled "schema.org (not Google)" |

Everything else (SEO blogs, forums, Stack Overflow, social posts, AI answers) is rejected with exit code 2 and a reason. Redirects are re-checked on every hop, so an official URL cannot redirect `gspec` onto another host.

## Install

### macOS and Linux

```bash
npm install -g github:franzenzenhofer/google-spec-research
gspec --version

# Claude skill: symlink it from the installed package
mkdir -p ~/.claude/skills
ln -s "$(npm root -g)/google-spec-research/skills/google-spec-research" ~/.claude/skills/google-spec-research
```

### Windows (PowerShell)

```powershell
npm install -g github:franzenzenhofer/google-spec-research
gspec --version

# Claude skill: a directory junction needs no admin rights
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\google-spec-research" -Target "$(npm root -g)\google-spec-research\skills\google-spec-research"
```

Prefer a plain copy? Copy the folder `skills/google-spec-research` into `~/.claude/skills/` (macOS, Linux) or `%USERPROFILE%\.claude\skills\` (Windows). Re-copy after updates.

Update with the same `npm install -g` command.

## Usage

```text
gspec fetch <url>               Read an official page as markdown, with source URL and last-updated date
gspec quote <url> "<text>"      Verify the text is verbatim on the page; print a #:~:text= deep link (exit 1 if not found)
gspec qrg <search terms>        Search the Search Quality Rater Guidelines; print passages with PDF #page=N links
gspec search <terms>            Find official pages by title (Search Central, web.dev, Chrome, Search Console Help)
gspec sources                   Print the whitelist and the main entry pages
```

Exit codes: 0 ok, 1 not found, 2 rejected source or usage error, 3 network or data error.

### Verify a quote and get a deep link

```console
$ gspec quote https://web.dev/articles/inp "An INP below or at 200 milliseconds means a page has good responsiveness."
VERIFIED: "An INP below or at 200 milliseconds means a page has good responsiveness."
Source: https://web.dev/articles/inp
Source type: web.dev (Google Chrome team)
Title: Interaction to Next Paint (INP)
Last updated: 2025-09-02 UTC
Link: https://web.dev/articles/inp#:~:text=An%20INP%20below,has%20good%20responsiveness.
```

Open the link: the browser scrolls to the sentence and highlights it. A sentence that is not on the page exits with 1:

```console
$ gspec quote https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics "Googlebot clicks every cookie banner button."
NOT FOUND: the text does not appear verbatim on https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
```

`gspec quote` folds whitespace and curly versus straight quotes, nothing else. It then simulates how a browser resolves the text fragment (case-insensitive, word boundaries, no match across block elements, first match wins) and only prints a `#:~:text=` link that lands on this passage. Long quotes get the short `start,end` form.

### Read a page, see redirects and dates

```console
$ gspec fetch https://developers.google.com/search/docs/appearance/structured-data/faqpage
Source: https://developers.google.com/search/updates#removing-faq-rich-result
Redirected from: https://developers.google.com/search/docs/appearance/structured-data/faqpage
Source type: Google Search Central
Title: Latest documentation updates
Last updated: 2026-10-01 UTC
...
```

### Search the Quality Rater Guidelines

```console
$ gspec qrg AI generated little to no effort
Search Quality Rater Guidelines, version 2025-09-11, official PDF https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf
Raters' guidelines describe how raters evaluate pages. They are not ranking signals.

Section 4.6.6 "MC Created with Little to No Effort, Little to No Originality, and Little to No Added Value for Website Visitors", PDF page 42
  https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf#page=42
  > The Lowest rating applies if all or almost all of the MC on the page ...
```

The page number comes from the page markers in the mirror's `markdown/qrg.md`, so it is the page where the passage starts. Google itself says the rater guidelines are not a ranking guide: "their ratings don't directly influence ranking" ([Google Search's guidance on using generative AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content#:~:text=These%20guidelines%20are,directly%20influence%20ranking.)).

### Find official pages

```console
$ gspec search FAQ rich result
FAQ
  https://developers.google.com/search/docs/appearance/structured-data/faqpage
Changes to HowTo and FAQ rich results
  https://developers.google.com/search/blog/2023/08/howto-faq-changes
...
```

The search index is built from the navigation and links of the official index pages (`gspec sources` lists them) and cached for a day. The XML sitemap indexes of `developers.google.com`, `web.dev` and `developer.chrome.com` list part files, but those part files answered HTTP 500 after 17 to 40 seconds when this tool was built (2026-10-07), so they are not used. No paid APIs, no scraping of Google results pages.

## The skill in practice

See [`skills/google-spec-research/examples.md`](skills/google-spec-research/examples.md) for four complete answers with verified links:

1. Is the FAQPage rich result still shown? (No, since May 7, 2026: ["This feature will no longer appear in Google Search starting May 7, 2026."](https://developers.google.com/search/updates#:~:text=This%20feature%20will,May%207%2C%202026.))
2. What is INP's good threshold? (web.dev ["An INP below or at 200 milliseconds means a page has good responsiveness."](https://web.dev/articles/inp#:~:text=An%20INP%20below,has%20good%20responsiveness.) versus Search Central's ["strive to have an INP of less than 200 milliseconds"](https://developers.google.com/search/docs/appearance/core-web-vitals#:~:text=To%20provide%20a%20good%20user%20experience%2C%20strive%20to%20have%20an,than%20200%20milliseconds.))
3. Does Googlebot render JavaScript, and what about cookie banners? (["Expect Googlebot to decline user permission requests."](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript#:~:text=Expect%20Googlebot%20to%20decline%20user%20permission%20requests.))
4. What does the QRG say about lowest-quality AI-generated content?

For structured data, always validate your own markup in the [Rich Results Test](https://search.google.com/test/rich-results).

## Configuration

| Variable | Effect |
|---|---|
| `GSPEC_CACHE_DIR` | Cache directory. Default: `~/Library/Caches/gspec` (macOS), `$XDG_CACHE_HOME/gspec` or `~/.cache/gspec` (Linux), `%LOCALAPPDATA%\gspec` (Windows) |
| `GSPEC_QRG_DIR` | Read the rater guidelines from a local clone of the mirror instead of GitHub |
| `GH_TOKEN` / `GITHUB_TOKEN` | Sent only to `raw.githubusercontent.com`, for reading the mirror if it is not public |

## Development

```bash
npm ci
npm run gates   # typecheck, lint, test, build
```

Tests hit the real pages and the real mirror; there are no mocks. `dist/` is committed so that `npm install -g github:...` works without build scripts (npm 12 blocks install scripts of git dependencies by default). CI checks that `dist/` matches the build on Ubuntu, Windows and macOS.

## License

MIT, Copyright (c) 2026 Franz Enzenhofer. The rater guidelines and Google's documentation are Google's; this tool quotes and links them.
