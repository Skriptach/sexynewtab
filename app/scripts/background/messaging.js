'use strict';

;(() => {

	function onRemove (index) {
		if (index !== -1) {
			const oldUrl = slotsList[index].url;
			slotsList[index] = null;
			if (!slotsList.find(byUrl(oldUrl))) {
				delete redirectUrls[oldUrl];
			}
			saveLocal();
			saveSync();
			chrome.runtime.sendMessage({
				action: 'remove',
				params: {
					index
				}
			});
		}
	}

	window.refreshPages = (slot_index) => {
		if (slot_index < 0){return;}
		chrome.runtime.sendMessage({
			action: 'updatePage',
			params: {
				index: slot_index,
				thumb: slotsList[slot_index].thumb 
			}
		});
	};

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (sender.tab && sender.id === chrome.i18n.getMessage('@@extension_id')) {
			request.action === 'clear' ? onRemove(request.index) :
				request.action === 'toggleView'    ? (settings.FLOW  = request.FLOW,  saveSync()) :
				request.action === 'switchTheme'   ? (settings.THEME = request.theme, saveSync()) :
				request.action === 'setBackground' ? (settings.BACK  = request.back,  saveSync()) : ('');
		}
		sendResponse({});
	});

})();