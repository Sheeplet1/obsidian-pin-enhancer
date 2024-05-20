import { Plugin } from "obsidian";

// interface MyPluginSettings {
// 	mySetting: string;
// }
//
// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: "default",
// };

export default class PinEnhancerPlugin extends Plugin {
	// settings: MyPluginSettings;

	async onload() {
		// await this.loadSettings();

		console.log("loading PinEnhancerPlugin");

		this.handleLayoutChange();
	}

	onunload() {
		console.log("unloading PinEnhancerPlugin");
	}

	// async loadSettings() {
	// 	this.settings = Object.assign(
	// 		{},
	// 		DEFAULT_SETTINGS,
	// 		await this.loadData(),
	// 	);
	// }
	//
	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }

	handleLayoutChange() {
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		leaves.forEach((leaf) => {
			if (leaf.getViewState().pinned) {
				// TODO: Prevent closing
				this.preventClose();
			}
		});
	}

	preventClose() {
		const tabsContainer = document.querySelectorAll(
			".workspace-tab-header-container-inner",
		)[1];

		tabsContainer
			.querySelectorAll(".workspace-tab-header")
			.forEach((tab) => {
				const statusIcon = tab.querySelector(
					".workspace-tab-header-status-icon",
				);

				if (statusIcon && statusIcon.hasClass("mod-pinned")) {
					// Prevent middle-mouse close
					tab.addEventListener("mousedown", (e) => {
						this.blockMouseAction(e);
						console.log("Preventing close");
					});

					// TODO: Context menu closes

					// TODO: Command palette closes
				}
			});
	}

	blockMouseAction(event: Event) {
		event.stopPropagation();
		event.preventDefault();
		console.log("Mouse event blocked");
	}
}
