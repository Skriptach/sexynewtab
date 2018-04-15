'use strict';

;(() => {

	const parser = new DOMParser(),
		blankIcon = {href: '/icons/document.svg', color: 'rgba(220, 220, 220, 0.9)'};

	window.resolveUrl = function (url, base_url, doc) {
		doc = doc || parser.parseFromString('<html><head></head><body></body></html>', 'text/html');
		const base = doc.getElementsByTagName('base')[0],
			head = doc.head || doc.getElementsByTagName('head')[0],
			our_base = base || head.appendChild(doc.createElement('base')),
			resolver = doc.createElement('a');

		our_base.href = base_url;
		resolver.href = url;
		return resolver.href;
	};

	function get (url) {
		return new Promise((resolve, reject) => {
			if (!url){reject();return;}
			let xhr = new XMLHttpRequest();

			xhr.open('GET', url, true);
			xhr.onloadend = () => {
				if (xhr.status === 200) {
					resolve({
						body: xhr.responseText,
						landingUrl: xhr.responseURL
					});
				} else {
					const error = new Error(xhr.statusText);
					error.code = xhr.status;
					error.responseURL = xhr.responseURL;
					reject(error);
				}
				xhr = null;
			};
			xhr.onerror = () => reject(new Error(`Network Error. URL:${url}`));
			xhr.send();
		});
	}

	function loadImage (src) {
		return new Promise((resolve, reject) => {
			const img = document.createElement('img');
			img.onload = () => {
				if (img.width < 16 || img.height < 16){reject();}
				else {resolve({href: src});}
			};
			img.onerror = () => reject();

			img.src = src;
		});
	}

	function getSize (link) {
		const c = link.getAttribute('color'),
			v = link.getAttribute('sizes'),
			n = parseInt(v, 10),
			h = link.getAttribute('href');
		return (v === 'any' || (/\.svg$/).test(h) || c) ? Number.MAX_VALUE :
			(n > 16) ? n :
			(link.rel === 'apple-touch-icon-precomposed') ? 152 :
			(link.rel === 'apple-touch-icon') ? 144 :
			16;
	}

	function findLargest (links) {
		const link = links[0];
		return loadImage(link.href)
			.then((favicon) => {
				if (link.color || link.size === Number.MAX_VALUE){
					favicon.color = link.color;
				}
				return favicon;
			})
			.catch(() => {
				links.shift();
				if (!links.length){throw new Error('No available icons in the list');}
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

	window.getFavicon = function (url) {

		return get(url)
			.then((response) => {
				const doc = parser.parseFromString(response.body, 'text/html'),
					links = [].map.call(doc.querySelectorAll('link[rel*="icon"][href]'), (link) => {
						return {
							href: resolveUrl(link.getAttribute('href'), response.landingUrl || url, doc),
							color: link.getAttribute('color'),
							size: getSize(link)
						};
					}).sort((a, b) => {
						return b.size - a.size;
					});
				if (links.length) {
					return findLargest(links)
						.catch(() => tryGuess(response.landingUrl || url));
				}

				return tryGuess(response.landingUrl || url);
			}, (error) => tryGuess(error.responseURL || url));
	};

})();