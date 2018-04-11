'use strict';

;(() => {

	window.redirectUrls = {};

	chrome.webRequest.onCompleted.addListener((details) => {
		const url = getOriginBy(details.url);
		const i = slotsList.findIndex(byUrl(url));
		if (url && i !== -1 && details.type === 'main_frame') {
			tabRequests[details.tabId] = {url};
		}
	}, {
		urls: ['<all_urls>']
	});

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

	/*chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
		console.log(details);
	}, {
		urls: ['<all_urls>'],
		types: ['main_frame']
	}, ['requestHeaders']);*/

})();
