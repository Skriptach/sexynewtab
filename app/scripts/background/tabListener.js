'use strict';

;(() => {

	window.tabRequests = {};
	window.currentTab = null;

	function screenActive (tab) {
		const url = getOriginBy(tab.url);
		if (tabRequests[tab.id].url === url) {
			const i = slotsList.findIndex(byUrl(url));
			createThumbOf(tab, i);
		}
		delete tabRequests[tab.id];
	}

	chrome.tabs.onActivated.addListener((activeInfo) => {
		chrome.tabs.get(activeInfo.tabId, (tab) => {
			currentTab = tab;
			if (tabRequests[tab.id] && tab.status === 'complete' && tab.active) {
				setTimeout(screenActive.bind(window, tab), 100);
			}
		});
	});

	chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
		// check if sender tab url really added to fav pages
		if (tabRequests[id] && changeInfo.status === 'complete' && tab.active) {
			currentTab = tab;
			screenActive(tab);
		}
	});

})();
