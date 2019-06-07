'use strict';

;(() => {

	const innerHtml =
			`<div class="flipper">
				<a is="thumb-link"></a>
				<icon-btn type="edit" ></icon-btn>
				<icon-btn type="clear" ></icon-btn>
			</div>`,
		thumbnailnode = document.createElement('div'),
		pages = document.createDocumentFragment();

	window.createPages = () => {
		let index,
			page;
		thumbnailnode.setAttribute('class', 'page inactive');
		thumbnailnode.insertAdjacentHTML('beforeend', innerHtml);
		index = 0;
		for (let i = 0; i < ROWS_COUNT; i++) {
			for (let j = 0; j < COLUMNS_COUNT; j++) {
				page = thumbnailnode.cloneNode(true);
				page.draggable = true;
				page.setAttribute('id', `page${index}`);
				page.index = index;
				page.setAttribute('data-col', j);
				page.setAttribute('data-row', i);
				pages.appendChild(page);
				updatePage(index, page);
				index++;
			}
		}
		d('set').appendChild(pages);
		document.on('dragstart', prepareDrag);
	};

})();
