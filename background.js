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
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	switch (request.action) {
	case "refreshThumb":
		if (sender.tab) {
			var i = urls.indexOf(sender.tab.url);
			// check if sender tab url really added to fav pages
			if (i !== -1) {
				// save sender tab id we could use it inside callback
				var senderTabId = sender.tab.id;
				try {
					chrome.tabs.getSelected(null, function(currentTab) {
						// save current tab id in case user have changed tab and sender is inactive
						var TabIdReturnTo = currentTab.id;
						// switch to sender tab
						chrome.tabs.update(senderTabId, {
							selected: true,
							pinned: false
						}, function(tab) {
							// take screenshot
							createThumb(function(thumb) {
								// save it
								thumbs[urls[i]] = thumb;
								//save();
								refreshNewTabPages(i);
							});
							// switch back
							chrome.tabs.update(TabIdReturnTo, {
								selected: true,
								pinned: false
							});
						});
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
	chrome.bookmarks.search('$Sexy NewTab$', function(slotsAnchor) {
		if (0 === slotsAnchor.length) {
			chrome.bookmarks.getTree(function(Tree) {
				var tmpOtherBookmarksId = Tree[0].children[1].id;
				chrome.bookmarks.create({
					parentId: tmpOtherBookmarksId,
					title: "$Sexy NewTab$"
				}, function(parentFolder) {
					settingsNodeId = parentFolder.id;
					chrome.bookmarks.create({
						parentId: settingsNodeId,
						title: "$Sexy NewTab$ !do not edit!",
						url: "https://chrome.google.com/webstore/detail/cbmkldolpdkljfjhghoaeehelhbiimbh",
						index: 0
					});
					for (var i = 1; 12 >= i; i++) {
						chrome.bookmarks.create({
							parentId: settingsNodeId,
							title: "null",
							url: 'data:image/png;base64,',
							index: i
						});
						slots[i] = {
							url: null,
							thumb: null
						};
					}
					announce();
					//TODO Add Cols&Rows parameters bookmark.
				});
			});
		} else {
			settingsNodeId = slotsAnchor[0].parentId;
			load();
		}
	});
}

function load() {
	try {
		chrome.bookmarks.getChildren(settingsNodeId, function(settingsList) {
			//TODO Valid count parameter.
			for (var i = 1; 12 >= i; i++) {
				if ("null" == settingsList[i].title) {
					//slots[i] = {bookmark_id:settingsList[i].id,url:null,thumb:null};
					urls.push(null);
				} else {
					/* slots[i] = {
						bookmark_id:settingsList[i].id,
						url:settingsList[i].title,
						thumb:settingsList[i].url
					}; */
					urls.push(settingsList[i].title);
					thumbs[settingsList[i].title] = settingsList[i].url;
				}
			}
			announce();
		});
	} catch (e) {
		console.log(e);
	}
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

function save(slotId) {
	try {
		if (null === slots[slotId].url) {
			chrome.bookmarks.update(slots[slotId].bookmark_id, {
				title: "null",
				url: 'data:image/png;base64,'
			});
		} else chrome.bookmarks.update(slots[slotId].bookmark_id, {
			title: slots[slotId].url,
			url: slots[slotId].thumb
		});
	} catch (e) {
		console.log(e);
	}
}

function editPage(tabId, slot_index) {
	try {
		chrome.tabs.getSelected(null, function(currentTab) {
			var NewTabIdReturnTo = currentTab.id;
			chrome.tabs.update(tabId, {
				selected: true,
				pinned: false
			}, function(tab) {
				createThumb(function(thumb) {
					urls[slot_index] = tab.url;
					thumbs[urls[slot_index]] = thumb;
					//save();
					chrome.tabs.sendRequest(NewTabIdReturnTo, {
						action: "updatePageThumb",
						params: {
							index: slot_index
						}
					});
				});
				chrome.tabs.update(NewTabIdReturnTo, {
					selected: true,
					pinned: false
				});
			});
		});
	} catch (e) {
		console.log(e);
	}
}

function remove(index) {
	urls[index] = null;
	delete thumbs[urls[index]];
	//save();
}

function swap(old_index, new_index) {
	urls.splice(new_index, 0, urls.splice(old_index, 1)[0]);
	//save();
}

function refreshNewTabPages(slot_index) {
	chrome.windows.getAll({
		populate: true
	}, function(windows) {
		for (var i in windows) {
			for (var j in windows[i].tabs) {
				if ("chrome://newtab/" == windows[i].tabs[j].url) {
					chrome.tabs.sendRequest(windows[i].tabs[j].id, {
						action: "updatePageThumb",
						params: {
							index: slot_index
						}
					});
				}
			}
		}
	});
}

function createThumb(callback) {
	try {
		chrome.tabs.captureVisibleTab(null, {
			format: "png"
		}, callback);
	} catch (e) {
		console.log(e);
	}
}