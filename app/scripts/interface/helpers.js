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

})();
