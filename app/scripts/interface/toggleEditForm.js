'use strict';

;(() => {

	function showEditForm () {
		EDIT = true;
		currentEditPage.appendChild(d('edit'));
		d('edit').dispatchEvent(new Event('shown', {bubbles: true}));
		$('#edit url-input')[0].value = currentEditPage.url;
		setTimeout(() => currentEditPage.classList.add('turned', 'ontop'), 10);
	}

	window.hideEditForm = () => {
		EDIT = false;
		currentEditPage.classList.remove('turned');
		setTimeout(() => {
			currentEditPage.classList.remove('ontop');
			currentEditPage = null;
		}, 300);
	};

	function toggleEditForm (page) {
		if (!currentEditPage) {
			currentEditPage = page;
			showEditForm();
			return;
		}
		if (currentEditPage && page !== currentEditPage) {
			hideEditForm();
			setTimeout(() => {
				currentEditPage = page;
				showEditForm();
			}, 310);
		}
	}

	document.on('edit', () => {
		toggleEditForm(event.target.closest('thumb-page'));
	});

})();
