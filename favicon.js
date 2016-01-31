var getFavicon, resolveUrl;
;(function (){
'use strict';

	var parser = new DOMParser();

	resolveUrl = function (url, base_url, doc) {
		doc = doc || parser.parseFromString('<html><head></head><body></body></html>', 'text/html');
		var base = doc.getElementsByTagName('base')[0],
			head = doc.head || doc.getElementsByTagName('head')[0],
			our_base = base || head.appendChild(doc.createElement('base')),
			resolver = doc.createElement('a');

		our_base.href = base_url;
		resolver.href = url;
		return resolver.href;
	};

	function get (url) {
		return new Promise(function(resolve, reject) {
			if (!url){reject();return;}
			var xhr = new XMLHttpRequest();

			xhr.open('GET', url, true);
			xhr.onloadend = function() {
				if (xhr.status === 200) {
					resolve({
						body: xhr.responseText,
						landingUrl: xhr.responseURL
					});
				} else {
					var error = new Error(xhr.statusText);
					error.code = xhr.status;
					error.responseURL = xhr.responseURL;
					reject(error);
				}
				xhr = undefined;
			};
			xhr.onerror = function() {
				reject(new Error('Network Error. URL:' + url));
			};
			xhr.send();
		});
	}

	function loadImage (src) {
		return new Promise(function (resolve, reject) {
			var img = document.createElement('img');
			img.onload = function () {
				resolve(src);
			};
			img.onerror = function () {
				reject();
			};

			img.src = src;
		});
	}

	function findLargest (links) {
		if (!links.length){return;}
		var link = links[links.length - 1],
			size = parseInt(link.getAttribute('sizes'), 10) || 0;
		[].slice.call(links).forEach(function (l) {
			var s = parseInt(l.getAttribute('sizes'), 10) || 0;
			if (s>size) {
				link = l;
				size = s;
			}
		});
		return link;
	}

	function tryGuess (byUrl) {
		var tryPNG = resolveUrl('/favicon.png', byUrl),
			tryICO = resolveUrl('/favicon.ico', byUrl);
		return loadImage(tryPNG)
			.catch(function () {
				return loadImage(tryICO)
					.catch(function () {
						return 'chrome://favicon/' + byUrl;
					});
			});
	}
	getFavicon = function (url) {

		return get(url)
		.then(function (response) {
			var doc = parser.parseFromString(response.body, 'text/html'),
				links = doc.querySelectorAll('link[rel*="icon"][href]'),
				favicon;
			favicon = findLargest(links);
			if (favicon) {
				return resolveUrl(favicon.getAttribute('href'), response.landingUrl || url, doc);
			} else {
				return tryGuess(response.landingUrl || url);
			}
		}, function (error) {
			return tryGuess(error.responseURL || url);
		});
	};
}());