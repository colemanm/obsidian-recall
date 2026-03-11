import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const packagePath = path.join(rootDir, "package.json");
const manifestPath = path.join(rootDir, "manifest.json");

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (!packageJson.version) {
	throw new Error("package.json is missing a version field");
}

manifestJson.version = packageJson.version;

fs.writeFileSync(manifestPath, `${JSON.stringify(manifestJson, null, "	")}
`);
console.log(`Synced manifest.json version to ${packageJson.version}`);
