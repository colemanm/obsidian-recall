import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const packagePath = path.join(rootDir, "package.json");
const manifestPath = path.join(rootDir, "manifest.json");
const changelogPath = path.join(rootDir, "CHANGELOG.md");

const EMPTY_UNRELEASED_SECTION = `### Added

- None yet.

### Changed

- None yet.

### Deprecated

- None yet.

### Removed

- None yet.

### Fixed

- None yet.

### Security

- None yet.`;

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, "\t")}\n`);
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const packageJson = readJson(packagePath);
const manifestJson = readJson(manifestPath);
const version = packageJson.version;

if (!version) {
	throw new Error("package.json is missing a version field");
}

if (manifestJson.version !== version) {
	manifestJson.version = version;
	writeJson(manifestPath, manifestJson);
}

const changelog = fs.readFileSync(changelogPath, "utf8");

if (new RegExp(`^## \\[${escapeRegExp(version)}\\]`, "m").test(changelog)) {
	throw new Error(`CHANGELOG.md already contains a section for ${version}`);
}

const unreleasedMatch = changelog.match(
	/^## \[Unreleased\]\n\n([\s\S]*?)(?=^## \[[^\]]+\])/m,
);

if (!unreleasedMatch) {
	throw new Error("Could not find the Unreleased section in CHANGELOG.md");
}

const unreleasedBody = unreleasedMatch[1].trim();
const hasRealEntries = unreleasedBody
	.split("\n")
	.some((line) => line.startsWith("- ") && line.trim() !== "- None yet.");

if (!hasRealEntries) {
	throw new Error(
		"CHANGELOG.md Unreleased section has no release notes to promote",
	);
}

const today = new Date().toISOString().slice(0, 10);
const newSection = `## [Unreleased]

${EMPTY_UNRELEASED_SECTION}

## [${version}] - ${today}

${unreleasedBody}
`;

const updatedChangelog = changelog.replace(unreleasedMatch[0], `${newSection}\n`);
fs.writeFileSync(changelogPath, updatedChangelog);

console.log(`Prepared manifest.json and CHANGELOG.md for release ${version}`);
