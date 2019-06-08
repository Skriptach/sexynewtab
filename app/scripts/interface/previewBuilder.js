'use strict';

;(() => {

	const pages = document.createDocumentFragment();

	window.createPages = () => {
		let index = 0;
		for (let r = 0; r < ROWS_COUNT; r++) {
			for (let c = 0; c < COLUMNS_COUNT; c++) {
				const page = new ThumbPage(index, c, r);
				page.update();
				pages.appendChild(page);
				index++;
			}
		}
		d('set').appendChild(pages);
		document.on('dragstart', prepareDrag);
	};

})();
