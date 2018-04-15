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

	function scrollFlow (e) {
		if (!FLOW || EDIT){return;}
		if (e.wheelDelta < 0) {
			flowTo(getPage('next'));
		} else if (e.wheelDelta > 0) {
			flowTo(getPage('previous'));
		}
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

})();
