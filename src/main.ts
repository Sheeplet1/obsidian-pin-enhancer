import { Notice, Plugin, WorkspaceLeaf } from "obsidian";

export default class PinEnhancerPlugin extends Plugin {
	private listenerMap: Map<Element, { middleClick: EventListener }> =
		new Map();

	async onload() {
		console.log("loading PinEnhancerPlugin");

		this.handleLayoutChange();
		this.registerEvent(
			this.app.workspace.on(
				"layout-change",
				this.handleLayoutChange.bind(this),
			),
		);
	}

	handleLayoutChange() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().pinned) {
				this.preventClose(leaf);
			}
		});
	}

	preventClose(leaf: WorkspaceLeaf) {
		///////// Blocking Functions /////////
		const blockMiddleClick = (event: MouseEvent) => {
			// FIX: This function is not working.
			if (event.button !== 1) return;

			event.stopPropagation();
			event.preventDefault();

			// BUG: This prints out multiple times.
			new Notice("Cannot close pinned tab");
		};

		// TODO: Block context menu closes

		// TODO: Block command palette close

		// @ts-expect-error - leaf.tabHeaderEl is private
		leaf.tabHeaderEl.addEventListener("auxclick", blockMiddleClick, true);

		// @ts-expect-error - leaf.tabHeaderEl is private
		this.listenerMap.set(leaf.tabHeaderEl, {
			middleClick: blockMiddleClick,
		});
	}

	onunload() {
		console.log("unloading PinEnhancerPlugin");

		this.listenerMap.forEach((listeners, tab) => {
			tab?.removeEventListener("auxclick", listeners.middleClick, true);
		});

		this.listenerMap.clear();
	}
}
