'use strict';

;(() => {

	const innerHtml =
			`<div class="flipper">
				<a class="link">
					<div class="backgradient"></div>
					<div class="plus"><i class="st-plus-circle"></i></div>
					<div class="thumbnail"></div>
				</a>
				<icon-btn type="edit" ></icon-btn>
				<icon-btn type="clear" ></icon-btn>
			</div>`,
		thumbnailnode = document.createElement('div'),
		pages = document.createDocumentFragment();

	function pageClickHandler (target) {
		const page = target.closest('.page');
		if (FLOW && !page.classList.contains('current')){
			event.preventDefault();
			if (event.button !== 0) {return;}
			flowTo(page);
		} else {
			if (event.button !== 0) {return;}
			page.classList.add('full');
		}
	}

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

	window.on('ready', () => {
		$click.on('.page:not(.inactive) .flipper a *', pageClickHandler);
	});

})();
