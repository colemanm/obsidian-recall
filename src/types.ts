export interface RecallSettings {
	resultLimit: number;
	searchMode: "highlights" | "documents" | "both";
	debounceDelayMs: number;
	searchContentLength: number;
	readwisePath: string;
}

export const DEFAULT_SETTINGS: RecallSettings = {
	resultLimit: 10,
	searchMode: "highlights",
	debounceDelayMs: 1000,
	searchContentLength: 500,
	readwisePath: "readwise",
};

export interface ReadwiseHighlightRaw {
	id: number;
	score: number;
	attributes: {
		document_author: string;
		document_category: string;
		document_tags: string[];
		document_title: string;
		highlight_note: string;
		highlight_plaintext: string;
		highlight_tags: string[];
	};
	url: string;
}

export interface ReadwiseHighlight {
	id: number;
	text: string;
	title: string;
	author: string;
	url: string;
	note: string;
	category: string;
	tags: string[];
	score: number;
}

export interface ReaderDocument {
	id: string;
	title: string;
	author: string;
	url: string;
	source_url: string;
	summary: string;
	category: string;
	published_date: string;
	site_name: string;
	word_count: number;
	notes: string;
	score?: number;
}

export type SearchResult =
	| { type: "highlight"; data: ReadwiseHighlight }
	| { type: "document"; data: ReaderDocument };
