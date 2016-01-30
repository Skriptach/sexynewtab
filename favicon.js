var getFavicon;
;(function (){

	var parser = new DOMParser();

	function resolve(doc, url, base_url) {
		var base = doc.getElementsByTagName('base')[0],
			head = doc.head || doc.getElementsByTagName('head')[0],
			our_base = base || head.appendChild(doc.createElement('base')),
			resolver = doc.createElement('a');

		our_base.href = base_url;
		resolver.href = url;
		return resolver.href;
	}

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
					var error = new Error(this.statusText);
					error.code = this.status;
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
			img.onload = function (argument) {
				resolve(src);
			};
			img.onerror = function (argument) {
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

	getFavicon = function (url) {
		return get(url)
		.then(function (response) {
			var doc = parser.parseFromString(response.body, "text/html"),
				links = doc.querySelectorAll('link[rel*="icon"][href]'),
				favicon;
			favicon = findLargest(links);
			if (favicon) {
				return resolve(doc, favicon.getAttribute('href'), response.landingUrl || url);
			} else {
				var tryPNG = resolve(doc, '/favicon.png', response.landingUrl || url),
					tryICO = resolve(doc, '/favicon.ico', response.landingUrl || url);
				return loadImage(tryPNG)
					.catch(function () {
						return loadImage(tryICO)
							.catch(function () {
								return 'chrome://favicon/' + (response.landingUrl || url);
							});
					});
			}
		}, function () {});
	};
}());