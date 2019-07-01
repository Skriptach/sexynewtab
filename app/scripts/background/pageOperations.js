'use strict';

;(() => {

	window.updateMeta = (slot) => {
		return getMeta(slot.url)
			.then((data) => {
				if (slotsList.indexOf(slot) < 0){return;}
				Object.assign(slot, data);
				updatePage(slotsList.indexOf(slot));
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

	window.editPage = (url, slot_index, title) => {
		url = fixUrl(url);
		if (!url || (slotsList[slot_index] && slotsList[slot_index].url === url)){return;}

		const oldUrl = slotsList[slot_index] && slotsList[slot_index].url;
		slotsList[slot_index] = {
			url,
			title,
			favicon: {},
		};
		if (!slotsList.find(byUrl(oldUrl))) {
			delete redirectUrls[oldUrl];
		}
		saveLocal();
		saveSync();
		updateMeta(slotsList[slot_index]);
		return true;
	};

})();
