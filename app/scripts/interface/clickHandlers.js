'use strict';

;(() => {

	const handlers = {};

	window.$click = {
		on (selector, func) {
			handlers[selector] = func;
		}
	};

	function clicksDelegate () {
		for (const selector in handlers){
			if (event.target.matches(selector) || event.target.matches(selector.replace('*', ''))){
				const target = event.target.closest(selector.replace('*', ''));
				handlers[selector].call(target, target);
				return;
			}
		}
	};

	document.on('click', clicksDelegate);

})();
