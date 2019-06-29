'use strict';

;(() => {

	function firstInit () {
		chrome.topSites.get((topSites) => {
			const lng = Math.min(topSites.length, slotsList.length);
			for (let i = 0; i < lng; i++) {
				editPage(topSites[i].url, i, topSites[i].title);
			}
		});
	}

	chrome.runtime.onInstalled.addListener((evnt) => {
		if (evnt.reason === 'install' && !slotsList.some( slot => (slot && slot.url) ) ) {
			firstInit();
		}
	});

})();
