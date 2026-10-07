import { REJECTION_REASON, SOURCE_RULES, type SourceRule } from "./sources.js";

export type WhitelistResult =
  | { readonly ok: true; readonly url: URL; readonly rule: SourceRule }
  | { readonly ok: false; readonly input: string; readonly reason: string };

function parseUrl(input: string): URL | undefined {
  try {
    return new URL(input.trim());
  } catch {
    return undefined;
  }
}

function pathMatches(pathname: string, prefix: string): boolean {
  if (prefix === "/") return true;
  if (prefix.endsWith("/")) return pathname.startsWith(prefix);
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function findRule(url: URL): SourceRule | undefined {
  const host = url.hostname.toLowerCase();
  return SOURCE_RULES.find(
    (rule) => rule.host === host && rule.pathPrefixes.some((prefix) => pathMatches(url.pathname, prefix)),
  );
}

function reject(input: string, why: string): WhitelistResult {
  return { ok: false, input, reason: `${why}. ${REJECTION_REASON}` };
}

/** Decide whether a URL is an accepted official source. http is upgraded to https. */
export function checkUrl(input: string): WhitelistResult {
  const url = parseUrl(input);
  if (!url) return reject(input, `"${input}" is not an absolute URL`);
  if (url.protocol !== "https:" && url.protocol !== "http:") return reject(input, `protocol ${url.protocol} is not allowed`);
  if (url.username !== "" || url.password !== "") return reject(input, "URLs with credentials are not allowed");
  if (url.port !== "") return reject(input, "URLs with an explicit port are not allowed");
  url.protocol = "https:";
  const rule = findRule(url);
  if (!rule) return reject(input, `${url.hostname}${url.pathname} is not on the whitelist`);
  return { ok: true, url, rule };
}

/** Throwing variant for code paths where a non-whitelisted URL is a programming or redirect error. */
export function assertWhitelisted(input: string): { url: URL; rule: SourceRule } {
  const result = checkUrl(input);
  if (!result.ok) throw new Error(`Rejected source: ${result.reason}`);
  return { url: result.url, rule: result.rule };
}
