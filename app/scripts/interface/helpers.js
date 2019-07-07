'use strict';

;(() => {

	window.d = (id) => {
		return document.getElementById(id);
	};

	window.$ = (selector) => {
		return document.querySelectorAll(selector);
	};

	window.debounce = (func, timeout = 300) => {
		let timerId;

		return (...args) => {
			clearTimeout(timerId);
			timerId = setTimeout(func.bind(null, ...args), timeout);
		};
	};
	// just short aliases
	EventTarget.prototype.on = EventTarget.prototype.addEventListener;
	EventTarget.prototype.off = EventTarget.prototype.removeEventListener;

	window.interpolate = function(str, params) {
		const names = Object.keys(params);
		/* unsafe
		return new Function(...names, `return \`${str}\`;`)(...vals);
		*/

		// not global replace
		return names.reduce((val, key) => val.replace(`\${${key}}`, params[key]), str );
	};
})();
