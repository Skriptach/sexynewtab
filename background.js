//slots = new Array();
urls = [];
thumbs = {};
settingsNodeId = "";
Settings = [];
callbacks = [];
init();
/*chrome.tabs.onCreated.addListener(function(tab) {
	tabsList[tab.id+""] = {
		id      : tab.id,
		url     : tab.url,
		title   : tab.title
	}
});
chrome.tabs.onUpdated.addListener(function(tabId, object , tab) {
	tabsList[tab.id+""] = {
		id      : tab.id,
		url     : tab.url,
		title   : tab.title
	}
});
*/
//chrome.tabs.onSelectionChanged.addListener(function(tabId, object) {});
chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
	case "refreshThumb":
		if (sender.tab) {
			var i = urls.indexOf(sender.tab.url);
			// check if sender tab url really added to fav pages
			if (i !== -1) {
				try {
					createThumbOfTab(sender.tab, function (thumb) {
						// save it
						thumbs[urls[i]] = thumb;
						refreshNewTabPages(i);
						saveLocal();
					});
				} catch (e) {
					console.log(e);
				}
				break;
			}
		}
		break;
	case "getSlots":
		if (sender.tab) {
			sendResponse({
				urls: urls,
				thumbs: thumbs
			});
		}
		break;
	case "subscribe":
		if (sender.tab) {
			subscribe(request.callback);
			sendResponse({});
		}
		break;
	default:
		sendResponse({}); // snub them.
	}
});

function init() {
	var urls_ready = false, thumbs_ready = false;

	function loaded() {
		if (urls_ready && thumbs_ready) {
			announce();
		}
	}

	function oncontextEdit(info, tab) {
		var i = urls.indexOf(info.linkUrl);
		if (i !== -1) {
			chrome.tabs.sendRequest(tab.id, {
				action: "showEditForm",
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
				action: "remove",
				params: {
					index: i
				}
			});
		}
	}

	chrome.contextMenus.create({title: chrome.i18n.getMessage("m_edit"),
							contexts: ["link"],
							documentUrlPatterns: ['chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/layout.html'],
							onclick: oncontextEdit });
	chrome.contextMenus.create({title: chrome.i18n.getMessage("m_clear"),
							contexts: ["link"],
							documentUrlPatterns: ['chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/layout.html'],
							onclick: oncontextRemove
							});
	chrome.storage.sync.get("urls", function(res){
		if (res.urls){
			res.urls.forEach(function(element, index){
				urls.push(element);
			});
		} else {
			urls = [null, null, null, null, null, null, null, null, null, null, null, null];
			saveSync();
		}
		urls_ready = true;
		loaded();
	});

	chrome.storage.local.get("thumbs", function(res){
		var i;
		if (res.thumbs) {
			for (i in res.thumbs) {
				if (res.thumbs.hasOwnProperty(i)) {
					thumbs[i] = res.thumbs[i];
				}
			}
		}
		thumbs_ready = true;
		loaded();
	});
}

// subscribe and announce added for that case when browser just runed with saved tabs
// and 'slots' is empty (have not loaded in time). So at the place 'slots' was demand (newtab or content-script),
// execution can be restored.


function subscribe(callback) {
	callbacks.push(callback);
}

function announce() {
	for (var i in callbacks) {
		callbacks[i]();
	}
	callbacks = null;
}

function saveLocal() {
	try {
		chrome.storage.local.set({'thumbs': thumbs});
	} catch (e) {
		console.log(e);
	}
}

function saveSync(){
	try {
		chrome.storage.sync.set({'urls': urls});
	} catch (e) {
		console.log(e);
	}
}

function editPage(requestedTab, slot_index) {
	try {
		createThumbOfTab(requestedTab,function(thumb) {
			urls[slot_index] = requestedTab.url;
			thumbs[urls[slot_index]] = thumb;
			refreshNewTabPages(slot_index);
			saveSync();
			saveLocal();
		});
	} catch (e) {
		console.log(e);
	}
}

function swap(old_index, new_index) {
	urls.splice(new_index, 0, urls.splice(old_index, 1)[0]);
	saveSync();
}

function refreshNewTabPages(slot_index) {
	chrome.extension.sendRequest({action: "updatePageThumb", params: {index: slot_index}});
}

function createThumbOfTab(tab, callback) {
	try {
		//get current tab
		chrome.tabs.getSelected(null, function(currentTab) {
			// switch to requested tab
			chrome.tabs.update(tab.id, {
				active: true,
				selected: true,
				pinned: tab.pinned
			}, function(tab) {
				// take screenshot
				chrome.tabs.captureVisibleTab(tab.windowId, {
					format: "png"
				}, function(thumb){
					// switch back
					chrome.tabs.update(currentTab.id, {
						active: true,
						selected: true,
						pinned: currentTab.pinned
					});
					callback(thumb);
				});
			});
		});
	} catch (e) {
		console.log(e);
	}
}