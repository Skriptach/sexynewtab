'use strict';

;(() => {

	window.d = (id) => {
		return document.getElementById(id);
	};

	window.$ = (selector) => {
		return document.querySelectorAll(selector);
	};

	window.closest = (el, selector) => {
		while (el) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentElement;
		}
		return null;
	};

})();
