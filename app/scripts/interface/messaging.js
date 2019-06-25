'use strict';

;(function () {

	function removePage () {
		chrome.runtime.sendMessage({
			action: 'remove',
			index: event.target.closest('thumb-page').index
		});
	}

	window.on('ready', () => {
		document.on('remove', removePage);

		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (sender.id === chrome.runtime.id) {
				switch (request.action) {
				case 'updatePage':
					d(`page${request.params.index}`).update(request.params.thumb);
					break;
				case 'remove':
					d(`page${request.params.index}`).remove();
					break;
				case 'updateBg':
					updateBackground();
					break;
				}
			}
		});
	});

}());
