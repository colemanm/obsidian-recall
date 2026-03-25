import { ItemView, MarkdownView, Notice, WorkspaceLeaf } from "obsidian";
import { SearchResult, ReadwiseHighlight, ReaderDocument } from "./types";

function isSafeUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

export const VIEW_TYPE_RECALL = "recall-view";

export class RecallView extends ItemView {
	private contentEl_: HTMLElement;
	private lastMarkdownLeaf: WorkspaceLeaf | null = null;
	onRefresh: (() => void) | null = null;
	onGoDeeper: ((highlightText: string) => void) | null = null;
	onBack: (() => void) | null = null;
	onCheckCli: (() => void) | null = null;
	onOpenSettings: (() => void) | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.contentEl_ = this.contentEl;
	}

	getViewType(): string {
		return VIEW_TYPE_RECALL;
	}

	getDisplayText(): string {
		return "Recall";
	}

	getIcon(): string {
		return "book-open";
	}

	async onOpen(): Promise<void> {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (leaf && leaf.view instanceof MarkdownView) {
					this.lastMarkdownLeaf = leaf;
				}
			}),
		);
		// Seed with whatever markdown leaf is currently active.
		const active = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (active) {
			this.lastMarkdownLeaf = active.leaf;
		}
		this.renderNoFile();
	}

	async onClose(): Promise<void> {
		this.lastMarkdownLeaf = null;
		this.contentEl_.empty();
	}

	renderSetup(): void {
		this.contentEl_.empty();
		const el = this.contentEl_.createEl("div", { cls: "recall-setup" });

		el.createEl("h3", { text: "Readwise CLI not found" });
		el.createEl("p", {
			text: "Recall requires the Readwise CLI to search your highlights and documents.",
		});

		el.createEl("p", { text: "To install, run:" });
		const code = el.createEl("div", { cls: "recall-setup-code" });
		code.createEl("code", { text: "npm install -g @readwise/cli" });
		code.createEl("br");
		code.createEl("code", { text: "readwise login" });

		const linkP = el.createEl("p");
		const link = linkP.createEl("a", { text: "Readwise CLI docs", cls: "recall-link" });
		const docsUrl = "https://readwise.io/cli";
		link.href = docsUrl;
		link.addEventListener("click", (e) => {
			e.preventDefault();
			window.open(docsUrl);
		});

		const actions = el.createEl("div", { cls: "recall-setup-actions" });

		const checkBtn = actions.createEl("button", { cls: "mod-cta", text: "Check again" });
		checkBtn.addEventListener("click", () => {
			if (this.onCheckCli) this.onCheckCli();
		});

		const settingsBtn = actions.createEl("button", { text: "Open settings" });
		settingsBtn.addEventListener("click", () => {
			if (this.onOpenSettings) this.onOpenSettings();
		});
	}

	renderNoFile(): void {
		this.contentEl_.empty();
		this.contentEl_.createEl("div", {
			cls: "recall-status",
			text: "Open a note to see related highlights.",
		});
	}

	renderLoading(): void {
		this.contentEl_.empty();
		this.contentEl_.createEl("div", {
			cls: "recall-status",
			text: "Searching...",
		});
	}

	renderError(message: string): void {
		this.contentEl_.empty();
		const el = this.contentEl_.createEl("div", { cls: "recall-status recall-error" });
		el.createEl("strong", { text: "Error" });
		el.createEl("p", { text: message });
	}

	renderEmpty(searchLabel?: string, hasHistory?: boolean): void {
		this.contentEl_.empty();
		this.addToolbar(0, searchLabel, hasHistory);
		this.contentEl_.createEl("div", {
			cls: "recall-status",
			text: "No related highlights found.",
		});
	}

	renderResults(results: SearchResult[], searchLabel?: string, hasHistory?: boolean): void {
		this.contentEl_.empty();
		this.addToolbar(results.length, searchLabel, hasHistory);

		const container = this.contentEl_.createEl("div", { cls: "recall-results" });

		for (const result of results) {
			if (result.type === "highlight") {
				this.renderHighlightCard(container, result.data);
			} else {
				this.renderDocumentCard(container, result.data);
			}
		}
	}

	private addToolbar(count: number, searchLabel?: string, hasHistory?: boolean): void {
		const wrapper = this.contentEl_.createEl("div", { cls: "recall-toolbar" });

		const row = wrapper.createEl("div", { cls: "recall-toolbar-row" });

		const buttons = row.createEl("div", { cls: "recall-toolbar-buttons" });

		if (hasHistory) {
			const backBtn = buttons.createEl("button", {
				text: "\u2190 Back",
			});
			backBtn.addEventListener("click", () => {
				if (this.onBack) this.onBack();
			});
		}

		const btn = buttons.createEl("button", {
			text: "Refresh",
		});
		btn.addEventListener("click", () => {
			if (this.onRefresh) this.onRefresh();
		});

		row.createEl("span", {
			cls: "recall-count",
			text: `${count} result${count !== 1 ? "s" : ""}`,
		});

		if (searchLabel) {
			wrapper.createEl("div", {
				cls: "recall-search-label",
				text: searchLabel,
			});
		}
	}

	private renderHighlightCard(container: HTMLElement, h: ReadwiseHighlight): void {
		const card = container.createEl("div", { cls: "recall-card" });

		const header = card.createEl("div", { cls: "recall-card-header" });
		header.createEl("span", { cls: "recall-card-title", text: h.title || "Unknown source" });
		if (h.author) {
			header.createEl("span", { cls: "recall-card-author", text: ` — ${h.author}` });
		}

		card.createEl("blockquote", { cls: "recall-card-text", text: h.text });

		if (h.note) {
			card.createEl("div", { cls: "recall-card-note", text: h.note });
		}

		if (h.tags && h.tags.length > 0) {
			const tagsEl = card.createEl("div", { cls: "recall-card-tags" });
			for (const tag of h.tags) {
				tagsEl.createEl("span", { cls: "recall-tag", text: `#${tag}` });
			}
		}

		const actions = card.createEl("div", { cls: "recall-card-actions" });

		const insertBtn = actions.createEl("button", {
			cls: "mod-cta",
			text: "Insert",
		});
		insertBtn.addEventListener("click", () => {
			this.insertHighlight(h);
		});

		const deeperBtn = actions.createEl("button", {
			text: "Go Deeper \u2192",
		});
		deeperBtn.addEventListener("click", () => {
			if (this.onGoDeeper) this.onGoDeeper(h.text);
		});

		if (h.url && isSafeUrl(h.url)) {
			const link = actions.createEl("a", { cls: "recall-link", text: "Open in Readwise" });
			link.href = h.url;
			link.addEventListener("click", (e) => {
				e.preventDefault();
				window.open(h.url);
			});
		}
	}

	private renderDocumentCard(container: HTMLElement, d: ReaderDocument): void {
		const card = container.createEl("div", { cls: "recall-card recall-card-document" });

		const header = card.createEl("div", { cls: "recall-card-header" });
		header.createEl("span", { cls: "recall-card-title", text: d.title || "Untitled" });
		if (d.author) {
			header.createEl("span", { cls: "recall-card-author", text: ` — ${d.author}` });
		}

		if (d.summary) {
			card.createEl("p", { cls: "recall-card-summary", text: d.summary });
		}

		const meta = card.createEl("div", { cls: "recall-card-meta" });
		if (d.category) {
			meta.createEl("span", { cls: "recall-meta-item", text: d.category });
		}
		if (d.site_name) {
			meta.createEl("span", { cls: "recall-meta-item", text: d.site_name });
		}

		const actions = card.createEl("div", { cls: "recall-card-actions" });

		const docUrl = d.source_url || d.url;
		if (docUrl && isSafeUrl(docUrl)) {
			const link = actions.createEl("a", { cls: "recall-link", text: "Open source" });
			link.href = docUrl;
			link.addEventListener("click", (e) => {
				e.preventDefault();
				window.open(docUrl);
			});
		}
	}

	private insertHighlight(h: ReadwiseHighlight): void {
		const mdLeaf = this.lastMarkdownLeaf;
		if (!mdLeaf || !(mdLeaf.view instanceof MarkdownView)) {
			new Notice("Open a note first to insert a highlight.");
			return;
		}
		const view = mdLeaf.view as MarkdownView;
		const editor = view.editor;

		// Re-focus the editor so replaceSelection has a valid cursor.
		this.app.workspace.setActiveLeaf(mdLeaf, { focus: true });
		editor.focus();

		const escWiki = (s: string) => s.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
		const source = h.title ? `[[${escWiki(h.title)}]]` : "Unknown source";
		const author = h.author ? ` — [[${escWiki(h.author)}]]` : "";
		// Ensure newlines in highlight text don't break the blockquote
		const text = h.text.replace(/\n/g, "\n> ");
		const callout = `> [!quote] ${source}${author}\n> ${text}\n\n`;
		editor.replaceSelection(callout);
	}
}
