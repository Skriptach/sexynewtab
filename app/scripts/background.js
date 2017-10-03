'use strict';

;(function (){

	var slotsList = new Array(20),
		settings = {
			COLUMNS_COUNT : 5,
			ROWS_COUNT : 4,
			FLOW : false,
			THEME: 'deep-purple'
		},
		thumbs = {},
		callbacks = [],
		redirectUrls = {},
		urls_ready = false,
		thumbs_ready = false,
		currentTab;

	function saveLocal () {
		let buferT = {};
		slotsList.forEach((slot) => {
			if (!slot || !slot.url){return;}
			buferT[slot.url] = slot.thumb;
		});
		thumbs = buferT;
		chrome.storage.local.set({'thumbs': thumbs});
	}

	function saveSync () {
		let slots = slotsList.map((slot) => {
				return slot && slot.url ? {
					url: slot.url,
					favicon: slot.favicon
				} : null;
			});
		chrome.storage.sync.set({
			'slots': slots,
			'settings': settings
		});
	}

	function refreshPages (slot_index) {
		if (slot_index < 0){return;}
		chrome.runtime.sendMessage({
			action: 'updatePage',
			params: {
				index: slot_index,
				thumb: slotsList[slot_index].thumb 
			}
		});
	}

	function createThumbOf () {
		var savedTab,
			processing,
			queue = [];

		function addToQueue (tab, slot_index) {
			queue.push({
				tab,
				slot_index,
				tries: 5
			});
			process();
		}

		function takeScreenshot () {
			if (currentTab.url !== processing.tab.url){
				processing = null;
				process();
				return;
			}
			// take screenshot
			chrome.tabs.captureVisibleTab(processing.tab.windowId, { format: 'png' }, (thumb) => {
				if (currentTab.url !== processing.tab.url){
					processing = null;
					process();
					return;
				}
				if (!thumb && chrome.runtime.lastError && chrome.runtime.lastError.message === 'Failed to capture tab: unknown error' && processing.tries){
					// try once again
					processing.tries--;
					processing.tries && queue.unshift(processing);
					processing = null;
					setTimeout(process, 10);
					return;
				}
				slotsList[processing.slot_index].thumb = thumb;
				if (processing.tab.favIconUrl){
					updateFavicon(slotsList[processing.slot_index]);
				}
				refreshPages(processing.slot_index);
				saveLocal();
				processing = null;
				process();
			});
		}

		function next () {
			//get current tab
			chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
				let current = tabs[0];
				if (current.id === processing.tab.id){
					takeScreenshot();
				} else {
					savedTab = savedTab || (current.id > -1 ? current : null);
					// switch to requested tab
					chrome.tabs.update(processing.tab.id, { active: true }, () => {
						chrome.windows.update(processing.tab.windowId, {focused: true}, () => {
							setTimeout(takeScreenshot, 150);
						});
					});
				}
			});
		}

		function process () {
			if (processing){return;}
			if (queue.length){
				processing = queue.shift();
				next();
			} else if (savedTab){
				// switch back
				chrome.tabs.update(savedTab.id, { active: true }, () => {
					chrome.windows.update(savedTab.windowId, {focused: true}, () => savedTab = null);
				});
			}
		}

		if (createThumbOf !== addToQueue){
			createThumbOf = addToQueue;
			addToQueue.apply(this, arguments);
		}
	}

	function byUrl (url) {
		return slot => (slot && slot.url === url);
	}

	function onRemove (index) {
		if (index !== -1) {
			let oldUrl = slotsList[index].url;
			slotsList[index] = null;
			if (!slotsList.find(byUrl(oldUrl))) {
				delete redirectUrls[oldUrl];
			}
			saveLocal();
			saveSync();
			chrome.runtime.sendMessage({
				action: 'remove',
				params: {
					index: index
				}
			});
		}
	}

	function updateFavicon (slot) {
		getFavicon(slot.url)
		.then((response) => {
			if (slotsList.indexOf(slot) < 0){return;}
			slot.favicon = response;
			saveSync();
			refreshPages(slotsList.indexOf(slot));
		});
	}

	function init () {
		function loaded () {
			if (urls_ready && thumbs_ready) {
				slotsList.forEach((slot) => {
					slot && (slot.thumb = thumbs[slot.url]);
				});
				announce();
			}
		}

		chrome.storage.sync.get(['slots', 'settings'], (res) => {
			if (res.slots && res.slots.length){
				slotsList = res.slots;
				slotsList.forEach((slot) => {
					if(slot && slot.url){
						updateFavicon(slot);
					}
				});
			}
			if (res.settings) {
				settings.COLUMNS_COUNT = res.settings.COLUMNS_COUNT;
				settings.ROWS_COUNT = res.settings.ROWS_COUNT;
				settings.FLOW = res.settings.FLOW;
				settings.THEME = res.settings.THEME;
				settings.BACK = res.settings.BACK;
			}
			urls_ready = true;
			loaded();
		});

		chrome.storage.local.get(['thumbs'], (res) => {
			if (res.thumbs) {
				for (let i in res.thumbs) {
					thumbs[i] = res.thumbs[i];
				}
			}
			thumbs_ready = true;
			loaded();
		});
	}

	function swap (old_index, new_index) {
		slotsList.splice(new_index, 0, slotsList.splice(old_index, 1)[0]);
		saveSync();
	}

	window.subscribe = (callback) => {
		callbacks.push(callback);
		if (urls_ready && thumbs_ready) {
			announce();
		}
	};

	function announce () {
		let back = {
			slotsList: slotsList,
			settings: settings,
			swap: swap,
			editPage: editPage
		};
		for (let i in callbacks) {
			callbacks[i](back);
		}
		callbacks = [];
	}

	function fixUrl (url) {
		let protocol = /^https?:\/\//,
			domain = /^[\w]+[\w-\.]+/;
		if (!protocol.test(url)){
			if(!domain.test(url)){return false;}
			url = 'http://'+url;
		}
		return resolveUrl(url, url);
	}

	function editPage (url, slot_index, requestedTab) {
		url = fixUrl(url);
		if (!url || (slotsList[slot_index] && slotsList[slot_index].url === url)){return;}

		let oldUrl = slotsList[slot_index] && slotsList[slot_index].url;
		slotsList[slot_index] = {
			url: url,
			favicon: {href: '/icons/document.svg', color: 'rgba(220, 220, 220, 0.9)'}
		};
		if (!slotsList.find(byUrl(oldUrl))) {
			delete redirectUrls[oldUrl];
		}
		saveLocal();
		saveSync();
		if (requestedTab) {
			createThumbOf(requestedTab, slot_index);
		} else {
			updateFavicon(slotsList[slot_index]);
		}
		return true;
	}

	function getOriginBy (url) {
		if (slotsList.findIndex(byUrl(url)) !== -1){return url;}
		if (slotsList.findIndex(byUrl(url.replace(/\/$/, ''))) !== -1){return url.replace(/\/$/, '');}
		for(let u in redirectUrls){
			if (redirectUrls[u].indexOf(url) !== -1){return u;}
		}
	}

	function firstInit () {
		chrome.topSites.get((topSites) => {
			let length = Math.min(topSites.length, slotsList.length),
				deniedCount = 0;
			for (let i = 0; i < length; i++){
				if (!editPage(topSites[i].url, i - deniedCount)){
					deniedCount++;
				}
			}
		});
	}

	chrome.runtime.onInstalled.addListener((event) => {
		if (event.reason === 'install' && !slotsList.some( slot => (slot && slot.url) ) ) {
			firstInit();
		}
	});

	let theTabRequests = {};

	function screenActive (tab) {
		let url = getOriginBy(tab.url);
		if (theTabRequests[tab.id].url === url) {
			let i = slotsList.findIndex(byUrl(url));
			createThumbOf(tab, i);
		}
		delete theTabRequests[tab.id];
	}

	chrome.tabs.onActivated.addListener((activeInfo) => {
		chrome.tabs.get(activeInfo.tabId, (tab) => {
			currentTab = tab;
			if (theTabRequests[tab.id] && tab.status === 'complete' && tab.active) {
				setTimeout(screenActive.bind(window, tab), 100);
			}
		});
	});

	chrome.tabs.onUpdated.addListener((id, changeInfo, tab) => {
		// check if sender tab url really added to fav pages
		if (theTabRequests[id] && changeInfo.status === 'complete' && tab.active) {
			screenActive(tab);
		}
	});

	chrome.webRequest.onCompleted.addListener((details) => {
		let url = getOriginBy(details.url);
		let i = slotsList.findIndex(byUrl(url));
		if (url && i !== -1 && details.type === 'main_frame') {
			theTabRequests[details.tabId] = {url};
		}
	}, {
		urls: ["<all_urls>"]
	});

	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (sender.tab && sender.id === chrome.i18n.getMessage('@@extension_id')) {
			switch (request.action) {
			case 'clear':
				onRemove(request.index);
				sendResponse({});
				break;
			case 'toggleView':
				settings.FLOW = request.FLOW;
				saveSync();
				sendResponse({});
				break;
			case 'switchTheme':
				settings.THEME = request.theme;
				saveSync();
				sendResponse({});
				break;
			case 'setBackground':
				settings.BACK = request.back;
				saveSync();
				sendResponse({});
				break;
			default:
				sendResponse({}); // snub them.
			}
		} else {
			sendResponse({});
		}
	});

	chrome.webRequest.onBeforeRedirect.addListener((details) => {
		let origin = getOriginBy(details.url);
		origin && (redirectUrls[origin] = redirectUrls[origin] || []);
		if (origin && redirectUrls[origin] && redirectUrls[origin].indexOf(details.redirectUrl) === -1) {
			redirectUrls[origin].push(details.redirectUrl);
		}
	}, {
		urls: ['<all_urls>'],
		types: ['main_frame']
	}, ['responseHeaders']);

	init();

}());