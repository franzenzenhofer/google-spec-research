import { assertWhitelisted } from "./whitelist.js";
const USER_AGENT = "gspec/0.1 (+https://github.com/franzenzenhofer/google-spec-research)";
const TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;
const RETRIES = 2;
const noHeaders = () => ({});
async function fetchOnce(url, headers) {
    return fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
            "user-agent": USER_AGENT,
            accept: "text/html,application/json,text/plain,*/*",
            "accept-language": "en-US,en;q=0.9",
            ...headers(url),
        },
    });
}
async function fetchWithRetry(url, headers) {
    let lastError;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
        try {
            const response = await fetchOnce(url, headers);
            if (response.status < 500)
                return response;
            lastError = new Error(`HTTP ${response.status} for ${url.href}`);
        }
        catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
/**
 * Fetch a whitelisted URL. Every redirect hop is checked against the whitelist again,
 * so an official URL cannot redirect us onto an unofficial host.
 */
export async function fetchOfficial(input, headers = noHeaders) {
    let { url } = assertWhitelisted(input);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const response = await fetchWithRetry(url, headers);
        const location = response.headers.get("location");
        if (response.status >= 300 && response.status < 400 && location) {
            url = assertWhitelisted(new URL(location, url).href).url;
            continue;
        }
        if (!response.ok)
            throw new Error(`HTTP ${response.status} for ${url.href}`);
        const body = await response.text();
        return { requestedUrl: input, finalUrl: url.href, body, contentType: response.headers.get("content-type") ?? "" };
    }
    throw new Error(`Too many redirects starting at ${input}`);
}
