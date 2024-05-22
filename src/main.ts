import { Notice, Plugin } from "obsidian";

export default class PinEnhancerPlugin extends Plugin {
	// Map of a reference of a tab's header to their blockers.
	private blockers: Map<Element, { middleClick: EventListener }> = new Map();

	// Map of a reference to a tab's status containers to their observers
	private observers: Map<Element, MutationObserver> = new Map();

	async onload() {
		console.log("Loading PinEnhancerPlugin");

		this.initialisePinnedTabs();
		this.updatePinObservers();

		this.registerEvent(
			this.app.workspace.on(
				"layout-change",
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
				!this.blockers.has(leaf.tabHeaderEl)
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
		///////// Blocking Functions /////////
		const blockMiddleClick = (event: MouseEvent) => {
			if (event.button !== 1) return;

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			new Notice("Cannot close pinned tab");
		};

		tab.addEventListener("auxclick", blockMiddleClick, true);

		this.blockers.set(tab, {
			middleClick: blockMiddleClick,
		});
	}

	/**
	 * Remove blockers from the tab.
	 */
	removeBlockers(tab: Element) {
		const listeners = this.blockers.get(tab);
		if (listeners) {
			tab.removeEventListener("auxclick", listeners.middleClick, true);
			this.blockers.delete(tab);
		}
	}

	/**
	 * Initialies pin observers for all tabs.
	 */
	updatePinObservers() {
		// @ts-expect-error - rootSplit.containerEl is
		this.app.workspace.rootSplit?.containerEl
			.querySelectorAll(".workspace-tab-header")
			.forEach((tab: Element) => {
				this.addPinObserver(tab);
			});

		// Cleaning up the observers map by removing any observers that are no
		// longer needed
		this.observers.forEach((observer, statusContainer) => {
			if (statusContainer.isConnected) return;

			observer.disconnect();
			this.observers.delete(statusContainer);
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

		if (this.observers.has(statusContainer)) return;

		// When a new tab is opened, it initially has a flex value of '0 0 auto'.
		// However, when a tab is closed, it also temporarily has a flex value
		// of '0 0 auto' before being removed from the DOM. This can cause
		// confusion if we only check the flex value to determine if a tab is
		// new or being closed. Therefore, we also need to check if the tab is
		// the most recent tab to accurately determine if it is a new tab. If
		// the tab is not the most recent tab, then it is in the process of
		// being closed, and we do not need to add an observer to it.
		if (
			tab.getCssPropertyValue("flex") === "0 0 auto" &&
			// @ts-expect-error - tabHeaderEl is private
			this.app.workspace.getMostRecentLeaf().tabHeaderEl !== tab
		)
			return;

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

		this.blockers.forEach((listeners, tab) => {
			tab?.removeEventListener("auxclick", listeners.middleClick, true);
		});
		this.blockers.clear();

		this.observers.forEach((observer) => {
			observer.disconnect();
		});
		this.observers.clear();
	}
}
