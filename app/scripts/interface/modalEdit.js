'use strict';

;(() => {

	const inputUrl = $('#edit url-input')[0];
	const searchInput = $('#edit search-input')[0];
	const list = $('#edit source-list')[0];
	let currentItem = null;

	function selectLink (target) {
		inputUrl.value = target.url;
		currentItem && currentItem.classList.remove('selected');
		currentItem = target;
		currentItem.classList.add('selected');
	}

	function editPage () {
		if (!inputUrl.validity.valid){return;}
		if (back.editPage(inputUrl.value, currentEditPage.index)) {
			currentEditPage.loading();
		}
		hideEditForm();
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
	}

	function unselect () {
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
	}

	window.on('ready', () => {

		inputUrl.on('done', editPage);
		inputUrl.on('change', unselect);

		searchInput.on('change', debounce(() => {
			list.search(searchInput.value);
		}));

		$('#edit .accordion')[0].on('mousewheel', () => {
			if (event.wheelDeltaX === 0) { event.stopPropagation(); }
		});

		document.on('back', hideEditForm);
		$click.on('#edit .item', selectLink);

	});

})();
