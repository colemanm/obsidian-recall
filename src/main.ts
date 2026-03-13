import { Menu, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { RecallSettings, DEFAULT_SETTINGS, SearchResult, HistoryEntry } from "./types";
import { RecallView, VIEW_TYPE_RECALL } from "./RecallView";
import { RecallSettingTab } from "./RecallSettingTab";
import { searchHighlights, searchDocuments } from "./readwiseCli";

export default class RecallPlugin extends Plugin {
	settings: RecallSettings;
	private generation = 0;
	private currentFilePath: string | null = null;
	private historyStack: HistoryEntry[] = [];
	private currentResults: SearchResult[] = [];
	private currentLabel?: string;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_RECALL, (leaf) => new RecallView(leaf));

		this.addRibbonIcon("book-open", "Open Recall sidebar", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-recall-sidebar",
			name: "Open Recall sidebar",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "search-readwise-current-note",
			name: "Search Readwise for current note",
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: "search-readwise-selection",
			name: "Search Readwise for selection",
			editorCallback: async (editor) => {
				const sel = editor.getSelection();
				if (sel.trim()) {
					await this.activateView(true);
					this.executeSearch(sel.trim(), "Selection search");
				}
			},
		});

		this.addSettingTab(new RecallSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor) => {
				const sel = editor.getSelection().trim();
				if (sel) {
					menu.addItem((item) => {
						item.setTitle("Search Readwise for selection")
							.setIcon("book-open")
							.onClick(async () => {
								await this.activateView(true);
								this.executeSearch(sel, "Selection search");
							});
					});
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				if (!this.isRecallViewVisible()) return;
				const file = this.app.workspace.getActiveFile();
				const path = file?.path ?? null;
				if (path && path !== this.currentFilePath) {
					this.currentFilePath = path;
					this.triggerSearch();
				}
			})
		);
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_RECALL);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async activateView(skipSearch = false): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_RECALL);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_RECALL,
					active: true,
				});
			}
		}

		if (leaf) {
			await workspace.revealLeaf(leaf);
		}

		if (!skipSearch) {
			this.triggerSearch();
		}
	}

	private async triggerSearch(): Promise<void> {
		// Note switch resets the history chain
		this.historyStack = [];
		this.currentResults = [];
		this.currentLabel = undefined;

		if (!this.isRecallViewVisible()) return;
		const view = this.getView();
		if (!view) return;

		const file = this.app.workspace.getActiveFile();
		if (!file || !(file instanceof TFile) || file.extension !== "md") {
			view.renderNoFile();
			return;
		}

		const searchTerm = await this.buildSearchTerm(file);

		if (!searchTerm) {
			view.renderNoFile();
			return;
		}

		await this.executeSearch(searchTerm);
	}

	private async executeSearch(term: string, searchLabel?: string): Promise<void> {
		const view = this.getView();
		if (!view) return;

		const gen = ++this.generation;
		view.renderLoading();

		try {
			const results: SearchResult[] = [];
			const { searchMode, resultLimit, readwisePath } = this.settings;

			if (searchMode === "highlights" || searchMode === "both") {
				const highlights = await searchHighlights(term, resultLimit, readwisePath);
				for (const h of highlights) {
					results.push({ type: "highlight", data: h });
				}
			}

			if (searchMode === "documents" || searchMode === "both") {
				const docs = await searchDocuments(term, resultLimit, readwisePath);
				for (const d of docs) {
					results.push({ type: "document", data: d });
				}
			}

			// Discard stale results
			if (gen !== this.generation) return;

			this.currentResults = results;
			this.currentLabel = searchLabel;
			const hasHistory = this.historyStack.length > 0;

			if (results.length === 0) {
				view.renderEmpty(searchLabel, hasHistory);
			} else {
				view.renderResults(results, searchLabel, hasHistory);
			}
		} catch (err: unknown) {
			if (gen !== this.generation) return;
			const message = err instanceof Error ? err.message : String(err);
			view.renderError(message);
		}
	}

	private goDeeper(highlightText: string): void {
		// Push current results onto the history stack
		this.historyStack.push({
			results: this.currentResults,
			searchLabel: this.currentLabel,
		});

		const truncated = highlightText.length > 60
			? highlightText.slice(0, 57) + "..."
			: highlightText;
		this.executeSearch(highlightText, `Deeper: ${truncated}`);
	}

	private goBack(): void {
		const entry = this.historyStack.pop();
		if (!entry) return;

		const view = this.getView();
		if (!view) return;

		this.currentResults = entry.results;
		this.currentLabel = entry.searchLabel;
		const hasHistory = this.historyStack.length > 0;

		if (entry.results.length === 0) {
			view.renderEmpty(entry.searchLabel, hasHistory);
		} else {
			view.renderResults(entry.results, entry.searchLabel, hasHistory);
		}
	}

	private async buildSearchTerm(file: TFile): Promise<string> {
		const content = await this.app.vault.cachedRead(file);
		const cache = this.app.metadataCache.getFileCache(file);
		const parts: string[] = [];

		// 1. Title (file basename)
		parts.push(file.basename);

		// 2. Frontmatter tags, topics, and other semantic properties
		if (cache?.frontmatter) {
			const fm = cache.frontmatter;
			const props = ["tags", "topics", "categories", "keywords", "subject"];
			for (const prop of props) {
				const val = fm[prop];
				if (!val) continue;
				if (Array.isArray(val)) {
					parts.push(val.join(" "));
				} else if (typeof val === "string") {
					parts.push(val);
				}
			}
		}

		// 3. Strip frontmatter from body
		let body = content;
		if (cache?.frontmatterPosition) {
			body = content.slice(cache.frontmatterPosition.end.offset + 1);
		}

		// 4. Extract headings
		if (cache?.headings && cache.headings.length > 0) {
			parts.push(cache.headings.map((h) => h.heading).join(" "));
		}

		// 5. First paragraph (first non-empty, non-heading block of text)
		const lines = body.split("\n");
		let paragraph = "";
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			paragraph = trimmed;
			break;
		}
		if (paragraph) {
			parts.push(paragraph.slice(0, this.settings.searchContentLength));
		}

		return parts.join(" ").trim();
	}

	private getView(): RecallView | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RECALL);
		if (leaves.length > 0) {
			const view = leaves[0].view as RecallView;
			if (!view.onRefresh) {
				view.onRefresh = () => this.triggerSearch();
			}
			if (!view.onGoDeeper) {
				view.onGoDeeper = (text) => this.goDeeper(text);
			}
			if (!view.onBack) {
				view.onBack = () => this.goBack();
			}
			return view;
		}
		return null;
	}

	/**
	 * Returns true if the Recall panel exists and is currently visible
	 * (not deferred/hidden because the user switched to another tab).
	 */
	private isRecallViewVisible(): boolean {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RECALL);
		if (leaves.length === 0) return false;
		const leaf = leaves[0];
		// isDeferred (Obsidian 1.7.2+): true when tab is in background
		return (leaf as { isDeferred?: boolean }).isDeferred !== true;
	}
}
