'use strict';

;(() => {

	function toggleCustomize () {
		d('customize').classList.toggle('open');
	}

	function toggleEye() {
		document.body.classList.toggle('shut-eye');
		event.target.classList.toggle('st-eye-off');
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

	window.uploadBgImage = function (file) {
		toBase64(file)
			.then((base64) => {
				const image = base64.length ? `url(${base64})` : null;
				chrome.runtime.sendMessage({
					action: 'loadBackground',
					image,
				});
			});
	};

	window.updateBackground = function () {
		const bg = (back.settings.BACK_TYPE === 'THEME' && presets[back.settings.THEME]) ? back.getBg(innerWidth, innerHeight, currentTheme):
			back.settings.BACK_TYPE === 'URL' ? back.settings.BACK && `url(${back.settings.BACK})` :
			back.settings.BACK_TYPE === 'IMAGE' ? back.settings.background : '';

		d('container').style['background-image'] = bg.length ? bg : null;
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

	const switchTypeSender = (action) => (event) => {
		chrome.runtime.sendMessage({
			action,
			type: event.target.type
		});
	};

	window.on('ready', () => {
		back.settings.THEME && switchTheme(back.settings.THEME);
		back.settings.BACK && (inputBack.value = back.settings.BACK);
		updateBackground();

		document.on('flow', toggleDisplay);
		back.settings.FLOW && document.querySelector('toggle-btn[type="flow"]').toggle();

		document.on('customize', toggleCustomize);
		document.on('eye', toggleEye);

		$('#customize .theme')[0].value = back.settings.THEME;
		$('#customize .theme')[0].on('change', () => {
			switchTheme(event.target.value, true);
		});

		$('#customize .background')[0].on('switch', switchTypeSender('switchBgType'));
		$('#customize .thumb')[0].on('switch', switchTypeSender('switchThumbType'));

		setTimeout(() => document.body.classList.remove('reflow'), 50);
		inputBack.on('change', bgChange);
	});

})();
