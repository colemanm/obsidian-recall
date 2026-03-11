# AGENTS Instructions

## Semantic Versioning Policy

This project uses [Semantic Versioning](https://semver.org/) and tracks changes in `CHANGELOG.md`.

### Source of truth and sync

- `package.json` is the source of truth for the project version.
- `manifest.json` must always match `package.json` for Obsidian plugin compatibility.
- Run `node scripts/sync-version.mjs` (or any script that triggers it) before build/release work.

### Version bump rules

For user-facing changes, increment the version using one of the following:

| Level | When to use | Examples |
|-------|-------------|---------|
| **Patch** (`npm run version:patch`) | Bug fixes, typo/copy fixes, internal refactors with no behavior change | Fix highlight not rendering, fix typo in settings label |
| **Minor** (`npm run version:minor`) | New features, new settings, non-breaking enhancements | Add dark-mode support, new sidebar panel, expose a new API |
| **Major** (`npm run version:major`) | Breaking changes, removed features, changes requiring user migration | Rename/remove a setting key, change data format, drop support for old Obsidian versions |

When in doubt, prefer the **lower** bump (e.g., patch over minor).

The npm scripts handle the version commit, git tag, and `manifest.json` sync automatically.

### When NOT to bump

Do not bump the version for changes that are purely internal and invisible to users:
- Updating CLAUDE.md, AGENTS.md, or other dev docs
- CI/build config changes that don't affect the shipped plugin
- Adding/updating dev dependencies only

## CHANGELOG Workflow (Required)

When implementing work, update `CHANGELOG.md` in the same change set.

- Add entries under `## [Unreleased]` as work happens.
- Place each entry under the appropriate section: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Keep entries concise and user-facing (what changed and why it matters).
- Remove "None yet." placeholder lines when adding the first real entry to a section.
- At release time, move `Unreleased` entries into a dated version section (for example: `## [1.0.1] - YYYY-MM-DD`) and reset `Unreleased` placeholders.

## Prompt-time Agent Behavior

For future coding prompts in this repository, agents should:

1. Classify the change impact (patch/minor/major).
2. Bump the version accordingly.
3. Ensure `manifest.json` version matches `package.json`.
4. Update `CHANGELOG.md` under `Unreleased` during implementation.
5. If releasing, promote `Unreleased` notes into the new version section.
