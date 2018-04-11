'use strict';

;(() => {

	let pagePosX, pagePosY, _offsetX, _offsetY;
	let dragPage = null;

	function onDrag (e) {
		if (e.screenX <= 0 || e.screenY <= 0) {
			return;
		}

		const p_left = e.x - _offsetX,
			p_top = e.y - _offsetY,
			col = Math.floor((p_left + PAGE_WIDTH / 2 + DELTA) / (PAGE_WIDTH + DELTA)),
			row = Math.floor((p_top + PAGE_HEIGHT / 2 + DELTA) / (PAGE_HEIGHT + DELTA)),
			position = row * COLUMNS_COUNT + col;
		let TargetPosX,
			TargetPosY,
			modificator,
			i,
			moved,
			tmpPosX,
			tmpPosY;
		dragPage.style.left = p_left;
		dragPage.style.top = p_top;
		if ((position >= 0) && (position < ROWS_COUNT * COLUMNS_COUNT) && (position !== dragPage.index)) {
			if (Math.abs(p_left - col * (PAGE_WIDTH + DELTA)) < PAGE_WIDTH / 2) {
				TargetPosX = pagePosX;
				TargetPosY = pagePosY;
				modificator = (position > dragPage.index) ? 1 : -1;
				i = dragPage.index;
				do {
					i += modificator;
					moved = d(`page${i}`);
					tmpPosX = parseFloat(moved.style.left);
					tmpPosY = parseFloat(moved.style.top);
					moved.style.left = TargetPosX;
					moved.style.top = TargetPosY;
					TargetPosX = tmpPosX;
					TargetPosY = tmpPosY;
					moved.setAttribute('id', `page${i - modificator}`);
					moved.index = i - modificator;
				} while (i !== position);
				pagePosX = TargetPosX;
				pagePosY = TargetPosY;
				dragPage.index = position;
				dragPage.setAttribute('id', `page${position}`);
				d('set').insertBefore(dragPage, d(`page${position + 1}`));
			}
		}
	}

	function stopDrag () {
		document.ondrag = null;
		document.ondragend = null;
		dragPage.ondragover = null;
		dragPage.style.zIndex = null;
		dragPage.classList.remove('draged');
		dragPage.style.left = pagePosX;
		dragPage.style.top = pagePosY;
		dragPage.style.width = '';
		dragPage.style.height = '';
		back.swap(lastPosition, dragPage.index);
		lastPosition = null;
	}

	window.prepareDrag = (e) => {
		dragPage = closest(e.target, '.page');
		if (dragPage.classList.contains('turned') || FLOW) {
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
		dragPage.style.width = PAGE_WIDTH + 15;
		dragPage.style.height = PAGE_HEIGHT + 15;
		document.ondrag = onDrag;
		document.ondragend = stopDrag;
	};

})();
