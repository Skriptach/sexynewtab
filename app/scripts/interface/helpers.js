'use strict';

;(() => {

	window.d = (id) => {
		return document.getElementById(id);
	};

	window.$ = (selector) => {
		return document.querySelectorAll(selector);
	};

	// just short aliases
	EventTarget.prototype.on = EventTarget.prototype.addEventListener;
	EventTarget.prototype.off = EventTarget.prototype.removeEventListener;

})();
