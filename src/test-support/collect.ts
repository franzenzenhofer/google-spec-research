import type { Output } from "../commands.js";

/** A real Output that records lines, so CLI tests can read what a user would see. */
export function collector(): Output & { readonly stdout: string[]; readonly stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return { stdout, stderr, out: (line) => stdout.push(line), err: (line) => stderr.push(line) };
}
