import { Notice, Plugin } from "obsidian";

export default class PinEnhancerPlugin extends Plugin {
	private listenerMap: Map<Element, { middleClick: EventListener }> =
		new Map();
	private observers: Map<Element, MutationObserver> = new Map();

	async onload() {
		console.log("Loading PinEnhancerPlugin");

		this.initialisePinnedTabs();
		this.updatePinObservers();

		this.registerEvent(
			this.app.workspace.on(
				"layout-change",
				// TODO: Change this to updatePinObservers when it is done
				this.updatePinObservers.bind(this),
			),
		);
	}

	/**
	 * On initialisation, iterates through all leaves and adds blockers to
	 * pinned tabs.
	 */
	initialisePinnedTabs() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (
				leaf.getViewState().pinned &&
				// @ts-expect-error - leaf.tabHeaderEl is private
				!this.listenerMap.has(leaf.tabHeaderEl)
			) {
				// @ts-expect-error - leaf.tabHeaderEl is private
				this.addBlockers(leaf.tabHeaderEl);
			}
		});
	}

	/**
	 * Adds blockers to the tab to prevent closure.
	 */
	addBlockers(tab: Element) {
		console.log("Adding Blocker");
		console.log("Tab: ", tab);
		///////// Blocking Functions /////////
		const blockMiddleClick = (event: MouseEvent) => {
			if (event.button !== 1) return;

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			new Notice("Cannot close pinned tab");
		};

		tab.addEventListener("auxclick", blockMiddleClick, true);

		this.listenerMap.set(tab, {
			middleClick: blockMiddleClick,
		});
	}

	/**
	 * Remove blockers from the tab.
	 */
	removeBlockers(tab: Element) {
		console.log("Removing blockers");
		const listeners = this.listenerMap.get(tab);

		if (listeners) {
			tab.removeEventListener("auxclick", listeners.middleClick, true);
		}
	}

	/**
	 * Initialies pin observers for all tabs.
	 */
	updatePinObservers() {
		// TODO: Skip pins that have already been initialised. Will need to add
		// a set to track this.

		// @ts-expect-error - rootSplit.containerEl is private
		this.app.workspace.rootSplit.containerEl
			.querySelectorAll(".workspace-tab-header")
			.forEach((tab: Element) => {
				if (this.observers.has(tab)) return;

				this.addPinObserver(tab);
			});
	}

	/**
	 * Adds a mutation observer to the pin status container which notifies
	 * us when a pin is added or removed.
	 */
	addPinObserver(tab: Element) {
		const statusContainer = tab.querySelector(
			".workspace-tab-header-status-container",
		);

		if (!statusContainer) return;

		const observer = new MutationObserver((muts) => {
			muts.forEach((mut) => {
				if (mut.type === "childList") {
					mut.addedNodes.forEach((_) => {
						this.addBlockers(tab);
					});
					mut.removedNodes.forEach((_) => {
						this.removeBlockers(tab);
					});
				}
			});
		});

		const config = { childList: true, subtree: false };
		observer.observe(statusContainer, config);

		this.observers.set(statusContainer, observer);

		return observer;
	}

	onunload() {
		console.log("Unloading PinEnhancerPlugin");

		this.listenerMap.forEach((listeners, tab) => {
			tab?.removeEventListener("auxclick", listeners.middleClick, true);
		});
		this.listenerMap.clear();

		this.observers.forEach((observer) => {
			observer.disconnect();
		});
		this.observers.clear();
	}
}
