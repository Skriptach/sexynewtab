'use strict';

;(() => {

	function toggleCustomize () {
		d('customize').classList.toggle('open');
	}

	function switchTheme (newTheme, save) {
		document.body.classList.remove(cuurentTheme);
		cuurentTheme = newTheme;
		document.body.classList.add(cuurentTheme);
		save && chrome.runtime.sendMessage({
			action: 'switchTheme',
			theme: cuurentTheme
		});
	}

	function setBackground (bg) {
		d('container').style['background-image'] = `url(${bg})`;
	}

	function bgChange () {
		if (event && event.type === 'paste'){
			setTimeout(bgChange, 1);
			return;
		}
		const bg = $('#background input')[0].value;
		setBackground(bg);
		chrome.runtime.sendMessage({
			action: 'setBackground',
			back: bg
		});
	}

	/*  Arghhh! Chrome!!! }:> */
	function animationSpeedDirtyHack () {
		const hackNode = document.createElement('div');
		hackNode.setAttribute('class', 'page hack');
		hackNode.index = -1;
		d('set').insertBefore(hackNode, d('page0'));
		d('set').appendChild(hackNode.cloneNode(true));
	}
	function revertDirtyHack () {
		const h = $('.page.hack');
		h[1].remove();
		h[0].remove();
	}

	function toggleDisplay () {
		document.body.classList.toggle('flow');
		document.body.classList.add('reflow');
		FLOW = !FLOW;
		if (!FLOW){
			revertDirtyHack();
			current_flow_page.classList.remove('current');
			first_flow_page = current_flow_page = null;
			setPagesSize();
		} else {
			first_flow_page = current_flow_page = getFirstPage();
			animationSpeedDirtyHack();
			if (!first_flow_page){return;}
			current_flow_page.classList.add('current');
			setBackGradient();
			setFlowPagePosition();
		}
		setTimeout(() => document.body.classList.remove('reflow'), 0);
		chrome.runtime.sendMessage({
			action: 'toggleView',
			FLOW
		});
		setBackGradient();
	}

	window.addEventListener('ready', () => {
		back.settings.THEME && switchTheme(back.settings.THEME);
		back.settings.BACK && setBackground(back.settings.BACK);
		back.settings.FLOW && toggleDisplay();

		$click.on('#toggle_button *', toggleDisplay);
		$click.on('#customize_button *', toggleCustomize);
		$click.on('#customize .theme *', (target) => {
			switchTheme(target.getAttribute('data'), true);
		});

		const inputBack = $('#background input')[0];
		inputBack.onpaste = inputBack.onkeyup = inputBack.onchange = inputBack.onblur = bgChange;
	});

})();
