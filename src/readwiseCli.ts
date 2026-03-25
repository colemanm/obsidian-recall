import { execFile } from "child_process";
import { accessSync, constants } from "fs";
import { ReadwiseHighlight, ReadwiseHighlightRaw, ReaderDocument } from "./types";

const TIMEOUT_MS = 15_000;

const COMMON_BIN_DIRS = [
	"/opt/homebrew/bin",
	"/usr/local/bin",
	"/usr/bin",
	"/bin",
];

const COMMON_PATHS = COMMON_BIN_DIRS.map((d) => `${d}/readwise`);

export function isCliInstalled(configured: string): Promise<boolean> {
	const resolved = resolveCliPath(configured);
	// If resolveCliPath found a concrete path (not the bare "readwise" fallback), it's installed.
	if (resolved !== "readwise") return Promise.resolve(true);
	// Last resort: try `which readwise` to check if it's on PATH at runtime.
	return new Promise((resolve) => {
		execFile("which", ["readwise"], { timeout: 3000 }, (error) => {
			resolve(!error);
		});
	});
}

export function resolveCliPath(configured: string): string {
	if (configured && configured !== "readwise") {
		return configured;
	}
	// On macOS, Obsidian doesn't inherit shell PATH.
	// Try common locations.
	for (const p of COMMON_PATHS) {
		try {
			accessSync(p, constants.X_OK);
			return p;
		} catch {
			// not found, continue
		}
	}
	return configured || "readwise";
}

function parseCliJson(stdout: string): unknown {
	try {
		return JSON.parse(stdout);
	} catch {
		throw new Error("Readwise CLI returned invalid JSON. Check that the CLI is authenticated and working.");
	}
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
	const parsed = parseCliJson(stdout);
	const raw: ReadwiseHighlightRaw[] = Array.isArray(parsed)
		? parsed
		: (parsed as any).results ?? [];
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
	const parsed = parseCliJson(stdout);
	if (Array.isArray(parsed)) {
		return parsed;
	}
	if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).results)) {
		return (parsed as any).results;
	}
	return [];
}
