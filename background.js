var urls = [],
	thumbs = {},
	settings = {
		COLUMNS_COUNT : 5,
		ROWS_COUNT : 4,
		CHECK_PERIOD : 4, //hours
		FLOW : false,
		NEW : false // flag for just installed
	},
	swap, editPage, subscribe;

;(function (){

	var hashes = {},
		timers = {},
		callbacks = [],
		redirectUrls = {},
		TRIES = 3;
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
		var buferT = {};
		var buferH = {};
		urls.forEach(function (url) {
			if (!url){return;}
			thumbs[url] && (buferT[url] = thumbs[url]);
			hashes[url] && (buferH[url] = hashes[url]);
		});
		thumbs = buferT;
		hashes = buferH;
		chrome.storage.local.set({'thumbs': thumbs, 'hashes': hashes});
	}

	function saveSync(){
		try {
			chrome.storage.sync.set({'urls': urls, 'settings': settings});
		} catch (e) {
			console.log(e);
		}
	}

	function refreshPages(slot_index) {
		chrome.extension.sendRequest({action: 'updatePage', params: {index: slot_index, thumb: thumbs[urls[slot_index]]}});
	}

	function createThumbOf(requestedTab, callback, savedTab) {
		function takeScreenshot () {
			try {// take screenshot
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
			} catch (e){
				console.log(e);
			}
		}

		try {
			//get current tab
			chrome.tabs.getSelected(null, function(currentTab) {
				if (currentTab.id === requestedTab.id){
					takeScreenshot();
				} else {
					savedTab = savedTab || currentTab;
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
						chrome.extension.sendRequest({action: 'pageIsFresh', params: {indexes: [urls.indexOf(url)]}});
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

	function onRemove (index) {
		if (index !== -1) {
			var url = urls[index];
			urls[index] = null;
			if (urls.indexOf(url) === -1) {
				delete thumbs[urls[index]];
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

		chrome.storage.sync.get(['urls', 'settings'], function(res) {
			if (res.urls){
				res.urls.forEach(function(element, index){
					urls.push(element);
				});
			} else {
				urls = new Array(20);
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

	editPage = function (url, slot_index, requestedTab) {
		var protocol = /^https?:\/\//,
			domain = /^[\w]+[\w-\.]+/;
		if (!protocol.test(url)){
			if(!domain.test(url)){return false;}
			url = 'http://'+url;
		}
		if (urls[slot_index] === url){return;}
		urls[slot_index] = url;
		getHash(url, true);
		saveLocal();
		saveSync();
		if (requestedTab) {
			createThumbOf(requestedTab, function(thumb) {
				thumbs[requestedTab.url] = thumb;
				refreshPages(slot_index);
				saveLocal();
			});
		} else {
			refreshPages(slot_index);
		}
		return true;
	};

	chrome.runtime.onInstalled.addListener(function (event) {
		function notEmpty (link) {
			return !!link;
		}
		if (event.reason === 'install' && !urls.some(notEmpty)){
			settings.NEW = true;
		}
	});

	chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
		if (sender.tab && sender.id === chrome.i18n.getMessage('@@extension_id')){
			switch (request.action) {
			case 'refreshThumb':
				var url, i;
				// check if sender tab url really added to fav pages
				url = getByRedirected(sender.tab.url);
				if (url) {
					i = urls.indexOf(url);
					createThumbOf(sender.tab, function (thumb) {
						// save it
						thumbs[url] = thumb || thumbs[url];
						getHash(url, true);
						refreshPages(i);
						saveLocal();
					});
				}
				break;
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

	function getByRedirected (url) {
		if (urls.indexOf(url) !== -1){return url;}
		for(var u in redirectUrls){
			if (redirectUrls[u].indexOf(url) !== -1){return u;}
		}
	}

	chrome.webRequest.onBeforeRedirect.addListener(function(details){
		var origin = getByRedirected(details.url);
		origin && (redirectUrls[origin] = redirectUrls[origin] || []);
		if (origin && redirectUrls[origin] && redirectUrls[origin].indexOf(details.redirectUrl) === -1) {
			redirectUrls[origin].push(details.redirectUrl);
		}
	}, {
		urls: ['<all_urls>'],
		types: ['main_frame']
	}, ['responseHeaders']);

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
		if (tab.url === 'chrome://newtab/' && tab.status === 'complete') {
			sendFresh(tab.id);
		}
	});

	init();

}());