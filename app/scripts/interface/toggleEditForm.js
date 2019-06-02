'use strict';

;(() => {

	function showEditForm () {
		EDIT = true;
		currentEditPage.appendChild(d('edit'));
		$('#edit .header .tab.active')[0].click();
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

	window.addEventListener('ready', () => {
		function toggle (target) { toggleEditForm(closest(target, '.page'));}
		$click.on('.page .flipper .edit *', toggle );
		$click.on('.page.inactive .flipper a *', toggle );
	});

})();
