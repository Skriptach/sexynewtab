'use strict';

; (() => {

	const get = {

		get tabs() {
			return new Promise((resolve, reject) => {
				let tabs = [];
				chrome.windows.getAll({ populate: true }, (windows) => {
					for (let i = 0; i < windows.length; i++) {
						tabs = tabs.concat(windows[i].tabs);
					}
					resolve(tabs);
				});
			});
		},
	
		get history() {
			return new Promise((resolve, reject) => {
				chrome.history.search({
					text: '',
					startTime: (new Date()).getTime() - 1000 * 60 * 60 * 24 * 7
				}, resolve);
			});
		},
	
		get top() {
			return new Promise((resolve, reject) => {
				chrome.topSites.get(resolve);
			});
		},
	
		get bookmarks() {
			return new Promise((resolve, reject) => {
				chrome.bookmarks.getRecent(100, resolve);
			});
		},
	};

	function getItem (params) {
		const item = document.createElement('li');
		item.setAttribute('class', 'item');
		return item;
	}

	function update (item, params) {
		item.style['background-image'] = `url(${(params.favIconUrl || `chrome://favicon/${params.url}`)})`;
		item.url = params.url;
		item.innerText = params.title || params.url;
	}

	class LinkList extends HTMLUListElement {
		constructor () {
			super();

			const refresh = () => {
				this.refresh();
			};
			const checkChangings = (id, changeInfo) => {
				const property = ['url', 'favIconUrl', 'title'];
				function hasChancged(prop) {
					return prop in changeInfo;
				}

				if (property.some(hasChancged)) {
					refresh();
				}
			}

			this.type = this.getAttribute('type');
			this.list = new Map();

			document.on('shown', refresh);
			window.on('focus', refresh);

			if (this.type === 'tabs' || this.type === 'bookmarks'){
				chrome[this.type].onCreated.addListener(refresh);
				chrome[this.type].onRemoved.addListener(refresh);
			}

			if (this.type === 'tabs'){
				chrome.tabs.onReplaced.addListener(refresh);
				chrome.tabs.onUpdated.addListener(checkChangings);
			}
			if (this.type === 'bookmarks'){
				chrome.bookmarks.onChanged.addListener(checkChangings);
			}
		}
		
		refresh () {
			const _self = this;

			if (EDIT && get[this.type]){
				get[this.type].then(_self.build.bind(_self));
			}
		}

		build(links) {

			const _self = this,
				newList = new Map(),
				fragment = document.createDocumentFragment(),
				protocol = /^https?:/;

			links.forEach((link) => {
				if (protocol.test(link.url)) {
					let item = _self.list.get(link.id || link.url);
					item = item || getItem(link);
					update(item, link);
					if (_self.type === 'tab') {
						item.tab = link;
					}
					newList.set(link.id || link.url, item);
					fragment.appendChild(item);
				}
			});

			while (_self.firstChild) {
				_self.removeChild(_self.firstChild);
			}
			_self.list = newList;
			_self.appendChild(fragment);
		}
	}

	customElements.define('link-list', LinkList, { extends: 'ul' } );

})();
