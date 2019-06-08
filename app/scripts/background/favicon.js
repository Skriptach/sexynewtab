'use strict';

;(() => {

	Promise.any = function (fetchers) {
		const errors = [];
		return Promise.race(fetchers.map(f => {
			return f.promise.catch(e => {
				errors.push(e);
				if (errors.length >= fetchers.length) {throw errors;}
				
				return Promise.race([]);
			});
		}));
	};

	class Fetcher {
		constructor (url, isInclude) {
			const _self = this;
			this.controller = new AbortController();
			this.promise = fetch(url, {
				signal : this.controller.signal,
				credentials: isInclude ? 'include' : 'omit',
			}).then(r => {
				if (r.ok) {
					_self.response = r;
					return _self;
				}

				throw new Error(r.status);
			});
		}

		abort () {
			this.controller.abort();
		}

		getBody () {
			if (!this.response.ok) {
				const fallback = {
					url: this.response.url
				};
				throw fallback;
			}

			return this.response.text()
				.then(body => {
					return {
						body,
						url: this.response.url,
					};
				});
		}
	}

	const parser = new DOMParser(),
		blankIcon = {href: '/icons/document.svg', color: 'rgba(220, 220, 220, 0.9)'};

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

	function get (url) {
		/*	
			Fixes access errors. Some pages requiers credentials,
			but some denies access for cors request while logged in i.e. twitter.com 
		*/
		const ofRequest = [
			new Fetcher(url),
			/* https://www.chromestatus.com/feature/5088147346030592
			new Fetcher(url, true),*/
		];
		return Promise.any(ofRequest).then(f => {
			ofRequest.forEach(v => {
				if (v !== f){
					v.abort();
				}
			});
			return f.getBody();
		});
	}

	function convertBlobToBase64 (blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader;
			reader.onerror = reject;
			reader.onload = () => {
				resolve(reader.result);
			};
			reader.readAsDataURL(blob);
		});
	}

	function loadImage (href) {
		return new Fetcher(href).promise.then((fetcher) => {
			return fetcher.response.blob()
				.then(convertBlobToBase64)
				.then((dataUrl) => {
					return {
						dataUrl
					};
				});
		});
	}

	function getSize (link) {
		const c = link.getAttribute('color'),
			v = link.getAttribute('sizes'),
			n = parseInt(v, 10),
			h = link.getAttribute('href');
		return (v === 'any' || (/\.svg$/).test(h) || c) ? Number.MAX_VALUE :
			(n > 512) ? 16 : // larger would be an overhead
			(n >= 16) ? n :
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
							href: resolveUrl(link.getAttribute('href'), response.url || url, doc),
							color: link.getAttribute('color'),
							size: getSize(link)
						};
					}).sort((a, b) => {
						return b.size - a.size;
					});
				if (links.length) {
					return findLargest(links)
						.catch(() => tryGuess(response.url || url));
				}

				return tryGuess(response.url || url);
			}, (error) => tryGuess(error.url || url));
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
