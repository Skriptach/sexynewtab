'use strict';

;(() => {

	let urls_ready = false,
		thumbs_ready = false,
		resolve;

	const ready = new Promise((res) => {
		resolve = res;
	});

	window.load = (callback) => {
		return ready;
	};

	function done () {
		resolve({
			slotsList,
			settings,
			swap,
			editPage
		});
	}

	function init () {
		function loaded () {
			if (urls_ready && thumbs_ready) {
				slotsList.forEach((slot) => {
					slot && (slot.thumb = thumbs[slot.url]);
				});
				done();
			}
		}

		chrome.storage.sync.get(['slots', 'settings'], (res) => {
			if (res.slots && res.slots.length){
				slotsList = res.slots;
				slotsList.forEach((slot) => {
					if(slot && slot.url){
						updateFavicon(slot);
					}
				});
			}
			if (res.settings) {
				settings.COLUMNS_COUNT = res.settings.COLUMNS_COUNT;
				settings.ROWS_COUNT = res.settings.ROWS_COUNT;
				settings.FLOW = res.settings.FLOW;
				settings.THEME = res.settings.THEME;
				settings.BACK = res.settings.BACK;
			}
			urls_ready = true;
			loaded();
		});

		chrome.storage.local.get(['thumbs'], (res) => {
			if (res.thumbs) {
				for (const i in res.thumbs) {
					thumbs[i] = res.thumbs[i];
				}
			}
			thumbs_ready = true;
			loaded();
		});
	}

	init();

})();
