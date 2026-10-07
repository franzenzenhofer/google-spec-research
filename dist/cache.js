import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join } from "node:path";
const DAY_MS = 24 * 60 * 60 * 1000;
/** Per-OS cache directory; GSPEC_CACHE_DIR overrides it. */
export function cacheDir() {
    const override = process.env.GSPEC_CACHE_DIR;
    if (override)
        return override;
    if (platform() === "win32")
        return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "gspec");
    if (platform() === "darwin")
        return join(homedir(), "Library", "Caches", "gspec");
    return join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "gspec");
}
/** Return the cached value for key if younger than maxAgeMs, otherwise compute, store and return it. */
export async function cached(key, compute, maxAgeMs = DAY_MS) {
    const file = join(cacheDir(), `${key}.json`);
    try {
        const envelope = JSON.parse(await readFile(file, "utf8"));
        if (Date.now() - envelope.savedAt < maxAgeMs)
            return envelope.value;
    }
    catch {
        // Missing or unreadable cache entry: recompute below.
    }
    const value = await compute();
    await mkdir(cacheDir(), { recursive: true });
    await writeFile(file, JSON.stringify({ savedAt: Date.now(), value }));
    return value;
}
