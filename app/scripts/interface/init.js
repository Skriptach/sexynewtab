'use strict';

;(() => {

	function createPages () {
		let index = 0;
		const pages = document.createDocumentFragment();
		for (let r = 0; r < ROWS_COUNT; r++) {
			for (let c = 0; c < COLUMNS_COUNT; c++) {
				const page = new ThumbPage(index, c, r);
				page.update();
				pages.appendChild(page);
				index++;
			}
		}
		d('set').appendChild(pages);
	};

	function ready (background) {
		back = background;
		slotsList = background.slotsList;
		COLUMNS_COUNT = background.settings.COLUMNS_COUNT;
		ROWS_COUNT = background.settings.ROWS_COUNT;
		setPagesSize();
		createPages();
		window.dispatchEvent(new Event('ready'));
	}

	function seti18nLabels () {
		document.querySelectorAll('[i-18n-msg]').forEach((tag) => {
			const msg = tag.getAttribute('i-18n-msg');
			const fallback = tag.innerText;
			tag.innerText = chrome.i18n.getMessage(msg) || fallback;
		});
	}

	window.on('load', () => {
		seti18nLabels();
		chrome.runtime.getBackgroundPage( (bg) => bg.load().then(ready) );
	});

})();
