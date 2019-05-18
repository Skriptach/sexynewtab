'use strict';

;(() => {

	const innerHtml =
			`<div class="flipper">
				<a class="link">
					<div class="backgradient"></div>
					<div class="plus"><i class="st-plus-circle"></i></div>
					<div class="thumbnail"></div>
				</a>
				<button class="edit" title="${chrome.i18n.getMessage('m_edit')}"><i class="st-pencil"></i></button>
				<button class="remove" title="${chrome.i18n.getMessage('m_clear')}"><i class="st-trash"></i></button>
			</div>`,
		thumbnailnode = document.createElement('div'),
		pages = document.createDocumentFragment();

	function pageClickHandler (target) {
		const page = closest(target, '.page');
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
				page.style.left = `${j * (PAGE_WIDTH + DELTA)}px`;
				page.style.top  = `${i * (PAGE_HEIGHT + DELTA)}px`;
				pages.appendChild(page);
				updatePage(index, page);
				index++;
			}
		}
		d('set').appendChild(pages);
		document.addEventListener('dragstart', prepareDrag);
	};

	window.addEventListener('ready', () => {
		$click.on('.page:not(.inactive) .flipper a *', pageClickHandler);
	});

})();
