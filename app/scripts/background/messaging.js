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

	window.updatePage = (slot_index) => {
		if (slot_index < 0){return;}
		chrome.runtime.sendMessage({
			action: 'updatePage',
			params: {
				index: slot_index,
				thumb: slotsList[slot_index].thumb
			}
		});
	};

	function update (action) {
		chrome.runtime.sendMessage({
			action: action || 'updateBg'
		});
	};

	chrome.runtime.onMessage.addListener((request, sender) => {
		if (sender.tab && sender.id === chrome.runtime.id) {
			request.action === 'remove' ? onRemove(request.index) :
				request.action === 'toggleView'    ? (settings.FLOW  = request.FLOW,  saveSync()) :
				request.action === 'switchTheme'   ? (settings.THEME = request.theme, saveSync(), update()) :
				request.action === 'switchBgType'    ? (settings.BACK_TYPE  = request.type, saveSync(), update()) :
				request.action === 'switchThumbType'    ? (settings.THUMB_TYPE  = request.type, saveSync(), update('updateAll')) :
				request.action === 'setBackground' ? (settings.BACK  = request.back, saveSync(), update()) :
				request.action === 'loadBackground' ? (settings.background  = request.image, saveBG(), update()) :
				('');
		}
	});

})();
