'use strict';

;(() => {

	let urls_ready = false,
		thumbs_ready = false,
		thumbs,
		favicons,
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
					if (slot && slot.url) {
						slot.thumb = thumbs[slot.url];
						slot.favicon = favicons[slot.url];
						updateFavicon(slot);
					}
				});
				done();
			}
		}

		chrome.storage.sync.get(['slots', 'settings'], (res) => {
			if (res.slots && res.slots.length){
				slotsList = res.slots;
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

		chrome.storage.local.get(['thumbs', 'favicons'], (res) => {
			thumbs = res.thumbs || {};
			favicons = res.favicons || {};
			thumbs_ready = true;
			loaded();
		});
	}

	init();

})();
