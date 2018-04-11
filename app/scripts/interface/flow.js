﻿'use strict';

;(() => {

	window.getFirstPage = () => {
		const tmp = d('set').firstElementChild;
		if (
			!tmp.classList.contains('inactive')
			&& !tmp.classList.contains('hack')
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
				&& !tmp.classList.contains('hack')
			) {
				return tmp;
			}
			tmp = tmp[direction];
		}
	};

	function current_index () {
		let i = first_flow_page.index,
			res = i,
			classes;
		for (; i<current_flow_page.index; i++) {
			classes = d(`page${i}`).classList;
			if (!classes.contains('inactive') && !classes.contains('deleting')) {
				res++;
			}
		}
		return res;
	}

	window.setFlowPagePosition = () => {
		const proportionW = d('set').clientWidth/100,
			c = current_index();
		let n = -1;
		$('.flow .page').forEach((page) => {
			if (page.classList.contains('inactive')) {return;}
			page.style.left = proportionW * ( (n < c ? -5*(19-n)-50 : n === c ? 0 : 5*n + 50 ) );
			n++;
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
