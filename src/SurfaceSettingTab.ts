import { App, PluginSettingTab, Setting } from "obsidian";
import type SurfacePlugin from "./main";

export class SurfaceSettingTab extends PluginSettingTab {
	plugin: SurfacePlugin;

	constructor(app: App, plugin: SurfacePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Readwise CLI path")
			.setDesc(
				"Path to the readwise CLI binary. Leave as 'readwise' to auto-detect."
			)
			.addText((text) =>
				text
					.setPlaceholder("readwise")
					.setValue(this.plugin.settings.readwisePath)
					.onChange(async (value) => {
						this.plugin.settings.readwisePath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Result limit")
			.setDesc("Maximum number of results to show (1-50).")
			.addSlider((slider) =>
				slider
					.setLimits(1, 50, 1)
					.setValue(this.plugin.settings.resultLimit)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.resultLimit = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Search mode")
			.setDesc("What to search: highlights, documents, or both.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("highlights", "Highlights")
					.addOption("documents", "Documents")
					.addOption("both", "Both")
					.setValue(this.plugin.settings.searchMode)
					.onChange(async (value) => {
						this.plugin.settings.searchMode = value as "highlights" | "documents" | "both";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Debounce delay (ms)")
			.setDesc("Wait time before searching after switching notes (200-5000).")
			.addSlider((slider) =>
				slider
					.setLimits(200, 5000, 100)
					.setValue(this.plugin.settings.debounceDelayMs)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.debounceDelayMs = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Search content length")
			.setDesc("Number of characters from note body to include in search (100-2000).")
			.addSlider((slider) =>
				slider
					.setLimits(100, 2000, 100)
					.setValue(this.plugin.settings.searchContentLength)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.searchContentLength = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
