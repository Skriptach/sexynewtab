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

	function selectLink (target) {
		const inputUrl = $('#link_url input')[0];
		inputUrl.value = target.url;
		inputUrl.onchange();
		currentItem && currentItem.classList.remove('selected');
		currentItem = target;
		currentItem.classList.add('selected');
		inputUrl.select();
	}
	function editPage () {
		if (d('edit_ok').disabled){return;}
		back.editPage($('#link_url input')[0].value, currentEditPage.index, currentItem && currentItem.tab);
		updatePage(currentEditPage.index);
		hideEditForm();
	}

	function urlChange () {
		if (event && event.type === 'paste'){
			setTimeout(urlChange, 1);
			return;
		}
		const protocol = /^https?:\/\//,
			domain = /^[\w]+[\w-.]+/,
			url = $('#link_url input')[0].value;
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
		if (!protocol.test(url) && !domain.test(url)){
			d('edit_ok').setAttribute('disabled', '');
		} else {
			d('edit_ok').removeAttribute('disabled');
		}
	}


	window.addEventListener('ready', () => {
		window.addEventListener('focus', onListChanged);
		chrome.tabs.onCreated.addListener(onListChanged);
		chrome.tabs.onRemoved.addListener(onListChanged);
		chrome.tabs.onReplaced.addListener(onListChanged);

		const inputUrl = $('#link_url input')[0];
		inputUrl.onpaste = inputUrl.onkeyup = inputUrl.onchange = inputUrl.onblur = urlChange;

		inputUrl.onkeydown = () => {
			if (event.keyCode === 13){
				editPage();
			}
		};

		$('#edit .tree')[0].onmousewheel = () => {
			if (event.wheelDeltaX === 0) { event.stopPropagation(); }
		};

		$click.on('#edit .header .tab *', switchList);
		$click.on('#edit_cancel *', hideEditForm);
		$click.on('#edit_ok *', editPage);
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
