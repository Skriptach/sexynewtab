var getFavicon, resolveUrl;
;(function (){
'use strict';

	let parser = new DOMParser(),
		blankIcon = {href: '/icons/document.svg', color: 'rgba(220, 220, 220, 0.9)'};

	resolveUrl = function (url, base_url, doc) {
		doc = doc || parser.parseFromString('<html><head></head><body></body></html>', 'text/html');
		let base = doc.getElementsByTagName('base')[0],
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
					let error = new Error(xhr.statusText);
					error.code = xhr.status;
					error.responseURL = xhr.responseURL;
					reject(error);
				}
				xhr = undefined;
			};
			xhr.onerror = () => reject(new Error('Network Error. URL:' + url));
			xhr.send();
		});
	}

	function loadImage (src) {
		return new Promise((resolve, reject) => {
			let img = document.createElement('img');
			img.onload = () => {
				if (img.width < 16 || img.height < 16){reject();}
				else {resolve(src);}
			};
			img.onerror = () => reject();

			img.src = src;
		});
	}

	function findLargest (links) {
		if (!links.length){return;}
		let c, at, atp,
			link = links[links.length - 1],
			href = link.getAttribute('href'),
			size = parseInt(link.getAttribute('sizes'), 10) || 0;
		[].slice.call(links).some((l) => {
			c = l.getAttribute('color');
			let v = l.getAttribute('sizes'),
				h = l.getAttribute('href'),
				s = (v === 'any' || (/\.svg$/).test(h) || c) ? Number.MAX_VALUE :
					parseInt(v, 10) || 0;
			if (l.rel === 'apple-touch-icon'){at = h;}
			if (l.rel === 'apple-touch-icon-precomposed'){atp = h;}
			if (s>size) {
				href = h;
				size = s;
			}
			return (size === Number.MAX_VALUE);
		});
		return  (size === Number.MAX_VALUE) ? {href: href, color: c} :
				(size > 0) ? href :
				atp || at || href;
	}

	function tryGuess (byUrl) {
		let tryPNG = resolveUrl('/favicon.png', byUrl),
			tryICO = resolveUrl('/favicon.ico', byUrl);
		return loadImage(tryPNG)
			.catch(() => loadImage(tryICO))
			.catch(() => blankIcon);
	}
	getFavicon = function (url) {

		return get(url)
		.then((response) => {
			let doc = parser.parseFromString(response.body, 'text/html'),
				links = doc.querySelectorAll('link[rel*="icon"][href]'),
				favicon;
			favicon = findLargest(links);
			if (favicon && favicon.href) {
				favicon.href = resolveUrl(favicon.href, response.landingUrl || url, doc);
				return favicon;
			} else if (favicon) {
				favicon = resolveUrl(favicon, response.landingUrl || url, doc);
				return loadImage(favicon).catch(() => blankIcon);
			} else {
				return tryGuess(response.landingUrl || url);
			}
		}, (error) => tryGuess(error.responseURL || url));
	};
}());