'use strict';

;(() => {

	function buildList (linksList, isTab) {
		const node = $('#edit .list .tree')[0],
			list = document.createDocumentFragment(),
			protocol = /^https?:/;
		let item;
		[].slice.call(node.children).forEach((link) => node.removeChild(link));
		for (let i = 0; i < linksList.length; i++) {
			if (protocol.test(linksList[i].url)) {
				item = document.createElement('li');
				item.style['background-image'] = `url(${(linksList[i].favIconUrl || `chrome://favicon/${linksList[i].url}` )})`;
				item.setAttribute('class', 'item');
				item.url = linksList[i].url;
				item.innerText = linksList[i].title || linksList[i].url;
				if (isTab){
					item.tab = linksList[i];
				}
				list.appendChild(item);
			}
		}
		node.appendChild(list);
	}

	function switchToTabs () {
		let tabs = [];
		chrome.windows.getAll({populate: true}, (windows) => {
			for (let i = 0; i < windows.length; i++) {
				tabs = tabs.concat(windows[i].tabs);
			}
			buildList(tabs, true);
		});
	}

	function switchToHistory () {
		chrome.history.search({
			text: '',
			startTime: (new Date()).getTime() - 1000 * 60 * 60 * 24 * 7
		}, (visitItems) => buildList(visitItems));
	}

	function switchToTop () {
		chrome.topSites.get((topSites) => buildList(topSites));
	}

	function switchToBookmarks () {
	}

	function updateEditFormList () {
		const currentType = $('#edit .header .tab.active')[0];
		currentType.id === 'tabs' ? switchToTabs() :
			currentType.id === 'history' ? switchToHistory() :
			currentType.id === 'topsites' ? switchToTop()
			: switchToBookmarks();
	}

	function onListChanged () {
		if(currentEditPage) {
			updateEditFormList();
		}
	}

	function switchList (target) {
		if (target.disabled){return;}
		$('#edit .header .tab.active')[0].classList.remove('active');
		target.classList.add('active');
		updateEditFormList();
	}

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
		back.editPage(inputUrl.value, currentEditPage.index, currentItem && currentItem.tab);
		currentEditPage.update();
		hideEditForm();
		currentItem = null;
	}

	function urlChange () {
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
	}


	window.on('ready', () => {
		window.on('focus', onListChanged);
		chrome.tabs.onCreated.addListener(onListChanged);
		chrome.tabs.onRemoved.addListener(onListChanged);
		chrome.tabs.onReplaced.addListener(onListChanged);

		inputUrl.on('ok', editPage);
		inputUrl.on('change', urlChange);

		$('#edit .tree')[0].on('mousewheel', () => {
			if (event.wheelDeltaX === 0) { event.stopPropagation(); }
		});

		$click.on('#edit .header .tab *', switchList);
		$click.on('#edit_cancel *', hideEditForm);
		$click.on('#edit .list .item', selectLink);

		chrome.tabs.onUpdated.addListener((id, changeInfo) => {
			const property = ['url','favIconUrl','title'];
			function hasChancged (prop) {
				return prop in changeInfo;
			}

			if ( property.some(hasChancged)) {
				onListChanged();
			}
		});
	});

})();
