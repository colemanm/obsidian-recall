# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- BRAT-compatible GitHub Releases are now published with root-level `main.js`, `manifest.json`, and `styles.css` assets for beta installs.

### Changed

- Maintainer version scripts now promote changelog notes into dated release sections and create plain semver tags that match `manifest.json`.

### Deprecated

- None yet.

### Removed

- None yet.

### Fixed

- None yet.

### Security

- None yet.

## [1.3.0] - 2026-03-25

### Added

- Onboarding experience when the Readwise CLI is not installed: shows a setup screen in the sidebar with install instructions and a notice on plugin load.
- "Go Deeper" button on highlight cards: use a highlight's text as a new similarity search query to follow chains of related ideas through your Readwise library.
- "Back" button in the toolbar to retrace your steps through the similarity chain without re-querying the API.
- History stack that tracks previous search results; switching notes automatically resets the chain.

### Changed

- Renamed plugin from "Recall" to "Surface" (plugin ID, class names, CSS classes, commands, UI strings).

### Removed

- Removed duplicate "Search Readwise for current note" command (identical to "Open Recall sidebar").

### Fixed

- Debounce delay setting now actually debounces note-switch searches (was previously ignored).
- Highlight text with newlines no longer breaks the blockquote callout on insert.
- Wikilink-like characters in highlight titles/authors are now escaped on insert.
- CLI JSON parse errors now show a helpful message instead of a raw SyntaxError.
- Avoid fetching highlights from Readwise when the Surface panel is hidden (e.g., another sidebar tab is active). Searches now only run when the panel is visible.
- Fix "Insert" button on quote cards not inserting into the active editor. The button now tracks the last active markdown leaf and re-focuses the editor before inserting, and shows a notice if no note is open.
- Cap "Go Deeper" history stack at 20 entries to prevent unbounded memory growth.
- Private settings API access wrapped in try/catch for forward compatibility.

### Security

- Validate URLs from Readwise API before opening — only http/https schemes are allowed.
- Replaced inline `require("fs")` with proper ES module import.

## [1.0.0] - 2026-03-11

### Added

- Initial release of the Recall plugin.
