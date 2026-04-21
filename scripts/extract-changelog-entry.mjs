import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const version = process.argv[2];

if (!version) {
	throw new Error("Usage: node scripts/extract-changelog-entry.mjs <version>");
}

const changelogPath = path.join(rootDir, "CHANGELOG.md");
const changelog = fs.readFileSync(changelogPath, "utf8");
const header = `## [${version}] - `;
const startIndex = changelog.indexOf(header);

if (startIndex === -1) {
	throw new Error(`Could not find CHANGELOG.md entry for version ${version}`);
}

const bodyStartIndex = changelog.indexOf("\n\n", startIndex);

if (bodyStartIndex === -1) {
	throw new Error(`CHANGELOG.md entry for version ${version} is malformed`);
}

const nextSectionIndex = changelog.indexOf("\n## [", bodyStartIndex + 2);
const notes = changelog
	.slice(
		bodyStartIndex + 2,
		nextSectionIndex === -1 ? changelog.length : nextSectionIndex,
	)
	.trim();

if (!notes) {
	throw new Error(`CHANGELOG.md entry for version ${version} is empty`);
}

process.stdout.write(`${notes}\n`);
