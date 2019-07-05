'use strict';

;(() => {

	const UTF8 = 'utf-8',
		protocolRX = /^https?:\/\//,
		charsetRX = /.*charset="?([^"]+)/,
		parser = new DOMParser();

	function lowerTrim(str) {
		return str.trim().toLowerCase();
	}

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

	function decode(buf, enc) {
		return new TextDecoder(enc).decode(buf);
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

	window.getMeta = function (url) {
		return get(url, true)
			.then((response) => urlBasedDom(response.buffer, response.url || url, response.contentType))
			.then(async (doc) => {
				return {
					title: doc.title,
					favicon: await getFavicon(doc),
					lastUpdate : Date.now(),
				};
			}).catch((e) => {
				return {
					title: chrome.i18n.getMessage('error'),
					favicon: { dataUrl: '/icons/error.svg' }
				};
			});
	};

})();