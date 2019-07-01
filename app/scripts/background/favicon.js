'use strict';

;(() => {

	const blankIcon = { dataUrl: '/icons/document.svg' };

	function getSize (link) {
		const mostFitWidth = screen.width * 0.2 * window.devicePixelRatio,
			hasColor = !!link.getAttribute('color'),
			sizes = link.getAttribute('sizes'),
			isMask = link.rel === 'mask-icon',
			n = (sizes || '').split(' ').map(a => parseInt(a, 10)).sort((a, b) => b - a)[0],
			href = link.getAttribute('href'),
			type = link.getAttribute('type'),
			isSVG = (/\.svg/).test(href) || (/iamge\/svg/).test(type);
		return (sizes === 'any' || (isSVG && !hasColor && !isMask)) ? Number.MAX_SAFE_INTEGER : // sizes any
			(isSVG || hasColor || isMask) ? Number.MAX_SAFE_INTEGER - 1 : // or SVG have highest priority
			(n > mostFitWidth) ? Number.MAX_SAFE_INTEGER - (n - mostFitWidth) : // larger than 20% of screen width would be an overhead
			(n >= 16) ? n :
			(link.rel === 'apple-touch-icon-precomposed') ? 57 :
			(link.rel === 'apple-touch-icon') ? 57 :
			16;
	}

	function findLargest (links) {
		if (!links.length){
			return Promise.reject(new Error('No available icons in the list'));
		}
		const link = links[0];
		return loadImage(link.href)
			.then((favicon) => {
				if (link.color){
					favicon.color = link.color;
				}
				return favicon;
			})
			.catch(() => {
				links.shift();
				return findLargest(links);
			});
	}

	function tryGuess (url) {
		const tryPNG = resolveUrl('/favicon.png', url),
			tryICO = resolveUrl('/favicon.ico', url);
		return loadImage(tryPNG)
			.catch(() => loadImage(tryICO))
			.catch(() => blankIcon);
	}

	window.getFavicon = function (doc) {
		const links = Array.from(doc.querySelectorAll('link[rel*="icon"][href]'))
			.map((link) => {
				return {
					href: link.href,
					color: link.getAttribute('color'),
					size: getSize(link)
				};
			}).sort((a, b) => {
				return b.size - a.size;
			});
		return findLargest(links)
			.catch((error) => tryGuess(error.url || doc.baseURI));
	};

	chrome.webRequest.onHeadersReceived.addListener((details) => {
		return {
			responseHeaders: details.initiator === `chrome-extension://${chrome.runtime.id}` ?
				details.responseHeaders.filter(header => header.name.toLowerCase() !== 'link') :
				details.responseHeaders
		};
	}, {
		urls: ['<all_urls>'],
		types: ['xmlhttprequest']
	}, ['blocking', 'responseHeaders']);

})();
