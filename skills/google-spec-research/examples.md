# Worked examples

Every link below was printed by `gspec quote` (or `gspec qrg`) on 2026-10-07. Dates are the pages' own "Last updated" or "Published" lines on that day. Re-run the commands before reusing an answer: pages change.

## 1. "Is the FAQPage rich result still shown?"

Commands: `gspec search FAQ rich result`, `gspec fetch https://developers.google.com/search/docs/appearance/structured-data/faqpage` (prints `Redirected from:`, the doc now redirects to the changelog), `gspec fetch https://developers.google.com/search/updates`, then `gspec quote` per sentence.

**Answer:** No. Google stopped showing the FAQ rich result for every site on May 7, 2026, and removed its documentation in June 2026.

**Evidence**
- **Google states:** "This feature will no longer appear in Google Search starting May 7, 2026." ([Latest documentation updates, May 8 entry, last updated 2026-10-01](https://developers.google.com/search/updates#:~:text=This%20feature%20will,May%207%2C%202026.))
- **Google states:** "The FAQ rich result feature is no longer shown in Google Search results, as announced in the changelog entry in May 2026." ([Latest documentation updates, June 15 entry, last updated 2026-10-01](https://developers.google.com/search/updates#:~:text=The%20FAQ%20rich%20result%20feature%20is,in%20May%202026.))
- **History, superseded:** from 2023 the result was limited: "FAQ (from FAQPage structured data) rich results will only be shown for well-known, authoritative government and health websites." ([Changes to HowTo and FAQ rich results, published August 8, 2023](https://developers.google.com/search/blog/2023/08/howto-faq-changes#:~:text=FAQ%20(from%20FAQPage,and%20health%20websites.)) The 2026 changelog entries replace this; government and health sites no longer get it either.
- **schema.org (not Google):** the type itself still exists: "A FAQPage is a WebPage presenting one or more "Frequently asked questions"" ([schema.org FAQPage](https://schema.org/FAQPage#:~:text=A%20FAQPage%20is,%22Frequently%20asked%20questions%22)). That says nothing about Google showing a rich result.
- **Not documented by Google:** whether leftover FAQPage markup has any other effect in Search. The removed page and the changelog do not say.

**Validate:** test your remaining structured data types in the Rich Results Test https://search.google.com/test/rich-results.

## 2. "What is INP's good threshold?"

Commands: `gspec search INP interaction to next paint`, `gspec fetch https://web.dev/articles/inp`, `gspec fetch https://developers.google.com/search/docs/appearance/core-web-vitals`.

**Answer:** Good INP is 200 milliseconds or less, measured at the 75th percentile of real page loads, split by mobile and desktop.

**Evidence**
- **Google states (web.dev defines the metric):** "An INP below or at 200 milliseconds means a page has good responsiveness." ([Interaction to Next Paint (INP), last updated 2025-09-02](https://web.dev/articles/inp#:~:text=An%20INP%20below,has%20good%20responsiveness.))
- **Google states (measurement):** "a good threshold to measure is the 75th percentile of page loads recorded in the field, segmented across mobile and desktop devices" ([same page](https://web.dev/articles/inp#:~:text=a%20good%20threshold,and%20desktop%20devices))
- **Google recommends (Search Central):** "To provide a good user experience, strive to have an INP of less than 200 milliseconds." ([Understanding Core Web Vitals and Google search results, last updated 2025-12-10](https://developers.google.com/search/docs/appearance/core-web-vitals#:~:text=To%20provide%20a%20good%20user%20experience%2C%20strive%20to%20have%20an,than%20200%20milliseconds.))
- **Wording differs:** web.dev says "below or at 200", Search Central says "less than 200". Exactly 200 ms is "good" by the web.dev definition. Quote both; do not merge them.

## 3. "Does Googlebot render JavaScript, and what about cookie banners?"

Commands: `gspec search javascript`, `gspec search cookie banner`, `gspec fetch` on each page below.

**Answer:** Yes, Google renders JavaScript with headless Chromium, in a separate, queued step. A cookie banner that is legally required is not penalised, but it must overlay the content, never redirect to a consent page, and content must not depend on consent or stored cookies.

**Evidence**
- **Google states:** "Google processes JavaScript web apps in three main phases" ([Understand the JavaScript SEO basics, last updated 2026-03-04](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics#:~:text=Google%20processes%20JavaScript%20web%20apps%20in%20three%20main%20phases)), and "Once Google's resources allow, a headless Chromium renders the page and executes the JavaScript." ([same page](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics#:~:text=Once%20Google's%20resources,executes%20the%20JavaScript.))
- **Google states:** "Expect Googlebot to decline user permission requests." and "HTTP Cookies are cleared across page loads." ([Fix Search-related JavaScript problems, last updated 2025-12-18](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript#:~:text=Expect%20Googlebot%20to%20decline%20user%20permission%20requests.), [cookies line](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript#:~:text=HTTP%20Cookies%20are%20cleared%20across%20page%20loads.))
- **Google recommends (mandatory interstitials):** "Ensure that the content is overlaid with the interstitial." and "Don't redirect the incoming HTTP requests to a different page for collecting consent or providing data." ([Avoid intrusive interstitials and dialogs, last updated 2025-12-10](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials#:~:text=Ensure%20that%20the%20content%20is%20overlaid%20with%20the%20interstitial.), [redirect line](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials#:~:text=Don't%20redirect%20the%20incoming,providing%20data.))
- **Google states (web.dev, naming cookie banners):** "Google Search does not penalize the usage of interstitials when they are used to comply with legal regulations such as in the case of cookie banners." ([Best practices for cookie notices, web.dev, last updated 2024-06-13](https://web.dev/articles/cookie-notice-best-practices#:~:text=Google%20Search%20does,of%20cookie%20banners.)), based on the older Search post listing "Interstitials that appear to be in response to a legal obligation, such as for cookie usage or for age verification." ([Helping users easily access content on mobile, published August 23, 2016](https://developers.google.com/search/blog/2016/08/helping-users-easily-access-content-on#:~:text=Interstitials%20that%20appear,for%20age%20verification.))
- **Not documented by Google:** the current Search Central docs above never use the words "cookie banner"; they speak of interstitials, dialogs and consent.
- **Inference (not Google's words):** content that only loads after a click on "Accept" is not seen by Googlebot, because it declines permission requests and keeps no cookies.

## 4. "What does the QRG say about lowest-quality AI-generated content?"

Commands: `gspec qrg AI generated little to no effort`, `gspec qrg scaled content abuse`, `gspec fetch https://developers.google.com/search/docs/fundamentals/using-gen-ai-content`.

**Answer:** Raters must give the Lowest rating when all or almost all main content is AI generated (or copied, paraphrased, reposted) with little to no effort, originality or added value. This is a rater instruction, not a ranking signal. The ranking-side rule is Google's scaled content abuse spam policy.

**Evidence**
- **QRG section 4.6.6, PDF page 42 (version 2025-09-11):** "The Lowest rating applies if all or almost all of the MC on the page (including text, images, audio, videos, etc) is copied, paraphrased, embedded, auto or AI generated, or reposted from other sources with little to no effort, little to no originality, and little to no added value for visitors to the website." ([official PDF, page 42](https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf#page=42))
- **What the QRG is:** Google says of these guidelines: "These guidelines are not a guide to ranking first in Google; they're used by our search raters to help evaluate the performance of our various search ranking systems, and their ratings don't directly influence ranking." ([Google Search's guidance on using generative AI content on your website, last updated 2026-10-01](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content#:~:text=These%20guidelines%20are,directly%20influence%20ranking.))
- **Google requires (spam policy):** "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users." with the example "Using generative AI tools or other similar tools to generate many pages without adding value for users" ([Spam policies for Google web search, last updated 2026-08-28](https://developers.google.com/search/docs/essentials/spam-policies#:~:text=Scaled%20content%20abuse%20is,not%20helping%20users.), [example line](https://developers.google.com/search/docs/essentials/spam-policies#:~:text=Using%20generative%20AI%20tools,value%20for%20users))
- **Google recommends:** "It is critical to manually factcheck and review all AI-generated content for accuracy and trustworthiness before publishing." ([generative AI guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content#:~:text=It%20is%20critical,trustworthiness%20before%20publishing.))
- PDF links use `#page=N`; browsers do not highlight text inside PDFs, so the quote above is the evidence and the page number is where to read it.
