'use strict';

;(() => {

	window.saveLocal = () => {
		const buferT = {};
		slotsList.forEach((slot) => {
			if (!slot || !slot.url){return;}
			buferT[slot.url] = slot.thumb;
		});
		thumbs = buferT;
		chrome.storage.local.set({thumbs});
	};

	window.saveSync = () => {
		const slots = slotsList.map((slot) => {
			return slot && slot.url ? {
				url: slot.url,
				favicon: slot.favicon
			} : null;
		});
		chrome.storage.sync.set({
			slots,
			settings
		});
	};

})();
