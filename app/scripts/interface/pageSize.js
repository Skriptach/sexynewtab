'use strict';

;(() => {

	let wait = null;

	function calcSize () {
		const PROPORTION = innerHeight / innerWidth;
		PAGE_WIDTH = FLOW ? innerWidth / 2 : (innerWidth - (DELTA * (COLUMNS_COUNT + 1))) / COLUMNS_COUNT;
		PAGE_HEIGHT = FLOW ? innerHeight / 2 : PAGE_WIDTH * PROPORTION;
		if (!FLOW && PAGE_HEIGHT * ROWS_COUNT + ((ROWS_COUNT + 1) * DELTA) > innerHeight) {
			PAGE_HEIGHT = (innerHeight - (DELTA * (ROWS_COUNT + 1))) / ROWS_COUNT;
			PAGE_WIDTH = PAGE_HEIGHT / PROPORTION;
		}
	}

	window.setBackGradient = () => {
		calcSize();
		const grad_radius = Math.sqrt(PAGE_WIDTH * PAGE_WIDTH / 4 + PAGE_HEIGHT * PAGE_HEIGHT / 3);
		d('backgradient').innerHTML =
		`.backgradient {
			background-image: -webkit-gradient(radial, center top, 5, center 30%,
					${grad_radius}, from(#000065), to(#000010))
			}`;
	};

	window.setPagesSize = () => {
		let index;
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
				page = d(`page${index}`);
				if (page) {
					page.style.left = `${j * (PAGE_WIDTH + DELTA)}px`;
					page.style.top = `${i * (PAGE_HEIGHT + DELTA)}px`;
					index++;
				}
			}
		}
	};

	window.addEventListener('resize', () => {
		clearTimeout(wait);
		wait = setTimeout(() => {
			FLOW ? (setBackGradient(),setFlowPagePosition()) : setPagesSize();
		}, 150);
	});

})();
