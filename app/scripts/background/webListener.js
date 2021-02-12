'use strict';

;(() => {

	const accounts = 'https://accounts.google.com';
	const ogs = 'https://ogs.google.com';
	const apis = 'https://apis.google.com';
	const gstatic = 'https://www.gstatic.com';
	const SELF = `chrome-extension://${chrome.runtime.id}`;
	const ORIGIN1 = 'chrome-untrusted://new-tab-page';

	const all = [
		accounts,
		apis,
		gstatic,
		ogs,
		SELF,
	];

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

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.action === 'preloadScript' && request.src) {
			fetch(request.src)
				.then(r => r.text())
				.then(s => {
					const source = s.replace(/\.location\b/g, '.loc')
						.replace(/\.parent\.loc\b/g, '.parent.location');
					sendResponse({
						source,
					});
				});
		}
		return true;
	});

	chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
		if (all.includes(details.initiator)) {
			const requestHeaders = Array.from(details.requestHeaders);
			requestHeaders.forEach(header => {
				if (header.name.toLowerCase() === 'origin'){
					header.value = header.value.replace(SELF, ORIGIN1);
				}
			});

			return {
				requestHeaders,
			};
		}
	}, {
		urls: [ogs].map(u => `${u}/*`),
	}, ['blocking', 'requestHeaders', 'extraHeaders']);

	chrome.webRequest.onHeadersReceived.addListener((details) => {
		if (all.includes(details.initiator)) {
			const responseHeaders = Array.from(details.responseHeaders);
			responseHeaders.forEach(header => {
				header.value = header.value.replace(ORIGIN1, SELF);
				if (header.value.includes('frame-ancestors')){
					header.value = header.value.replace(/frame-ancestors[^;]*/, `frame-ancestors ${SELF}`);
				}
			});

			return {
				responseHeaders,
			};
		}
	}, {
		urls: [ogs].map(u => `${u}/*`),
	}, ['blocking', 'responseHeaders', 'extraHeaders']);

})();
