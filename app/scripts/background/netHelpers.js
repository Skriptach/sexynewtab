'use strict';

;(() => {

	Promise.any = function (fetchers) {
		const errors = [];
		return Promise.race(fetchers.map(f => {
			return f.promise.catch(e => {
				errors.push(e);
				if (errors.length >= fetchers.length) {
					throw errors;
				}

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
				_self.response = r;
				if (r.ok) {
					return _self;
				}

				throw new Error(r.status);
			});
		}

		abort() {
			this.controller.abort();
		}

		getBody() {
			return this.response.text()
				.then(body => {
					return {
						body,
						url: this.response.url,
					};
				});
		}

		getBuffer() {
			return this.response.arrayBuffer()
				.then(buffer => {
					return {
						buffer,
						url: this.response.url,
						contentType: this.response.headers.get('content-type')
					};
				});
		}
	}

	window.get = function (url, asBuffer) {
		/*
			Fixes access errors. Some pages requiers credentials,
			but some denies access for cors request while logged in i.e. twitter.com
		*/
		const ofRequest = [
			new Fetcher(url, true),
			new Fetcher(url),
		];
		return Promise.any(ofRequest).then(f => {
			ofRequest.forEach(v => {
				if (v !== f) {
					v.abort();
				}
			});
			if (!f.response.ok) {
				const fallback = {
					url: f.response.url
				};
				throw fallback;
			}
			return (asBuffer ? f.getBuffer() : f.getBody());
		});
	};

	window.loadImage = function (href) {
		return new Fetcher(href).promise.then((fetcher) => {
			const imageRX = /image\/*/;
			if (!imageRX.test(fetcher.response.headers.get('content-type'))) {
				throw new Error('Not an image');
			}
			return fetcher.response.blob()
				.then(toBase64)
				.then((dataUrl) => {
					return {
						dataUrl
					};
				});
		});
	};


})();