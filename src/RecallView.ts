import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import { SearchResult, ReadwiseHighlight, ReaderDocument } from "./types";

export const VIEW_TYPE_RECALL = "recall-view";

export class RecallView extends ItemView {
	private contentEl_: HTMLElement;
	onRefresh: (() => void) | null = null;

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
		this.renderNoFile();
	}

	async onClose(): Promise<void> {
		this.contentEl_.empty();
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

	renderEmpty(searchLabel?: string): void {
		this.contentEl_.empty();
		this.addToolbar(0, searchLabel);
		this.contentEl_.createEl("div", {
			cls: "recall-status",
			text: "No related highlights found.",
		});
	}

	renderResults(results: SearchResult[], searchLabel?: string): void {
		this.contentEl_.empty();
		this.addToolbar(results.length, searchLabel);

		const container = this.contentEl_.createEl("div", { cls: "recall-results" });

		for (const result of results) {
			if (result.type === "highlight") {
				this.renderHighlightCard(container, result.data);
			} else {
				this.renderDocumentCard(container, result.data);
			}
		}
	}

private addToolbar(count: number, searchLabel?: string): void {
		const bar = this.contentEl_.createEl("div", { cls: "recall-toolbar" });
		const btn = bar.createEl("button", {
			cls: "recall-refresh-btn",
			text: "Refresh",
		});
		btn.addEventListener("click", () => {
			if (this.onRefresh) this.onRefresh();
		});
if (searchLabel) {
			bar.createEl("span", {
				cls: "recall-search-label",
				text: searchLabel,
			});
		}
		bar.createEl("span", {
			cls: "recall-count",
			text: `${count} result${count !== 1 ? "s" : ""}`,
		});
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

		if (h.url) {
			const link = actions.createEl("a", { cls: "recall-link", text: "Open in Readwise" });
			link.href = h.url;
			link.addEventListener("click", (e) => {
				e.preventDefault();
				window.open(h.url);
			});
		}

		const insertBtn = actions.createEl("button", {
			cls: "recall-insert-btn",
			text: "Insert",
		});
		insertBtn.addEventListener("click", () => {
			this.insertHighlight(h);
		});
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

		if (d.source_url || d.url) {
			const link = actions.createEl("a", { cls: "recall-link", text: "Open source" });
			const url = d.source_url || d.url;
			link.href = url;
			link.addEventListener("click", (e) => {
				e.preventDefault();
				window.open(url);
			});
		}
	}

	private insertHighlight(h: ReadwiseHighlight): void {
		// Can't use getActiveViewOfType — clicking Insert makes the sidebar
		// the active leaf. Find the most recent markdown leaf instead.
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		const mdLeaf = leaves.find((l) => l.view instanceof MarkdownView);
		if (!mdLeaf) return;
		const view = mdLeaf.view as MarkdownView;
		const editor = view.editor;
		const source = h.title ? `[[${h.title}]]` : "Unknown source";
		const author = h.author ? ` — [[${h.author}]]` : "";
		const callout = `> [!quote] ${source}${author}\n> ${h.text}\n\n`;
		editor.replaceSelection(callout);
	}
}
