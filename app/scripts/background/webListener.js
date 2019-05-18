'use strict';

;(() => {

	window.redirectUrls = {};

	chrome.webRequest.onBeforeRedirect.addListener((details) => {
		const originUrl = getOriginBy(details.url);
		originUrl && (redirectUrls[originUrl] = redirectUrls[originUrl] || []);
		if (originUrl && redirectUrls[originUrl] && redirectUrls[originUrl].indexOf(details.redirectUrl) === -1) {
			redirectUrls[originUrl].push(details.redirectUrl);
		}
	}, {
		urls: ['<all_urls>'],
		types: ['main_frame']
	}, ['responseHeaders']);

	chrome.webRequest.onHeadersReceived.addListener((details) => {
		return {
			responseHeaders: details.initiator === `chrome-extension://${chrome.runtime.id}` ?
				details.responseHeaders.filter(header => header.name !== 'link') :
				details.responseHeaders
		};
	}, {
		urls: ['<all_urls>'],
		types: ['xmlhttprequest']
	}, ['blocking', 'responseHeaders']);

})();
