'use strict';

;(() => {

	const UTF8 = 'utf-8',
		protocolRX = /^https?:\/\//,
		webstore = /^https?:\/\/chrome\.google\.com\/webstore/,
		charsetRX = /.*charset="?([^"]+)/,
		parser = new DOMParser();

	const lowerTrim = (str) => str.trim().toLowerCase();

	const decode = (buf, enc) => new TextDecoder(enc).decode(buf);

	function parseContentType(str) {
		if (!str) {
			return;
		}
		const charsetMatch = str.match(charsetRX);
		return charsetMatch ? lowerTrim(charsetMatch[1]) : '';
	}

	function getEncoding(doc) {
		const metaCharset = doc.head.querySelector('meta[charset]');
		const metaContentType = doc.head.querySelector('meta[http-equiv="content-type"]');
		return metaCharset ? lowerTrim(metaCharset.getAttribute('charset')) :
			metaContentType ? parseContentType(metaContentType.content) :
			UTF8;
	}

	function urlBasedDom (buf, base_url, contentType) {
		let encoding = parseContentType(contentType);
		let doc = parser.parseFromString(decode(buf, encoding || UTF8), 'text/html');
		if (!encoding){
			encoding = getEncoding(doc);
			if (encoding !== UTF8){
				doc = parser.parseFromString(decode(buf, encoding), 'text/html');
			}
		}
		const head = doc.head || doc.getElementsByTagName('head')[0],
			base = doc.getElementsByTagName('base')[0] || head.appendChild(doc.createElement('base'));

		if (!protocolRX.test(base.href)) {
			base.href = base_url;
		}
		return doc;
	};

	window.getMeta = (url) => url.match(webstore) ?
		Promise.resolve({
			title: 'Chrome Web Store - Extensions',
			favicon: { dataUrl: 'https://ssl.gstatic.com/chrome/webstore/images/icon_144px.png' },
			lastUpdate : Date.now(),
		})
		: get(url, true)
			.then((response) => urlBasedDom(response.buffer, response.url || url, response.contentType))
			.then(async (doc) => ({
				title: doc.title,
				favicon: await getFavicon(doc),
				lastUpdate : Date.now(),
			}))
			.catch((e) => ({
				title: chrome.i18n.getMessage('error'),
				favicon: { dataUrl: '/icons/error.svg' },
			}));

})();
