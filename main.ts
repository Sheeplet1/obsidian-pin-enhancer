import { Plugin, WorkspaceLeaf } from "obsidian";

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class PinEnhancerPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		console.log("loading PinEnhancerPlugin");
		this.handleLayoutChange();
	}

	onunload() {
		console.log("unloading PinEnhancerPlugin");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	handleLayoutChange() {
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		leaves.forEach((leaf) => {
			if (leaf.getViewState().pinned) {
				console.log("Pinned leaf", leaf);
			}
		});
	}
}
