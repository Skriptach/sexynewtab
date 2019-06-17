'use strict';

;(() => {

	const inputUrl = $('#edit url-input')[0];
	let currentItem = null;

	function selectLink (target) {
		inputUrl.value = target.url;
		currentItem && currentItem.classList.remove('selected');
		currentItem = target;
		currentItem.classList.add('selected');
	}

	function editPage () {
		if (!inputUrl.validity.valid){return;}
		if (back.editPage(inputUrl.value, currentEditPage.index, currentItem && currentItem.tab)) {
			currentEditPage.loading();
		}
		hideEditForm();
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
	}

	function urlChange () {
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
	}


	window.on('ready', () => {

		inputUrl.on('done', editPage);
		inputUrl.on('change', urlChange);

		$('#edit .accordion')[0].on('mousewheel', () => {
			if (event.wheelDeltaX === 0) { event.stopPropagation(); }
		});

		document.on('back', hideEditForm);
		$click.on('#edit .item', selectLink);

	});

})();
