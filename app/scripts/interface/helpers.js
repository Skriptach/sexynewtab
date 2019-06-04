'use strict';

;(() => {

	window.d = (id) => {
		return document.getElementById(id);
	};

	window.$ = (selector) => {
		return document.querySelectorAll(selector);
	};

})();
