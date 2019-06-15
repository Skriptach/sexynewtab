'use strict';

;(() => {

	window.updateFavicon = (slot) => {
		return getFavicon(slot.url)
			.then((response) => {
				if (slotsList.indexOf(slot) < 0){return;}
				slot.favicon = response;
				slot.favicon.lastUpdate = Date.now();
				refreshPages(slotsList.indexOf(slot));
			});
	};

	window.swap = (old_index, new_index) => {
		slotsList.splice(new_index, 0, slotsList.splice(old_index, 1)[0]);
		saveSync();
	};

	function fixUrl (url) {
		const protocol = /^https?:\/\//,
			domain = /^[\w]+[\w-.]+/;
		if (!protocol.test(url)){
			if(!domain.test(url)){return false;}
			url = `http://${url}`;
		}
		return resolveUrl(url, url);
	}

	window.editPage = (url, slot_index, requestedTab) => {
		url = fixUrl(url);
		if (!url || (slotsList[slot_index] && slotsList[slot_index].url === url)){return;}

		const oldUrl = slotsList[slot_index] && slotsList[slot_index].url;
		slotsList[slot_index] = {
			url,
			favicon: { dataUrl: '/icons/document.svg', color: 'rgba(220, 220, 220, 0.9)'}
		};
		if (!slotsList.find(byUrl(oldUrl))) {
			delete redirectUrls[oldUrl];
		}
		saveLocal();
		saveSync();
		if (requestedTab) {
			createThumbOf(requestedTab, slot_index);
		} else {
			updateFavicon(slotsList[slot_index]);
		}
		return true;
	};

})();
