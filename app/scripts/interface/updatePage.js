'use strict';

;(function () {

	function clearPage (target) {
		chrome.runtime.sendMessage({
			action: 'clear',
			index: closest(target, '.page').index
		});
	}

	function removePage (page) {
		page.querySelector('a').removeAttribute('href');
		page.style.webkitTransform = 'scale(0.3)';
		setTimeout(() => {
			page.classList.add('inactive');
			if (FLOW){
				if (page === first_flow_page){
					first_flow_page = getNextActivePage();
				}
				page.classList.add('deleting');
				flowTo(getNextActivePage() || getPrevActivePage());
				setTimeout(() => page.classList.remove('deleting'), 500);
			}
			page.querySelector('.thumbnail').removeAttribute('style');
			page.querySelector('.plus').removeAttribute('style');
			page.style.webkitTransform = 'scale(1)';
			setTimeout(() => {page.style.webkitTransform = '';}, 10);
		}, 200);
	}

	window.updatePage = (slotIndex, page, thumb) => {
		page = page || d(`page${slotIndex}`);
		const oldUrl = page.url;
		page.url = slotsList[slotIndex] ? slotsList[slotIndex].url : null;
		page.thumb = thumb ? thumb :
			slotsList[slotIndex] && slotsList[slotIndex].thumb ? slotsList[slotIndex].thumb :
			(oldUrl === page.url) ? page.thumb : '';
		if (page.url) {
			page.querySelector('a').setAttribute('href', page.url);
			if(!page.thumb){
				const icon = page.querySelector('.plus');
				if (slotsList[slotIndex].favicon && slotsList[slotIndex].favicon.color){
					icon.style['background-image'] = '';
					icon.style['-webkit-mask-image'] = `url(${slotsList[slotIndex].favicon.href})`;
					icon.style['background-color'] = slotsList[slotIndex].favicon.color || '#FFF';
				} else {
					icon.style['background-color'] = '';
					icon.style['-webkit-mask-image'] = '';
					icon.style['background-image'] = `url(${slotsList[slotIndex].favicon.href})`;
				}
			}
			page.classList.remove('inactive');
			page.querySelector('.thumbnail').style['background-image'] = `url(${page.thumb})`;
		}
	};

	window.addEventListener('ready', () => {
		$click.on('.page .flipper .remove *', clearPage);

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
