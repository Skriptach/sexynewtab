'use strict';

;(function () {

	function clearPage () {
		chrome.runtime.sendMessage({
			action: 'clear',
			index: event.target.closest('.page').index
		});
	}

	function removePage (page) {
		page.querySelector('a').removeAttribute('href');
		page.style.webkitTransform = 'scale(0.3)';
		setTimeout(() => {
			page.classList.add('inactive');
			if (FLOW){
				if (page === first_flow_page){
					first_flow_page = getFirstPage();
				}
				page.classList.add('deleting');
				flowTo(getPage('next') || getPage('previous'));
				setTimeout(() => page.classList.remove('deleting'), 500);
			}
			page.style.setProperty('--fav-image', null);
			page.style.setProperty('--fav-mask', null);
			page.style.setProperty('--fav-color', null);
			page.style.setProperty('--thumb-image', null);
			page.style.webkitTransform = 'scale(1)';
			setTimeout(() => {page.style.webkitTransform = '';}, 10);
		}, 200);
	}

	window.updatePage = (slotIndex, page, thumb) => {
		page = page || d(`page${slotIndex}`);
		const oldUrl = page.url;
		page.url = slotsList[slotIndex] ? slotsList[slotIndex].url : '';
		page.thumb = thumb ? thumb :
			slotsList[slotIndex] && slotsList[slotIndex].thumb ? slotsList[slotIndex].thumb :
			(oldUrl === page.url) ? page.thumb : '';
		if (page.url) {
			page.querySelector('a').setAttribute('href', page.url);
			page.classList.remove('inactive');
			if (!page.thumb){
				const isVector = !!slotsList[slotIndex].favicon.color;
				const url = slotsList[slotIndex].favicon.url;
				page.style.setProperty('--fav-image', isVector ? null : `url("${url}")`);
				page.style.setProperty('--fav-mask', isVector ? `url("${url}")` : null);
				page.style.setProperty('--fav-color', isVector ? slotsList[slotIndex].favicon.color || '#FFF' : null);
			}
			page.style.setProperty('--thumb-image', page.thumb ? `url("${page.thumb}")` : null);
		}
	};

	window.on('ready', () => {
		document.on('clear', clearPage);

		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (sender.id === chrome.i18n.getMessage('@@extension_id')) {
				switch (request.action) {
				case 'updatePage':
					updatePage(request.params.index, null, request.params.thumb);
					break;
				case 'remove':
					removePage(d(`page${request.params.index}`));
					break;
				}
			}
		});
	});

}());
