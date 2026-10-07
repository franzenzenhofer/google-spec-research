import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cached } from "./cache.js";
import { fetchOfficial } from "./http.js";
import { QRG_REPO } from "./sources.js";
export const QRG_JSON_URL = `https://raw.githubusercontent.com/${QRG_REPO}/main/json/qrg.json`;
function fail(what) {
    throw new Error(`qrg.json does not match the contract: ${what}`);
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function parseSection(value, index) {
    if (!isRecord(value))
        fail(`sections[${index}] is not an object`);
    const { id, number, title, level, pageStart, pageEnd, text } = value;
    if (typeof id !== "string" || typeof title !== "string" || typeof text !== "string")
        fail(`sections[${index}] strings`);
    if (typeof level !== "number" || typeof pageStart !== "number" || typeof pageEnd !== "number")
        fail(`sections[${index}] numbers`);
    if (typeof number !== "string" && typeof number !== "number")
        fail(`sections[${index}].number`);
    return { id, number: String(number), title, level, pageStart, pageEnd, text };
}
/** Validate untrusted JSON against the contract; fail loudly on any drift. */
export function parseQrg(value) {
    if (!isRecord(value))
        fail("root is not an object");
    const { version, sourceUrl, sha256, sections } = value;
    if (typeof version !== "string" || typeof sourceUrl !== "string" || typeof sha256 !== "string")
        fail("version/sourceUrl/sha256");
    if (!Array.isArray(sections) || sections.length === 0)
        fail("sections is empty");
    return { version, sourceUrl, sha256, sections: sections.map(parseSection) };
}
/** While the mirror repo is private, a GitHub token (GH_TOKEN or GITHUB_TOKEN) is sent to raw.githubusercontent.com only. */
const githubToken = (url) => {
    const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
    return token && url.hostname === "raw.githubusercontent.com" ? { authorization: `token ${token}` } : {};
};
async function loadRemote() {
    const page = await fetchOfficial(QRG_JSON_URL, githubToken);
    return parseQrg(JSON.parse(page.body));
}
/** Load the QRG: GSPEC_QRG_DIR (a local clone) wins, otherwise the published mirror, cached for a day. */
export async function loadQrg() {
    const localDir = process.env.GSPEC_QRG_DIR;
    if (localDir)
        return parseQrg(JSON.parse(await readFile(join(localDir, "json", "qrg.json"), "utf8")));
    try {
        return parseQrg(await cached("qrg-v1", loadRemote));
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not load the Quality Rater Guidelines from ${QRG_JSON_URL} (${reason}). Set GSPEC_QRG_DIR to a local clone of https://github.com/${QRG_REPO}.`, { cause: error });
    }
}
