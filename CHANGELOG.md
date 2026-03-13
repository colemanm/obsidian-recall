# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- None yet.

### Changed

- None yet.

### Deprecated

- None yet.

### Removed

- None yet.

### Fixed

- Avoid fetching highlights from Readwise when the Recall panel is hidden (e.g., another sidebar tab is active). Searches now only run when the panel is visible.
- Fix "Insert" button on quote cards not inserting into the active editor. The button now tracks the last active markdown leaf and re-focuses the editor before inserting, and shows a notice if no note is open.

### Security

- None yet.

## [1.0.0] - 2026-03-11

### Added

- Initial release of the Recall plugin.
