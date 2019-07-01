'use strict';

;(() => {

	window.saveBG = () => {
		const background = settings.background;
		chrome.storage.local.set({ background });
	};

	window.saveLocal = () => {
		const thumbs = {};
		const favicons = {};
		slotsList.forEach((slot) => {
			if (!slot || !slot.url){return;}
			thumbs[slot.url] = slot.thumb;
			favicons[slot.url] = slot.favicon;
		});
		chrome.storage.local.set({ thumbs, favicons });
	};

	window.saveSync = () => {
		const slots = slotsList.map((slot) => {
			return slot && slot.url ? {
				url: slot.url,
				title: slot.title,
				lastUpdate: slot.lastUpdate,
			} : null;
		});
		chrome.storage.sync.set({
			slots,
			settings: Object.assign({}, settings, { background: undefined })
		});
	};

})();
