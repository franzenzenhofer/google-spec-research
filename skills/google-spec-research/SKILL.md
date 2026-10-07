---
name: google-spec-research
description: Use when answering any SEO or GEO question about Google Search (crawling, indexing, rendering, JavaScript, robots.txt, canonicals, structured data, rich results, Core Web Vitals, INP, spam policies, AI Overviews, AI-generated content, E-E-A-T, Search Quality Rater Guidelines), when someone asks "what does Google say", needs a citation or proof, or quotes an SEO blog, forum or AI answer as evidence.
---

# Google Spec Research

## Overview

Answer like a careful spec lawyer: only from what Google itself publishes, every claim backed by a verbatim quote that `gspec` has verified on the live page, with a deep link that highlights that exact sentence. If Google's documentation does not say it, the answer says that.

**Your memory, WebFetch summaries and SEO blogs are not evidence.** Summaries invent "current" text for pages that changed or redirected. Only text printed by `gspec fetch`, `gspec quote` or `gspec qrg` counts.

## Setup

`gspec --version` must work. If it does not: `npm install -g github:franzenzenhofer/google-spec-research` (Node 20 or newer, macOS, Linux or Windows).

## Accepted sources

`gspec sources` prints the enforced whitelist: Google Search Central (`developers.google.com/search`, `developers.google.com/crawling`), Search Console Help (`support.google.com/webmasters`), `web.dev`, `developer.chrome.com`, the Search Quality Rater Guidelines (official PDF, read through `gspec qrg`). `schema.org` is vocabulary only: label it "schema.org (not Google)"; Google's structured data docs win where they differ.

Everything else (SEO blogs, forums, Stack Overflow, social posts, AI answers) is rejected. When a user brings one, say it is not an accepted source and why (it restates, guesses or goes stale), then check the claim against Google's own pages.

## Research loop

1. `gspec search <terms>` to find candidate official pages (or start from `gspec sources`).
2. `gspec fetch <url>` and READ the relevant section. Note `Last updated`, `Published`, and `Redirected from`.
3. For anything that may have changed, also fetch https://developers.google.com/search/updates (the documentation changelog).
4. Copy the sentence verbatim from the fetched text, then run `gspec quote <url> "<sentence>"`. Use only the `Link:` it prints. Exit 1 means the text is not on the page: fix the quote, never hand-build a `#:~:text=` link.
5. If `gspec quote` prints `WARNING: this text appears N times`, the sentence is shared by several places (for example the same note under two properties). Quote more words, such as the sentence before it, until the warning is gone. Never attribute a repeated sentence to one place.
6. For the Quality Rater Guidelines run `gspec qrg <terms>` and quote the passage with its `#page=N` link.

## Answer format

```
**Answer:** <one or two sentence verdict>

**Evidence**
- **Google requires:** <claim> "<verbatim quote>" ([<page title>, last updated <date>](<gspec Link>))
- **Google states:** <documented behaviour or fact> "<verbatim quote>" ([...](<gspec Link>))
- **Google recommends:** <claim> "<verbatim quote>" ([...](<gspec Link>))
- **Not documented by Google:** <what the docs do not say>
- **Inference (not Google's words):** <your reasoning from the quotes above>

**Validate:** <for structured data: Rich Results Test https://search.google.com/test/rich-results>
```

Labels, decided by the quoted wording:

| Label | Use when the quote says |
|---|---|
| Google requires | must, required, is not eligible, will not show, spam policy violation, required property |
| Google recommends | should, recommend, best practice, strive to, consider, we suggest |
| Google states | a description of how Google behaves or what a feature is, with no must or should |
| Not documented by Google | you searched and fetched the obvious official pages and none says it |
| Inference | your own conclusion; keep it short and after the quotes it rests on |

Rules:
- Every claim line ends with its `gspec` link and the page date. Blog posts: give `Published` and check the changelog for anything newer.
- When two Google pages word a fact differently, quote both and point out the difference. Do not merge them.
- Structured data answers always end with the Rich Results Test link https://search.google.com/test/rich-results and tell the user to validate their own markup there.
- QRG answers state that raters' guidelines describe how raters evaluate pages and are not ranking signals, quote the passage, and link the PDF `#page=N` that `gspec qrg` printed. Google's own wording for this is in example 4 of `examples.md`.

## Common mistakes

| Mistake | Fix |
|---|---|
| Quoting from memory or a WebFetch summary | Quote only text printed by `gspec fetch`; verify with `gspec quote` |
| Building `#:~:text=` links by hand | Use the `Link:` from `gspec quote`; it simulates browser matching |
| "Google says X" with no quote | Either a verified quote or "Not documented by Google" |
| Citing a 2019 blog post as current | Check `Last updated` and the changelog; prefer current docs |
| Treating QRG as ranking factors | Say they are rater instructions, not ranking signals |
| Citing a sentence that appears under several headings | Extend the quote until `gspec quote` prints no `WARNING` |

## Worked examples

`examples.md` (next to this file) has four complete answers with verified links: FAQPage rich results, INP threshold, JavaScript rendering and cookie banners, and what the QRG says about AI-generated content.
