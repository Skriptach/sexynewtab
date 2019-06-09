'use strict';

;(() => {

	let wait = null;

	function calcSize () {
		const ASPECT_RATIO = innerHeight / innerWidth;
		PAGE_WIDTH = FLOW ? innerWidth / 2 : (innerWidth - (GAP * (COLUMNS_COUNT + 1))) / COLUMNS_COUNT;
		PAGE_HEIGHT = FLOW ? innerHeight / 2 : PAGE_WIDTH * ASPECT_RATIO;
	}

	window.setBackGradientSize = () => {
		calcSize();
		const R = Math.sqrt(PAGE_WIDTH * PAGE_WIDTH / 4 + PAGE_HEIGHT * PAGE_HEIGHT / 3),
			Rf = Math.sqrt(innerWidth * innerWidth / 4 + innerHeight * innerHeight / 3);
		d('set').style.setProperty('--R', R);
		d('set').style.setProperty('--Rf', Rf);
	};

	window.setPagesSize = () => {
		setBackGradientSize();
		$('thumb-page').forEach((p) => {
			p.style.width = p.style.height = p.style.top = p.style.left = null;
		});
		d('set').style.setProperty('--aspect-ratio', innerHeight / innerWidth);
	};

	window.on('resize', () => {
		clearTimeout(wait);
		wait = setTimeout(() => {
			FLOW ? (setBackGradientSize(),setFlowPagePosition()) : setPagesSize();
		}, 150);
	});

})();
