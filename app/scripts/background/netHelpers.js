'use strict';

;(() => {

	Promise.any = function (fetchers) {
		const errors = [];
		return Promise.race(fetchers.map(f => {
			return f.promise.catch(e => {
				errors.push(e);
				if (errors.length >= fetchers.length) { throw errors; }

				return Promise.race([]);
			});
		}));
	};

	class Fetcher {
		constructor(url, isInclude) {
			const _self = this;
			this.controller = new AbortController();
			this.promise = fetch(url, {
				signal: this.controller.signal,
				credentials: isInclude ? 'include' : 'omit',
			}).then(r => {
				if (r.ok) {
					_self.response = r;
					return _self;
				}

				throw new Error(r.status);
			});
		}

		abort() {
			this.controller.abort();
		}

		getBody() {
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

	window.get = function (url) {
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
				if (v !== f) {
					v.abort();
				}
			});
			return f.getBody();
		});
	}

	function convertBlobToBase64(blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader;
			reader.onerror = reject;
			reader.onload = () => {
				resolve(reader.result);
			};
			reader.readAsDataURL(blob);
		});
	}

	window.loadImage = function (href) {
		return new Fetcher(href).promise.then((fetcher) => {
			const imageRX = /image\/*/;
			if (!imageRX.test(fetcher.response.headers.get('content-type'))) {
				throw new Error('Not an image');
			}
			return fetcher.response.blob()
				.then(convertBlobToBase64)
				.then((dataUrl) => {
					return {
						dataUrl
					};
				});
		});
	}


})();