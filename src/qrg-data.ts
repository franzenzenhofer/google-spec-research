import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cached } from "./cache.js";
import { fetchOfficial, type HeaderProvider } from "./http.js";
import { QRG_REPO } from "./sources.js";

/** Contract of json/qrg.json in the companion repository. */
export interface QrgSection {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly level: number;
  readonly pageStart: number;
  readonly pageEnd: number;
  readonly text: string;
}

export interface QrgDocument {
  readonly version: string;
  readonly sourceUrl: string;
  readonly sha256: string;
  readonly sections: readonly QrgSection[];
}

export const QRG_RAW_BASE = `https://raw.githubusercontent.com/${QRG_REPO}/main`;
export const QRG_JSON_URL = `${QRG_RAW_BASE}/json/qrg.json`;

/** The rater guidelines as published by the mirror: structured sections plus the full markdown with page markers. */
export interface QrgCorpus {
  readonly doc: QrgDocument;
  readonly markdown: string;
}

function fail(what: string): never {
  throw new Error(`qrg.json does not match the contract: ${what}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSection(value: unknown, index: number): QrgSection {
  if (!isRecord(value)) fail(`sections[${index}] is not an object`);
  const { id, number, title, level, pageStart, pageEnd, text } = value;
  if (typeof id !== "string" || typeof title !== "string" || typeof text !== "string") fail(`sections[${index}] strings`);
  if (typeof level !== "number" || typeof pageStart !== "number" || typeof pageEnd !== "number") fail(`sections[${index}] numbers`);
  if (typeof number !== "string" && typeof number !== "number" && number !== null) fail(`sections[${index}].number`);
  return { id, number: number === null ? "" : String(number), title, level, pageStart, pageEnd, text };
}

/** Validate untrusted JSON against the contract; fail loudly on any drift. */
export function parseQrg(value: unknown): QrgDocument {
  if (!isRecord(value)) fail("root is not an object");
  const { version, sourceUrl, sha256, sections } = value;
  if (typeof version !== "string" || typeof sourceUrl !== "string" || typeof sha256 !== "string") fail("version/sourceUrl/sha256");
  if (!Array.isArray(sections) || sections.length === 0) fail("sections is empty");
  return { version, sourceUrl, sha256, sections: sections.map(parseSection) };
}

/** While the mirror repo is private, a GitHub token (GH_TOKEN or GITHUB_TOKEN) is sent to raw.githubusercontent.com only. */
const githubToken: HeaderProvider = (url) => {
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  return token && url.hostname === "raw.githubusercontent.com" ? { authorization: `token ${token}` } : {};
};

async function loadRemote(): Promise<QrgCorpus> {
  const [json, markdown] = await Promise.all([
    fetchOfficial(QRG_JSON_URL, githubToken),
    fetchOfficial(`${QRG_RAW_BASE}/markdown/qrg.md`, githubToken),
  ]);
  return { doc: parseQrg(JSON.parse(json.body) as unknown), markdown: markdown.body };
}

async function loadLocal(dir: string): Promise<QrgCorpus> {
  const [json, markdown] = await Promise.all([
    readFile(join(dir, "json", "qrg.json"), "utf8"),
    readFile(join(dir, "markdown", "qrg.md"), "utf8"),
  ]);
  return { doc: parseQrg(JSON.parse(json) as unknown), markdown };
}

/** Load the QRG: GSPEC_QRG_DIR (a local clone) wins, otherwise the published mirror, cached for a day. */
export async function loadQrg(): Promise<QrgCorpus> {
  const localDir = process.env.GSPEC_QRG_DIR;
  if (localDir) return loadLocal(localDir);
  try {
    const corpus = await cached("qrg-v2", loadRemote);
    return { doc: parseQrg(corpus.doc), markdown: corpus.markdown };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not load the Quality Rater Guidelines from ${QRG_RAW_BASE} (${reason}). Set GSPEC_QRG_DIR to a local clone of https://github.com/${QRG_REPO}.`, { cause: error });
  }
}
