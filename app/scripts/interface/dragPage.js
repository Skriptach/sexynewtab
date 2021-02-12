'use strict';

;(() => {

	let pagePosX, pagePosY, _offsetX, _offsetY;
	let dragPage = null;

	function getParams (page) {
		const res = {
			col: page.getAttribute('data-col'),
			row: page.getAttribute('data-row'),
			id: page.getAttribute('id'),
			index: page.index,
		};
		return res;
	}

	function setParams(page, params) {
		page.setAttribute('data-col', params.col);
		page.setAttribute('data-row', params.row);
		page.setAttribute('id', params.id || `page${params.index}`);
		page.index = params.index;
	}

	function onDrag (e) {
		if (e.screenX <= 0 || e.screenY <= 0) {
			return;
		}

		const p_left = e.x - _offsetX,
			p_top = e.y - _offsetY,
			col = Math.floor((p_left + PAGE_WIDTH / 2 + GAP) / (PAGE_WIDTH + GAP)),
			row = Math.floor((p_top + PAGE_HEIGHT / 2 + GAP) / (PAGE_HEIGHT + GAP)),
			position = row * COLUMNS_COUNT + col;

		dragPage.style.left = `${p_left}px`;
		dragPage.style.top = `${p_top}px`;
		if ((position >= 0) && (position < ROWS_COUNT * COLUMNS_COUNT) && (position !== dragPage.index)) {
			const sign = Math.sign(position - dragPage.index);
			const from = sign > 0 ? dragPage.index + sign : position;
			const to = sign < 0 ? dragPage.index + sign : position;
			const range = $(`thumb-page:nth-child(n+${from + 1}):nth-child(-n+${to + 1})`);
			Array.from( range )
				.sort((a, b) => (a.index - b.index) * sign)
				.reduce((prev, current, i, arr) => {
					const stash = getParams(current);
					setParams(current, prev);
					return stash;
				}, getParams(dragPage));
			setParams(dragPage, { col, row, index: position });
			d('set').insertBefore(dragPage, d(`page${position + 1}`));
		}
	}

	function stopDrag () {
		document.off('drag', onDrag);
		document.off('dragend', stopDrag);
		dragPage.style.zIndex = null;
		dragPage.classList.remove('draged');
		dragPage.style.left = null;
		dragPage.style.top = null;
		back.swap(lastPosition, dragPage.index);
		lastPosition = null;
	}

	function prepareDrag (e) {
		dragPage = event.target.closest('thumb-page');
		if (!dragPage || dragPage.classList.contains('turned') || FLOW) {
			e.preventDefault();
			return;
		}
		lastPosition = dragPage.index;
		dragPage.classList.add('draged');
		dragPage.style.zIndex = 1000;
		pagePosX = dragPage.offsetLeft;
		pagePosY = dragPage.offsetTop;
		_offsetX = e.x - pagePosX;
		_offsetY = e.y - pagePosY;
		document.on('drag', onDrag);
		document.on('dragend', stopDrag);
	};

	document.on('dragstart', prepareDrag);

})();
