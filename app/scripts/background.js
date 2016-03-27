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
		thumbs_ready = false;

	function saveLocal() {
		var buferT = {};
		slotsList.forEach(function (slot) {
			if (!slot || !slot.url){return;}
			buferT[slot.url] = slot.thumb;
		});
		thumbs = buferT;
		chrome.storage.local.set({'thumbs': thumbs});
	}

	function saveSync(){
		var slots = slotsList.map(function (slot) {
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

	function refreshPages(slot_index) {
		chrome.extension.sendRequest({action: 'updatePage', params: {index: slot_index, thumb: slotsList[slot_index].thumb }});
	}

	function createThumbOf() {
		var savedTab,
			processing,
			current,
			queue = [];

		function addToQueue (tab, func) {
			queue.push({
				tab: tab,
				callback: func,
				tries: 3
			});
			process();
		}

		function takeScreenshot () {
			if (current.url !== processing.tab.url){
				processing = null;
				process();
				return;
			}
			// take screenshot
			chrome.tabs.captureVisibleTab(processing.tab.windowId, {
				format: 'png'
			}, function(thumb){
				if (current.url !== processing.tab.url){
					processing = null;
					process();
					return;
				}
				if (!thumb && chrome.runtime.lastError && chrome.runtime.lastError.message === 'Failed to capture tab: unknown error' && processing.tries){
					// try once again
					processing.tries--;
					processing.tries && queue.unshift(processing);
					processing = null;
					process();
					return;
				}
				processing.callback(thumb);
				processing = null;
				process();
			});
		}

		function next () {
			//get current tab
			chrome.tabs.getSelected(null, function(currentTab) {
				if (currentTab.id === processing.tab.id){
					current = currentTab;
					takeScreenshot();
				} else {
					savedTab = savedTab || (currentTab.id > -1 ? currentTab : null);
					// switch to requested tab
					chrome.tabs.update(processing.tab.id, {
						active: true,
						selected: true,
						pinned: processing.tab.pinned
					}, function (){
						current = processing.tab;
						setTimeout(takeScreenshot, 100);
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
				chrome.tabs.update(savedTab.id, {
					active: true,
					selected: true,
					pinned: savedTab.pinned
				});
				savedTab = null;
			}
		}

		chrome.tabs.onUpdated.addListener(function (id, changeInfo, tab) {
			if (tab.active === true){
				current = tab;
			}
		});

		if (createThumbOf !== addToQueue){
			createThumbOf = addToQueue;
			addToQueue.apply(this, arguments);
		}
	}

	function byUrl (url) {
		return function (slot) {
			return (slot && slot.url === url);
		};
	}

	function onRemove (index) {
		if (index !== -1) {
			var oldUrl = slotsList[index].url;
			slotsList[index] = null;
			if (!slotsList.find(byUrl(oldUrl))) {
				delete redirectUrls[oldUrl];
			}
			saveLocal();
			saveSync();
			chrome.extension.sendRequest({
				action: 'remove',
				params: {
					index: index
				}
			});
		}
	}

	function updateFavicon (slot) {
		getFavicon(slot.url)
		.then(function(response){
			slot.favicon = response;
			refreshPages(slotsList.indexOf(slot));
		});
	}

	function init() {
		function loaded() {
			if (urls_ready && thumbs_ready) {
				slotsList.forEach(function(slot){
					slot && (slot.thumb = thumbs[slot.url]);
				});
				announce();
			}
		}

		chrome.storage.sync.get(['slots', 'settings'], function(res) {
			if (res.slots && res.slots.length){
				slotsList = res.slots;
				slotsList.forEach(function(slot){
					if(slot && slot.url && (!slot.favicon || slot.favicon.href === '/icons/document.svg') ){
						updateFavicon(slot);
					}
				});
			} else {
				saveSync();
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

		chrome.storage.local.get(['thumbs'], function(res){
			if (res.thumbs) {
				for (var i in res.thumbs) {
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

	window.subscribe = function  (callback) {
		callbacks.push(callback);
		if (urls_ready && thumbs_ready) {
			announce();
		}
	};

	function announce() {
		var back = {
			slotsList: slotsList,
			settings: settings,
			swap: swap,
			editPage: editPage
		};
		for (var i in callbacks) {
			callbacks[i](back);
		}
		callbacks = [];
	}

	function fixUrl (url) {
		var protocol = /^https?:\/\//,
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

		var oldUrl = slotsList[slot_index] && slotsList[slot_index].url;
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
			createThumbOf(requestedTab, function(thumb) {
				slotsList[slot_index].thumb = thumb;
				if (requestedTab.favIconUrl){
					updateFavicon(slotsList[slot_index]);
				}
				refreshPages(slot_index);
				saveLocal();
			});
		} else {
			updateFavicon(slotsList[slot_index]);
		}
		return true;
	}

	function getOriginBy (url) {
		if (slotsList.findIndex(byUrl(url)) !== -1){return url;}
		if (slotsList.findIndex(byUrl(url.replace(/\/$/, ''))) !== -1){return url.replace(/\/$/, '');}
		for(var u in redirectUrls){
			if (redirectUrls[u].indexOf(url) !== -1){return u;}
		}
	}

	function firstInit() {
		chrome.topSites.get(function (topSites) {
			var length = Math.min(topSites.length, slotsList.length),
				deniedCount = 0;
			for (var i = 0; i < length; i++){
				if (!editPage(topSites[i].url, i - deniedCount)){
					deniedCount++;
				}
			}
		});
	}

	chrome.runtime.onInstalled.addListener(function (event) {
		function notEmpty (slot) {
			return (slot && slot.url);
		}
		if (event.reason === 'install' && !slotsList.some(notEmpty)){
			firstInit();
		}
	});

	chrome.tabs.onUpdated.addListener(function (id, changeInfo, tab) {
		var url, i;
			// check if sender tab url really added to fav pages
			url = getOriginBy(tab.url);
			i = slotsList.findIndex(byUrl(url));
			if (url && i !== -1 && changeInfo.status === 'complete') {
				createThumbOf(tab, function (thumb) {
					// save it
					slotsList[i].thumb = thumb || slotsList[i].thumb;
					saveLocal();
					if (tab.favIconUrl){
						updateFavicon(slotsList[i]);
					}
					refreshPages(i);
				});
			}
	});

	chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
		if (sender.tab && sender.id === chrome.i18n.getMessage('@@extension_id')){
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

	chrome.webRequest.onBeforeRedirect.addListener(function(details){
		var origin = getOriginBy(details.url);
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