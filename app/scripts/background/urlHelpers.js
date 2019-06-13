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

	const parser = new DOMParser();

	window.resolveUrl = function (url, base_url, doc) {
		doc = doc || parser.parseFromString('<html><head></head><body></body></html>', 'text/html');
		const
			head = doc.head || doc.getElementsByTagName('head')[0],
			base = doc.getElementsByTagName('base')[0] || head.appendChild(doc.createElement('base')),
			resolver = doc.createElement('a');

		base.href = base_url;
		resolver.href = url;
		return resolver.href;
	};

	window.urlBasedDom = function (html, base_url) {
		const doc = parser.parseFromString(html, 'text/html');
		const
			head = doc.head || doc.getElementsByTagName('head')[0],
			base = doc.getElementsByTagName('base')[0] || head.appendChild(doc.createElement('base'));

		base.href = base.getAttribute('href') || base_url;
		return doc;
	};

})();
