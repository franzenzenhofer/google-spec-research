#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXIT, fetchCommand, qrgCommand, quoteCommand, searchCommand, sourcesCommand } from "./commands.js";
export const VERSION = "0.1.0";
const USAGE = `gspec ${VERSION} - answer SEO/GEO questions from official Google sources only

Usage:
  gspec fetch <url>               Read an official page as markdown, with source URL and last-updated date
  gspec quote <url> "<text>"      Verify the text is verbatim on the page; print a #:~:text= deep link (exit 1 if not found)
  gspec qrg <search terms>        Search the Search Quality Rater Guidelines; print passages with PDF #page=N links
  gspec search <terms>            Find official pages by title (Search Central, web.dev, Chrome, Search Console Help)
  gspec sources                   Print the whitelist and the main entry pages

Exit codes: 0 ok, 1 not found, 2 rejected source or usage error, 3 network or data error.`;
const consoleOutput = {
    out: (line) => process.stdout.write(`${line}\n`),
    err: (line) => process.stderr.write(`${line}\n`),
};
function usageError(io, message) {
    io.err(`${message}\n\n${USAGE}`);
    return EXIT.rejected;
}
/** Dispatch one command line. Returns the process exit code. */
export async function run(argv, io = consoleOutput) {
    const [command, ...rest] = argv;
    const joined = rest.join(" ").trim();
    switch (command) {
        case "fetch":
            return rest[0] ? fetchCommand(rest[0], io) : usageError(io, "fetch needs a URL");
        case "quote":
            return rest[0] && rest.length > 1 ? quoteCommand(rest[0], rest.slice(1).join(" "), io) : usageError(io, "quote needs a URL and the text");
        case "qrg":
            return joined ? qrgCommand(joined, io) : usageError(io, "qrg needs search terms");
        case "search":
            return joined ? searchCommand(joined, io) : usageError(io, "search needs search terms");
        case "sources":
            return sourcesCommand(io);
        case "--version":
        case "-v":
            io.out(VERSION);
            return EXIT.ok;
        case undefined:
        case "help":
        case "--help":
        case "-h":
            io.out(USAGE);
            return EXIT.ok;
        default:
            return usageError(io, `Unknown command: ${command}`);
    }
}
function isMain() {
    const entry = process.argv[1];
    if (!entry)
        return false;
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
}
if (isMain()) {
    process.stdout.on("error", (error) => {
        if (error.code === "EPIPE")
            process.exit(0);
        throw error;
    });
    run(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (error) => {
        process.stderr.write(`gspec: ${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = EXIT.error;
    });
}
