var urls = [],
	thumbs = {},
	settings = {
		COLUMNS_COUNT : 4,
		ROWS_COUNT : 3,
		CHECK_PERIOD : 4 //hours
	},
	swap, editPage, subscribe;

;(function (){

	var hashes = {},
		timers = {},
		callbacks = [],
		redirectUrls = {},
		req = new XMLHttpRequest();

	// subscribe and announce added for that case when browser just runed with saved tabs
	// and 'slots' is empty (have not loaded in time). So at the place 'slots' was demand (newtab or content-script),
	// execution can be restored.

	function announce() {
		for (var i in callbacks) {
			callbacks[i]();
		}
		callbacks = null;
	}

	function saveLocal() {
		try {
			chrome.storage.local.set({'thumbs': thumbs, 'hashes': hashes});
		} catch (e) {
			console.log(e);
		}
	}

	function saveSync(){
		try {
			chrome.storage.sync.set({'urls': urls, 'settings': settings});
		} catch (e) {
			console.log(e);
		}
	}

	function refreshNewTabPages(slot_index) {
		chrome.extension.sendRequest({action: 'updatePageThumb', params: {index: slot_index}});
	}

	function createThumbOf(requestedTab, callback) {
		function takeScreenshot () {
			try {// take screenshot
			chrome.tabs.captureVisibleTab(requestedTab.windowId, {
				format: 'png'
			}, function(thumb){
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
			} catch (e){
				console.log(e);
			}
		}
		var savedTab;
		try {
			//get current tab
			chrome.tabs.getSelected(null, function(currentTab) {
				if (currentTab.id === requestedTab.id){
					takeScreenshot();
				} else {
					savedTab = currentTab;
					// switch to requested tab
					chrome.tabs.update(requestedTab.id, {
						active: true,
						selected: true,
						pinned: requestedTab.pinned
					}, function (){
						setTimeout(takeScreenshot, 50);
					});
				}
			});
		} catch (e) {
			console.log(e);
		}
	}

	function getHash(url, messageFlag) {
		var h;
		req.open('GET', url, true);
		req.onloadend = function(aEvt){
			if (req.readyState == 4) {
				if(req.status == 200) {
					clearTimeout(timers[url]);
					h = MD5(req.responseText);
					if (!messageFlag && hashes[url] && hashes[url].hash !== h) {
						chrome.extension.sendRequest({action: 'pageIsFresh', params: {index: urls.indexOf(url)}});
					}
					hashes[url] ={
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

	function init() {
		var urls_ready = false, thumbs_ready = false;

		function startLoopCheck() {
			var i, t = (new Date()).getTime(), diff, C = 3600*1000;
			function setTimer(url, delay) {
				timers[url] = setTimeout(function() {
					getHash(url);
				}, delay);
			}

			for (i in urls) {
				if (urls.hasOwnProperty(i)  && urls[i]) {
					diff = hashes[urls[i]] ? t-hashes[urls[i]].last : Infinity;
					if (diff/C >= settings.CHECK_PERIOD) {
						setTimer(urls[i], 10);
					} else {
						setTimer(urls[i], settings.CHECK_PERIOD*C - diff);
						if (!hashes[urls[i]].thumb){
							chrome.extension.sendRequest({action: 'pageIsFresh', params: {indexes: [i]}});
						}
					}
				}
			}
		}

		function loaded() {
			if (urls_ready && thumbs_ready) {
				announce();
				startLoopCheck();
			}
		}

		function oncontextEdit(info, tab) {
			var i = urls.indexOf(info.linkUrl);
			if (i !== -1) {
				chrome.tabs.sendRequest(tab.id, {
					action: 'showEditForm',
					params: {
						index: i
					}
				});
			}
		}

		function oncontextRemove(info, tab) {
			var i = urls.indexOf(info.linkUrl);
			if (i !== -1) {
				urls[i] = null;
				delete thumbs[urls[i]];
				saveSync();
				saveLocal();
				chrome.extension.sendRequest({
					action: 'remove',
					params: {
						index: i
					}
				});
			}
		}

		chrome.contextMenus.create({title: chrome.i18n.getMessage('m_edit'),
								contexts: ['link'],
								documentUrlPatterns: ['chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/layout.html'],
								onclick: oncontextEdit });
		chrome.contextMenus.create({title: chrome.i18n.getMessage('m_clear'),
								contexts: ['link'],
								documentUrlPatterns: ['chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/layout.html'],
								onclick: oncontextRemove
								});
		chrome.storage.sync.get(['urls', 'settings'], function(res) {
			if (res.urls){
				res.urls.forEach(function(element, index){
					urls.push(element);
				});
			} else {
				urls = [null, null, null, null, null, null, null, null, null, null, null, null];
				saveSync();
			}
			if (res.settings) {
				settings.COLUMNS_COUNT = res.settings.COLUMNS_COUNT;
				settings.ROWS_COUNT = res.settings.ROWS_COUNT;
				settings.CHECK_PERIOD = res.settings.CHECK_PERIOD;
			}
			urls_ready = true;
			loaded();
		});

		chrome.storage.local.get(['thumbs', 'hashes'], function(res){
			var i;
			if (res.thumbs) {
				for (i in res.thumbs) {
					if (res.thumbs.hasOwnProperty(i)) {
						thumbs[i] = res.thumbs[i];
					}
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
		urls.splice(new_index, 0, urls.splice(old_index, 1)[0]);
		saveSync();
	};

	subscribe = function (callback) {
		callbacks.push(callback);
	};

	//TODO by URL also
	editPage = function (requestedTab, slot_index) {
		try {
			createThumbOf(requestedTab, function(thumb) {
				urls[slot_index] = requestedTab.url;
				thumbs[urls[slot_index]] = thumb;
				getHash(requestedTab.url, true);
				refreshNewTabPages(slot_index);
				saveSync();
				saveLocal();
			});
		} catch (e) {
			console.log(e);
		}
	};

	chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
		if (sender.tab && sender.id === chrome.i18n.getMessage('@@extension_id')){
			switch (request.action) {
			case 'refreshThumb':
				var url, i = urls.indexOf(sender.tab.url);
				// check if sender tab url really added to fav pages
				if (i !== -1){
					url = sender.tab.url;
				} else {
					url = redirectUrls[sender.tab.url];
				}
				if (url) {
					i = urls.indexOf(url);
					try {
						createThumbOf(sender.tab, function (thumb) {
							// save it
							thumbs[url] = thumb;
							getHash(url, true);
							refreshNewTabPages(i);
							saveLocal();
						});
					} catch (e) {
						console.log(e);
					}
				}
				break;
			case 'subscribe':
				subscribe(request.callback);
				sendResponse({});
				break;
			default:
				sendResponse({}); // snub them.
			}
		} else {
			sendResponse({});
		}
	});

	chrome.webRequest.onBeforeRedirect.addListener(
		function(details){
			if (urls.indexOf(details.url) !== -1){
				redirectUrls[details.redirectUrl] = (details.url);
			}
		},
		{
			urls: ["<all_urls>"],
			types: ["main_frame"]
		},
		['responseHeaders']);

	function sendFresh(tabId) {
		var i, indexes = [];
		for (i in urls) {
			if (urls.hasOwnProperty(i)  && urls[i]) {
				if (!hashes[urls[i]] || !hashes[urls[i]].thumb){
					indexes.push(i);
				}
			}
		}
		chrome.tabs.sendRequest(tabId,
			{action: 'pageIsFresh',
			params: {indexes: indexes}
		});
	}

	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if (tab.url === 'chrome://newtab/' || changeInfo.url === 'chrome://newtab/') {
			sendFresh(tab.id);
		}
	});

	init();

}());