'use strict';

;(() => {

	let savedTab,
		processing;
	const queue = [];

	function takeScreenshot () {
		if (currentTab.url !== processing.tab.url) {
			processing = null;
			process();
			return;
		}
		// take screenshot
		chrome.tabs.captureVisibleTab(processing.tab.windowId, { format: 'png' }, (thumb) => {
			if (currentTab.url !== processing.tab.url){
				processing = null;
				process();
				return;
			}
			if (!thumb && chrome.runtime.lastError && chrome.runtime.lastError.message === 'Failed to capture tab: unknown error' && processing.tries){
				// try once again
				processing.tries--;
				processing.tries && queue.unshift(processing);
				processing = null;
				setTimeout(process, 10);
				return;
			}
			slotsList[processing.slot_index].thumb = thumb;
			if (processing.tab.favIconUrl){
				updateFavicon(slotsList[processing.slot_index]);
			}
			updatePage(processing.slot_index);
			saveLocal();
			processing = null;
			process();
		});
	}

	function next () {
		//get current tab
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			const current = tabs[0];
			if (current.id === processing.tab.id){
				takeScreenshot();
			} else {
				savedTab = savedTab || (current.id > -1 ? current : null);
				// switch to requested tab
				chrome.tabs.update(processing.tab.id, { active: true }, (tab) => {
					if ((chrome.runtime.lastError && chrome.runtime.lastError.message.includes('No tab with id')) || !tab){
						return;
					}
					chrome.windows.update(processing.tab.windowId, {focused: true}, () => {
						setTimeout(takeScreenshot, 150);
					});
				});
			}
		});
	}

	function process () {
		if (processing){return;}
		if (queue.length){
			processing = queue.shift();
			next();
		} else if (savedTab){
			// switch back
			chrome.tabs.update(savedTab.id, { active: true }, () => {
				chrome.windows.update(savedTab.windowId, {focused: true}, () => (savedTab = null));
			});
		}
	}

	window.createThumbOf = function (tab, slot_index) {

		queue.push({
			tab,
			slot_index,
			tries: 5
		});
		process();

	};

})();
