'use strict';

; (() => {

	const get = {

		searchText: '',

		byText (link) {
			return (link &&
				(link.title && link.title.toLowerCase().includes(this.searchText.toLowerCase())) ||
				(link.url && link.url.toLowerCase().includes(this.searchText.toLowerCase()))
			);
		},

		get top() {
			const _self = this;
			return new Promise((resolve, reject) => {
				chrome.topSites.get((topSites) => {
					resolve(topSites.filter(_self.byText.bind(_self)));
				});
			});
		},

		get tabs() {
			const _self = this;
			return new Promise((resolve, reject) => {
				let tabs = [];
				chrome.windows.getAll({ populate: true }, (windows) => {
					for (let i = 0; i < windows.length; i++) {
						tabs = tabs.concat(windows[i].tabs.filter(_self.byText.bind(_self)));
					}
					resolve(tabs);
				});
			});
		},

		get bookmarks() {
			const _self = this;
			return new Promise((resolve, reject) => {
				if (_self.searchText) {
					chrome.bookmarks.search(_self.searchText, resolve);
				} else {
					chrome.bookmarks.getRecent(100, resolve);
				}
			});
		},

		get history() {
			const _self = this;
			return new Promise((resolve, reject) => {
				chrome.history.search({
					text: _self.searchText,
					startTime: (new Date()).getTime() - 1000 * 60 * 60 * 24 * 365
				}, resolve);
			});
		},

	};

	function getItem () {
		const item = document.createElement('li');
		item.setAttribute('class', 'item');
		return item;
	}

	function update (item, params) {
		item.style['background-image'] = `url(${(params.favIconUrl || `chrome://favicon/${params.url}`)})`;
		item.url = params.url;
		item.innerText = params.title || params.url;
		item.title = params.title;
	}

	class LinkList extends HTMLUListElement {
		constructor (type) {
			super();

			const refresh = () => {
				this.refresh();
			};

			this.type = type || this.getAttribute('type');
			this.list = new Map();

			document.on('shown', refresh);
			window.on('focus', refresh);
		}

		refresh () {
			const _self = this;

			if (EDIT && Object.prototype.hasOwnProperty.call(get, this.type)){
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

	class SourceList extends HTMLElement {
		constructor () {
			super();

			const children = [];
			this.lists = [];
			for (const source in get) {
				if (get[source].then) {
					const btn = new AccordBtn(source);
					const list = new LinkList(source);
					children.push(btn);
					children.push(list);
					this.lists.push(list);
				}
			}

			this.append(...children);
		}

		search (text) {
			get.searchText = text;
			this.lists.forEach((list) => list.refresh());
		}
	}

	customElements.define('source-list', SourceList);
})();
