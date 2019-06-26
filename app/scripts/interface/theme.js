'use strict';

;(() => {

	function toggleCustomize () {
		d('customize').classList.toggle('open');
	}

	function switchTheme (newTheme, save) {
		document.body.classList.remove(currentTheme);
		currentTheme = newTheme;
		document.body.classList.add(currentTheme);
		save && chrome.runtime.sendMessage({
			action: 'switchTheme',
			theme: currentTheme
		});
	}

	window.updateBackground = function () {
		const bg = back.settings.BACK_TYPE === 'URL' ? back.settings.BACK && `url(${back.settings.BACK})` :
			back.settings.BACK_TYPE === 'IMAGE' ? back.settings.background : '';

		d('main').style['background-image'] = bg.length ? bg : null;
		if (bg.length){
			document.body.classList.add('custom-bg');
		} else {
			document.body.classList.remove('custom-bg');
		}
	};

	const inputBack = $('#customize url-input')[0];

	function bgChange () {
		if (inputBack.validity.valid) {
			chrome.runtime.sendMessage({
				action: 'setBackground',
				back: inputBack.value
			});
		}
	}

	function toggleDisplay () {
		document.body.classList.toggle('flow');
		document.body.classList.add('reflow');
		FLOW = !FLOW;
		if (!FLOW){
			current_flow_page.classList.remove('current');
			first_flow_page = current_flow_page = null;
			setPagesSize();
		} else {
			first_flow_page = current_flow_page = getFirstPage();
			if (!first_flow_page){return;}
			current_flow_page.classList.add('current');
			setBackGradientSize();
			setFlowPagePosition();
		}
		setTimeout(() => document.body.classList.remove('reflow'), 50);
		chrome.runtime.sendMessage({
			action: 'toggleView',
			FLOW
		});
	}


	window.on('ready', () => {
		back.settings.THEME && switchTheme(back.settings.THEME);
		back.settings.BACK && (inputBack.value = back.settings.BACK);
		updateBackground();
		back.settings.FLOW && toggleDisplay();

		document.on('flow', toggleDisplay);
		document.on('customize', toggleCustomize);
		$click.on('#customize .theme a *', (target) => {
			switchTheme(target.getAttribute('data'), true);
		});

		setTimeout(() => document.body.classList.remove('reflow'), 50);
		inputBack.on('change', bgChange);
	});

})();
