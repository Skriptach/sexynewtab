'use strict';

;(() => {

	const readyEvt = new Event('ready');

	function ready (background) {
		back = background;
		slotsList = background.slotsList;
		COLUMNS_COUNT = background.settings.COLUMNS_COUNT;
		ROWS_COUNT = background.settings.ROWS_COUNT;
		setPagesSize();
		createPages();
		window.dispatchEvent(readyEvt);
	}

	function seti18nLabels () {
		$('#tabs span')[0].innerText = chrome.i18n.getMessage('fn_tabs');
		$('#bookmarks span')[0].innerText = chrome.i18n.getMessage('fn_bookmarks');
		$('#history span')[0].innerText = chrome.i18n.getMessage('fn_history');
		$('#topsites span')[0].innerText = chrome.i18n.getMessage('fn_top');
		$('#customize h3')[0].innerText = chrome.i18n.getMessage('theme_label');
		$('#customize h3')[1].innerText = chrome.i18n.getMessage('background_label');
	}

	window.addEventListener('load', () => {
		seti18nLabels();
		chrome.runtime.getBackgroundPage( (bg) => bg.load().then(ready) );
	});

})();
