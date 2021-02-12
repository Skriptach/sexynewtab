'use strict';

;(() => {
	if (location.ancestorOrigins.length !== 1 ||
		!chrome.extension.getURL('').includes(location.ancestorOrigins[0])) {
		return;
	}

	function pageScript() {
		const scriptHash = {};
		const prnt = document.createElement('div');

		function loadScript(scriptElement) {
			const id = Math.random().toString(16);
			scriptHash[id] = scriptElement;
			prnt.appendChild(scriptElement);
			window.dispatchEvent(new CustomEvent('preloadScript', { detail: { id, src: scriptElement.src } }));
		}

		function listenScripts() {
			window.addEventListener('scriptLoaded', ({detail}) => {
				const { id } = detail;
				const s = scriptHash[id];
				if (s) {
					s.onload && s.onload();
					s.dispatchEvent(new Event('load'));
				}
			});
			window.addEventListener('scriptReplaced', ({detail}) => {
				const { attrs } = detail;
				const script = document.createElement('script');
				attrs.forEach(e => script.setAttribute(e[0], e[1]));
				const { id } = script;
				scriptHash[id] = script;
			});
		}

		function tweakLocation() {
			const ORIGIN1 = 'chrome-untrusted://new-tab-page';
			const ORIGIN2 = 'chrome://new-tab-page';
			const { ancestorOrigins, assign, reload, replace, toString, ...props } = location;
			const loc = {
				...props,
				ancestorOrigins: [ORIGIN1, ORIGIN2],
				assign: () => location.assign(),
				reload: () => location.reload(),
				replace: () => location.replace(),
			};
			document.loc = window.loc = loc;
		}

		function tweakNodes () {
			const {head} = document;

			const getElementById = document.getElementById;
			document.getElementById = function (id) {
				return scriptHash[id] ? scriptHash[id] : getElementById.call(this, id);
			};

			const insertBefore = head.insertBefore;
			head.insertBefore = function (element, ref) {
				if (element.nodeName === 'SCRIPT' && element.src) {
					loadScript(element);
				} else {
					return insertBefore.call(this, element, ref);
				}
			};

			const appendChild = head.appendChild;
			head.appendChild = function (element) {
				if (element.nodeName === 'SCRIPT' && element.src) {
					loadScript(element);
				} else {
					return appendChild.call(this, element);
				}
			};
		}

		listenScripts();
		tweakLocation();
		tweakNodes();
	}

	function insert(source) {
		const script = document.createElement('script');
		if (source) {
			script.appendChild(document.createTextNode(source));
		}
		document.head.appendChild(script);
		return script;
	}

	function preload (src) {
		return new Promise(resolve => {
			chrome.runtime.sendMessage({
				action: 'preloadScript',
				src,
			}, response => {
				if (response && response.source) {
					resolve(response.source);
				}
			});
		});
	}

	function detectChanges (cb) {
		const html = document.querySelector('html');
		new MutationObserver(cb).observe(html, { childList: true, subtree: true });
	}

	function getAllAttributes(node) {
		return Array.prototype.map.call(node.attributes, (a) => [a.name, a.value]);
	}

	function replace(script) {
		if (script.src) {
			script.remove();
			const attrs = getAllAttributes(script);
			window.dispatchEvent(new CustomEvent('scriptReplaced', { detail: { attrs } }));
			const newScript = insert();
			preload(script.src).then((s) => {
				newScript.appendChild(document.createTextNode(s));
				script.id && window.dispatchEvent(new CustomEvent('scriptLoaded', { detail: { id: script.id } }));
			});
		}
	}

	function inject() {
		window.addEventListener('preloadScript', ({detail}) => {
			const { id, src } = detail;
			preload(src).then(insert).then(() => {
				window.dispatchEvent(new CustomEvent('scriptLoaded', { detail: { id } }));
			});
		});
		insert(`'use strict';
			(() => {
				${pageScript.toString()};

				${pageScript.name}();
			})();`);
	}

	function checkChanges (mutationsList) {
		for (const mutation of mutationsList) {
			if (mutation.addedNodes.length) {
				const head = Array.prototype.filter.call(mutation.addedNodes, n => n.nodeName === 'HEAD');
				head.length && inject();

				const script = Array.prototype.filter.call(mutation.addedNodes, n => n.nodeName === 'SCRIPT');
				script.forEach(replace);
			}
		}
	}

	detectChanges(checkChanges);
})();
