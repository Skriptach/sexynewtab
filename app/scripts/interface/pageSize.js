'use strict';

;(() => {

	let _width = innerWidth,
		_height = innerHeight,
		wait = null;

	function calcSize () {
		const PROPORTION = _height / _width;
		PAGE_WIDTH = FLOW ? _width / 2 : (_width - (DELTA * (COLUMNS_COUNT + 1))) / COLUMNS_COUNT;
		PAGE_HEIGHT = FLOW ? _height / 2 : PAGE_WIDTH * PROPORTION;
		if (!FLOW && PAGE_HEIGHT * ROWS_COUNT + ((ROWS_COUNT + 1) * DELTA) > _height) {
			PAGE_HEIGHT = (_height - (DELTA * (ROWS_COUNT + 1))) / ROWS_COUNT;
			PAGE_WIDTH = PAGE_HEIGHT / PROPORTION;
		}
	}

	window.setBackGradient = () => {
		calcSize();
		const grad_radius = Math.sqrt(PAGE_WIDTH * PAGE_WIDTH / 4 + PAGE_HEIGHT * PAGE_HEIGHT / 3),
			grad_radiusF = Math.sqrt(innerWidth * innerWidth / 4 + innerHeight * innerHeight / 3);
		d('backgradient').innerHTML =
		`.backgradient {
			background-image: -webkit-gradient(radial, center top, 5, center 30%,
					${grad_radius}, from(#000065), to(#000010))
			}
		.full .backgradient {
			background-image: -webkit-gradient(radial, center top, 5, center 30%,
					${grad_radiusF}, from(#000065), to(#000010))
			}`;
	};

	window.setPagesSize = () => {
		let index, leftPos, topPos;
		setBackGradient();
		const setWidth = ((PAGE_WIDTH + DELTA) * COLUMNS_COUNT - DELTA);
		const setHeight = ((PAGE_HEIGHT + DELTA) * ROWS_COUNT - DELTA);
		$('.page').forEach((p) => {
			p.style.width = p.style.height = p.style.top = p.style.left = null;
		});
		const rules =
		`#set {
			width: ${setWidth}px;
			height: ${setHeight}px;
		}
		.page {
			width: ${PAGE_WIDTH}px;
			height: ${PAGE_HEIGHT}px;
			}
		body:not(.flow) .page.full {
			width: ${innerWidth/2}px;
			height: ${innerHeight/2}px;
			left: ${(setWidth - innerWidth/2)/2}px !important;
			top: ${(setHeight - innerHeight/2)/2}px !important;
			}
		.plus i {
			font-size: ${PAGE_HEIGHT  * 35.457 / 100}px`;
		index = 0;
		d('tile_style').innerHTML = rules;
		let page;
		for (let i = 0; i < ROWS_COUNT; i++) {
			for (let j = 0; j < COLUMNS_COUNT; j++) {
				leftPos = j * (PAGE_WIDTH + DELTA);
				topPos = i * (PAGE_HEIGHT + DELTA);
				page = d(`page${index}`);
				if (page) {
					page.style.left = leftPos;
					page.style.top = topPos;
					index++;
				}
			}
		}
	};

	window.addEventListener('resize', () => {
		if (_width !== innerWidth || _height !== innerHeight) {
			_width = innerWidth;
			_height = innerHeight;
			clearTimeout(wait);
			wait = setTimeout(() => {
				FLOW ? (setBackGradient(),setFlowPagePosition()) : setPagesSize();
			}, 100);
		}
	});

})();
