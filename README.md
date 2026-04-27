# Surface

**Surface Readwise highlights and documents semantically related to your current note.**

Surface is an [Obsidian](https://obsidian.md) plugin that uses the [Readwise](https://readwise.io) CLI to run vector/semantic search over your highlights and saved articles. When you have a note open (or text selected), Surface shows related highlights and documents in a sidebar so you can pull quotes and ideas into your vault without leaving the editor.

## Features

- **Sidebar view** — Open a "Surface" pane that lists highlights and/or documents related to the active note.
- **Automatic search** — Switching to a different note triggers a new search (with configurable debounce).
- **Search by selection** — Select text in the editor and run "Search Readwise for selection" to find related content for just that snippet.
- **Insert as callout** — From any highlight card, click **Insert** to paste it into the active note as a `> [!quote]` callout with title, author, and text.
- **Go Deeper** — Click **Go Deeper** on any highlight to use its text as a new search query, following chains of similar ideas through your library. Use the **Back** button to retrace your steps.
- **Search mode** — Choose to search highlights only, documents only, or both. Document results show title, author, summary, category, and site name.
- **Jump to source** — Highlight cards link "Open in Readwise"; document cards link "Open source" to jump to the original article.
- **First-run setup help** — If the Readwise CLI isn't detected, the sidebar shows install instructions with **Check again** and **Open settings** buttons.

## Requirements

- **Obsidian** 0.15.0 or newer (desktop).
- **Readwise** account with highlights and/or Reader documents.
- **[Readwise CLI](https://readwise.io/cli)** installed and on your PATH (or a path set in plugin settings). Install and authenticate:

  ```bash
  npm install -g @readwise/cli
  readwise login
  ```

  The CLI must support:

  - `readwise-search-highlights --vector-search-term <term> --limit <n> --json`
  - `reader-search-documents --vector-search-term <query> --limit <n> --json`

On macOS, if the CLI is installed via Homebrew (e.g. under `/opt/homebrew/bin` or `/usr/local/bin`), Surface will try those locations when the path is left as `readwise`. If the CLI isn't detected on plugin load, the Surface sidebar will show these same install steps with a **Check again** button.

## Installation

### Install via BRAT

1. Install the Readwise CLI and ensure it's working (vector search and JSON output).
2. In Obsidian, install and enable the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
3. In BRAT, choose **Add Beta plugin** and enter `colemanm/obsidian-surface`.
4. Let BRAT install the latest release, then enable **Surface** under **Settings → Community plugins**.
5. Open **Settings → Surface** and set the **Readwise CLI path** if it's not `readwise` on your PATH.

### Manual install

1. Download the latest `main.js`, `manifest.json`, and `styles.css` from the releases (or build from source).
2. Copy them into `VaultFolder/.obsidian/plugins/obsidian-surface/`.
3. Reload Obsidian and enable **Surface** under Community plugins.

## Usage

- **Open the sidebar** — Click the book icon in the left ribbon, or run the command **Open Surface sidebar**. The pane opens on the right and runs a search for the current note.
- **Search for selection** — Select text, then either run **Search Readwise for selection** from the command palette or use the editor context menu: **Search Readwise for selection**. Opens the Surface pane and searches using only the selected text.
- **Refresh** — In the Surface pane, use the **Refresh** button to run the search again with the same context.

### How the "current note" search term is built

When you switch notes, Surface builds a search string from:

1. Note title (file name)
2. Frontmatter: `tags`, `topics`, `categories`, `keywords`, `subject`
3. All headings in the note
4. The first paragraph of the body (length limited by **Search content length** in settings)

That string is sent to the Readwise CLI as the vector search term.

## Settings

| Setting | Description |
|--------|-------------|
| **Readwise CLI path** | Path to the `readwise` binary. Default `readwise` uses PATH / common macOS paths. |
| **Result limit** | Max number of results (1–50). Default 10. |
| **Search mode** | Search **Highlights**, **Documents**, or **Both**. |
| **Debounce delay (ms)** | Delay before running a search after changing the active note (200–5000 ms). Default 1000. |
| **Search content length** | Characters from the note body to include in the search term (100–2000). Default 500. |

## Building from source

```bash
git clone https://github.com/colemanm/obsidian-surface.git
cd obsidian-surface
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` (if present) from the project root into your vault's `.obsidian/plugins/obsidian-surface/` folder.

## Maintainer release flow

1. Add user-facing notes under `## [Unreleased]` in `CHANGELOG.md`.
2. Run `npm run version:patch`, `npm run version:minor`, or `npm run version:major`.
3. Push the resulting version commit and plain semver tag.
4. GitHub Actions builds the plugin and publishes a GitHub Release with `main.js`, `manifest.json`, and `styles.css` for BRAT.

## License

MIT.
