import { execFile } from "child_process";
import { ReadwiseHighlight, ReadwiseHighlightRaw, ReaderDocument } from "./types";

const TIMEOUT_MS = 15_000;

const COMMON_BIN_DIRS = [
	"/opt/homebrew/bin",
	"/usr/local/bin",
	"/usr/bin",
	"/bin",
];

const COMMON_PATHS = COMMON_BIN_DIRS.map((d) => `${d}/readwise`);

export function resolveCliPath(configured: string): string {
	if (configured && configured !== "readwise") {
		return configured;
	}
	// On macOS, Obsidian doesn't inherit shell PATH.
	// Try common locations.
	const fs = require("fs");
	for (const p of COMMON_PATHS) {
		try {
			fs.accessSync(p, fs.constants.X_OK);
			return p;
		} catch {
			// not found, continue
		}
	}
	return configured || "readwise";
}

function run(cliPath: string, args: string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		const env = {
			...process.env,
			PATH: COMMON_BIN_DIRS.join(":") + ":" + (process.env.PATH || ""),
		};
		execFile(
			cliPath,
			args,
			{ timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024, env },
			(error, stdout, stderr) => {
				if (error) {
					const msg = stderr?.trim() || error.message;
					reject(new Error(`readwise CLI error: ${msg}`));
				} else {
					resolve(stdout);
				}
			}
		);
	});
}

export async function searchHighlights(
	term: string,
	limit: number,
	cliPath: string
): Promise<ReadwiseHighlight[]> {
	const resolved = resolveCliPath(cliPath);
	const stdout = await run(resolved, [
		"readwise-search-highlights",
		"--vector-search-term",
		term,
		"--limit",
		String(limit),
		"--json",
	]);
	const parsed = JSON.parse(stdout);
	const raw: ReadwiseHighlightRaw[] = Array.isArray(parsed)
		? parsed
		: parsed.results ?? [];
	return raw.map((r) => ({
		id: r.id,
		text: r.attributes.highlight_plaintext,
		title: r.attributes.document_title,
		author: r.attributes.document_author,
		url: r.url,
		note: r.attributes.highlight_note,
		category: r.attributes.document_category,
		tags: r.attributes.highlight_tags ?? [],
		score: r.score,
	}));
}

export async function searchDocuments(
	query: string,
	limit: number,
	cliPath: string
): Promise<ReaderDocument[]> {
	const resolved = resolveCliPath(cliPath);
	const stdout = await run(resolved, [
		"reader-search-documents",
		"--vector-search-term",
		query,
		"--limit",
		String(limit),
		"--json",
	]);
	const parsed = JSON.parse(stdout);
	if (Array.isArray(parsed)) {
		return parsed;
	}
	if (parsed.results && Array.isArray(parsed.results)) {
		return parsed.results;
	}
	return [];
}
