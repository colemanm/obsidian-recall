# Claude Code Instructions

## Versioning & Changelog (Required for all code changes)

After implementing any user-facing change, you MUST:

1. **Classify** the change as patch, minor, or major (see rules below).
2. **Bump the version** by running the appropriate npm script.
3. **Update `CHANGELOG.md`** under `## [Unreleased]` in the same change set.

### How to classify changes

| Level | When to use | Examples |
|-------|-------------|---------|
| **Patch** (`npm run version:patch`) | Bug fixes, typo/copy fixes, internal refactors with no behavior change | Fix highlight not rendering, fix typo in settings label |
| **Minor** (`npm run version:minor`) | New features, new settings, non-breaking enhancements | Add dark-mode support, new sidebar panel, expose a new API |
| **Major** (`npm run version:major`) | Breaking changes, removed features, changes requiring user migration | Rename/remove a setting key, change data format, drop support for old Obsidian versions |

When in doubt, prefer the **lower** bump (e.g., patch over minor).

### Version sync

- `package.json` is the source of truth. `manifest.json` is kept in sync automatically by the npm version scripts.
- The npm scripts (`npm run version:patch`, etc.) handle the version commit, git tag, and manifest sync.

### Changelog format

Add entries under `## [Unreleased]` in the appropriate section: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security**.

- Keep entries concise and user-facing (what changed, why it matters).
- Remove "None yet." placeholder lines when adding the first real entry to a section.
- At release time, move `Unreleased` entries into a dated version heading (e.g., `## [1.1.0] - 2026-03-15`) and restore empty `Unreleased` placeholders.

### When NOT to bump

Do not bump the version for changes that are purely internal and invisible to users:
- Updating CLAUDE.md, AGENTS.md, or other dev docs
- CI/build config changes that don't affect the shipped plugin
- Adding/updating dev dependencies only
