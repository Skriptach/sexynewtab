'use strict';

;(() => {

	window.currentTab = null;

	function screenActive (tab) {
		// check if sender tab url really added to fav pages
		const url = getOriginBy(tab.url);
		const i = slotsList.findIndex(byUrl(url));
		if (url && i !== -1) {
			createThumbOf(tab, i);
		}
	}

	chrome.tabs.onActivated.addListener((activeInfo) => {
		chrome.tabs.get(activeInfo.tabId, (tab) => {
			currentTab = tab;
			if (tab.status === 'complete' && tab.active) {
				setTimeout(screenActive.bind(window, tab), 100);
			}
		});
	});

	chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
		if (changeInfo.status === 'complete' && tab.active) {
			currentTab = tab;
			screenActive(tab);
		}
	});

})();
