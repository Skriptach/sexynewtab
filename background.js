var slotsList = [],
	settings = {
		COLUMNS_COUNT : 5,
		ROWS_COUNT : 4,
		CHECK_PERIOD : 4, //hours
		FLOW : false,
		NEW : false // flag for just installed
	},
	swap, editPage, subscribe;

;(function (){
'use strict';

	var thumbs = {},
		hashes = {},
		timers = {},
		callbacks = [],
		redirectUrls = {},
		TRIES = 3;

	// subscribe and announce added for that case when browser just runned with saved session tabs
	// and 'slots' is empty (have not loaded in time). So at the moment 'slots' has been demand (newtab or content-script),
	// execution can be restored.

	function announce() {
		for (var i in callbacks) {
			callbacks[i]();
		}
		callbacks = null;
	}

	function saveLocal() {
		var buferT = {},
			buferH = {};
		slotsList.forEach(function (slot) {
			if (!slot || !slot.url){return;}
			buferT[slot.url] = slot.thumb;
			hashes[slot.url] && (buferH[slot.url] = hashes[slot.url]);
		});
		thumbs = buferT;
		hashes = buferH;
		chrome.storage.local.set({'thumbs': thumbs, 'hashes': hashes});
	}

	function saveSync(){
		chrome.storage.sync.set({
			'urls': slotsList.map(function (slot) {
					return slot ? slot.url : null;
				}),
			'settings': settings
		});
	}

	function refreshPages(slot_index) {
		chrome.extension.sendRequest({action: 'updatePage', params: {index: slot_index, thumb: slotsList[slot_index].thumb }});
	}

	function createThumbOf(requestedTab, callback, savedTab) {
		function takeScreenshot () {
			// take screenshot
			chrome.tabs.captureVisibleTab(requestedTab.windowId, {
				format: 'png'
			}, function(thumb){
				if (!thumb && chrome.runtime.lastError && chrome.runtime.lastError.message === 'Failed to capture tab: unknown error' && TRIES){
					// try once again
					TRIES-- && createThumbOf(requestedTab, callback, savedTab);
					return;
				}
				TRIES = 3;
				callback(thumb);
				if (savedTab){
					// switch back
					chrome.tabs.update(savedTab.id, {
						active: true,
						selected: true,
						pinned: savedTab.pinned
					});
				}
			});
		}

		//get current tab
		chrome.tabs.getSelected(null, function(currentTab) {
			if (currentTab.id === requestedTab.id){
				takeScreenshot();
			} else {
				savedTab = savedTab || (currentTab.id > -1 ? currentTab : null);
				// switch to requested tab
				chrome.tabs.update(requestedTab.id, {
					active: true,
					selected: true,
					pinned: requestedTab.pinned
				}, function (){
					setTimeout(takeScreenshot, 100);
				});
			}
		});
	}

	function byUrl (url) {
		return function (slot) {
			return (slot && slot.url === url);
		};
	}

	function stopLoopCheck (url){
		clearTimeout(timers[url]);
		delete hashes[url];
		delete timers[url];
	}

	function getHash(url, messageFlag) {
		if (!slotsList.find(byUrl(url))){
			stopLoopCheck(url);
			return;
		}
		var req = new XMLHttpRequest();
		req.open('GET', url, true);
		req.onloadend = function(){
			if (req.readyState === 4) {
				if(req.status === 200) {
					clearTimeout(timers[url]);
					var i = slotsList.findIndex(byUrl(url));
					if (i === -1){return;}
					var h = MD5(req.responseText);
					if (!messageFlag && hashes[url] && hashes[url].hash !== h) {
						chrome.extension.sendRequest({
							action: 'pageIsFresh',
							params: {indexes: [i]}
						});
					}
					hashes[url] = {
						hash : h,
						last : new Date().getTime(),
						thumb: !!messageFlag
					};
				}
			}
			timers[url] = setTimeout(function() {
				getHash(url);
			}, settings.CHECK_PERIOD*3600*1000);
		};
		req.send();
	}

	function onRemove (index) {
		if (index !== -1) {
			var oldUrl = slotsList[index].url;
			slotsList[index] = null;
			if (!slotsList.find(byUrl(oldUrl))) {
				stopLoopCheck(oldUrl);
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
		var urls_ready = false, thumbs_ready = false;

		function startLoopCheck() {
			var t = (new Date()).getTime(), diff, C = 3600*1000;
			function setTimer(url, delay) {
				timers[url] = setTimeout(function() {
					getHash(url);
				}, delay);
			}

			slotsList.forEach(function (slot, i) {
				if (slot && slot.url) {
					diff = hashes[slot.url] ? t - hashes[slot.url].last : Infinity;
					if (diff/C >= settings.CHECK_PERIOD) {
						setTimer(slot.url, 10);
					} else {
						setTimer(slot.url, settings.CHECK_PERIOD*C - diff);
						if (!hashes[slot.url].thumb){
							chrome.extension.sendRequest({
								action: 'pageIsFresh',
								params: {indexes: [i]}
							});
						}
					}
				}
			});
		}

		function loaded() {
			if (urls_ready && thumbs_ready) {
				slotsList.forEach(function(slot){
					slot.thumb = thumbs[slot.url];
				});
				announce();
				startLoopCheck();
			}
		}

		chrome.storage.sync.get(['urls', 'settings'], function(res) {
			if (res.urls && res.urls.length){
				res.urls.forEach(function(url, index){
					slotsList[index] = {url: url};
					if(slotsList[index] && slotsList[index].url && (!slotsList[index].favicon || (/^chrome:/).test(slotsList[index].favicon)) ){
						updateFavicon(slotsList[index]);
					}
				});
			} else {
				slotsList = new Array(20);
				saveSync();
			}
			if (res.settings) {
				settings.COLUMNS_COUNT = res.settings.COLUMNS_COUNT;
				settings.ROWS_COUNT = res.settings.ROWS_COUNT;
				settings.CHECK_PERIOD = res.settings.CHECK_PERIOD;
				settings.FLOW = res.settings.FLOW;
				settings.NEW = res.settings.NEW;
			}
			urls_ready = true;
			loaded();
		});

		chrome.storage.local.get(['thumbs', 'hashes'], function(res){
			if (res.thumbs) {
				for (var i in res.thumbs) {
					thumbs[i] = res.thumbs[i];
				}
			}
			if (res.hashes){
				hashes = res.hashes;
			}
			thumbs_ready = true;
			loaded();
		});
	}

	swap = function (old_index, new_index) {
		slotsList.splice(new_index, 0, slotsList.splice(old_index, 1)[0]);
		saveSync();
	};

	subscribe = function (callback) {
		callbacks.push(callback);
	};

	editPage = function (url, slot_index, requestedTab) {
		var protocol = /^https?:\/\//,
			domain = /^[\w]+[\w-\.]+/;
		if (!protocol.test(url)){
			if(!domain.test(url)){return false;}
			url = 'http://'+url;
		}
		if (slotsList[slot_index].url === url){return;}

		var oldUrl = slotsList[slot_index].url;
		slotsList[slot_index] = {url: url};
		if (!slotsList.find(byUrl(oldUrl))) {
			stopLoopCheck(oldUrl);
			delete redirectUrls[oldUrl];
		}
		getHash(url, true);
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
	};

	function getOriginBy (url) {
		if (slotsList.findIndex(byUrl(url)) !== -1){return url;}
		if (slotsList.findIndex(byUrl(url.replace(/\/$/, ''))) !== -1){return url.replace(/\/$/, '');}
		for(var u in redirectUrls){
			if (redirectUrls[u].indexOf(url) !== -1){return u;}
		}
	}

	chrome.runtime.onInstalled.addListener(function (event) {
		function notEmpty (slot) {
			return (slot && slot.url);
		}
		if (event.reason === 'install' && !slotsList.some(notEmpty)){
			settings.NEW = true;
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
					getHash(url, true);
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
			case 'subscribe':
				subscribe(request.callback);
				sendResponse({});
				break;
			case 'clear':
				onRemove(request.index);
				sendResponse({});
				break;
			case 'toggleView':
				settings.FLOW = request.FLOW;
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

	function sendFresh(tabId) {
		var indexes = [];
		slotsList.forEach(function(slot, i) {
			if (slot && slot.url) {
				indexes.push(i);
			}
		});
		chrome.tabs.sendRequest(tabId,
			{action: 'pageIsFresh',
			params: {indexes: indexes}
		});
	}

	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if (tab.url === 'chrome://newtab/' && tab.status === 'complete') {
			sendFresh(tab.id);
		}
	});

	init();

}());