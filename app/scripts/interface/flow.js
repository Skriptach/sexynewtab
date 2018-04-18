'use strict';

;(() => {

	window.getFirstPage = () => {
		const tmp = d('set').firstElementChild;
		if (
			!tmp.classList.contains('inactive')
		) {
			return tmp;
		}
		return getPage('next', tmp);
	};

	window.getPage = ( dir = 'next', current = current_flow_page ) => {
		const direction = `${dir}ElementSibling`;
		let tmp = current[direction];
		while (tmp) {
			if (
				!tmp.classList.contains('inactive')
			) {
				return tmp;
			}
			tmp = tmp[direction];
		}
	};

	function current_index () {
		const pages = $('.page:not(.inactive):not(.deleting)');
		return Array.prototype.slice.call(pages).indexOf(current_flow_page);
	}

	const step = 10,
		shift = 30;

	window.setFlowPagePosition = () => {
		const depth = 156.41293013555787*innerWidth/100;
		const perspective = 41.71011470281543*innerWidth/100;
		const css = 
		`.flow #main {
			perspective: ${perspective}px;}
		.flow .page {
			transform: rotateY(45deg) translateZ(-${depth}px);}
		.flow .current ~ .page {
			transform: rotateY(-45deg) translateZ(-${depth}px);}`;
		d('depth_style').innerHTML = css;

		const proportionW = d('set').clientWidth/100,
			c = current_index();
		const nodes = $('.page:not(.inactive)');
		nodes.forEach((page, n) => {
			const s = Math.sign(n-c),
				left = step*(n-c) + s*shift;
			page.style.left = proportionW * left;
			page.style.top = '';
		});
	};

	window.flowTo = (target) => {
		if(target){
			current_flow_page.classList.remove('current');
			current_flow_page = target;
			current_flow_page.classList.add('current');
			setFlowPagePosition();
		}
	};

	let scrolling = false;
	function scrollFlow (e) {
		if (!FLOW || EDIT){return;}
		scrolling = true;
		d('main').classList.add('scrolling');
		flowTo(getPage(e.deltaY > 0 ? 'next' : 'previous'));
		setTimeout(() => {
			scrolling = false;
		}, 800);
	}

	function revertScrolling () {
		!scrolling && d('main').classList.remove('scrolling');
	}

	function keyHandler (e) {
		if(e.keyCode === 27 && currentEditPage){
			window.hideEditForm();
		}
		if (!FLOW){return;}
		if (e.keyCode === 39) {
			flowTo(getPage('next'));
		} else if (e.keyCode === 37) {
			flowTo(getPage('previous'));
		}
	}

	window.addEventListener('ready', () => {
		document.onkeydown = keyHandler;
		document.onmousewheel = scrollFlow;
	});

	document.addEventListener('mousemove', revertScrolling);

})();
