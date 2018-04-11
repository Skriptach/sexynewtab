'use strict';

;(() => {

	window.byUrl = (url) => {
		return (slot) => (slot && slot.url === url);
	};

	window.getOriginBy = (url) => {
		if (slotsList.findIndex(byUrl(url)) !== -1){return url;}
		if (slotsList.findIndex(byUrl(url.replace(/\/$/, ''))) !== -1){return url.replace(/\/$/, '');}
		for(const u in redirectUrls){
			if (redirectUrls[u].indexOf(url) !== -1){return u;}
		}
	};

})();
