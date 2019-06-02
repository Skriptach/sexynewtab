'use strict';

;(() => {

	function toggleCustomize () {
		d('customize').classList.toggle('open');
		$('button.customize')[0].classList.toggle('active');
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

	function setBackground (bg) {
		d('main').style['background-image'] = bg.length ? `url(${bg})` : null;
		if (bg.length){
			document.body.classList.add('custom-bg');
		} else {
			document.body.classList.remove('custom-bg');
		}
		chrome.runtime.sendMessage({
			action: 'setBackground',
			back: bg
		});
	}

	const inputBack = $('#customize url-input')[0];

	function bgChange () {
		if (inputBack.validity.valid){
			setBackground(inputBack.value);
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

	window.addEventListener('ready', () => {
		back.settings.THEME && switchTheme(back.settings.THEME);
		back.settings.BACK && (setBackground(back.settings.BACK), inputBack.value = back.settings.BACK);
		back.settings.FLOW && toggleDisplay();

		$click.on('button.toggle *', toggleDisplay);
		$click.on('button.customize *', toggleCustomize);
		$click.on('#customize .theme *', (target) => {
			switchTheme(target.getAttribute('data'), true);
		});

		setTimeout(() => document.body.classList.remove('reflow'), 50);
		inputBack.addEventListener('change', bgChange);
	});

})();
