;(function () {
'use strict';

	var COLUMNS_COUNT,
		ROWS_COUNT,
		DELTA = 10,
		PAGE_WIDTH,
		PAGE_HEIGHT,
		FLOW = false,
		currentEditPage = null,
		back,
		slotsList,
		dragPage = null,
		lastPosition = null,
		pagePosX,
		pagePosY,
		_offsetX,
		_offsetY,
		currentItem,
		first_flow_page,
		current_flow_page,
		handlers = {
			'#toggle_button *': toggleDisplay,
			'#edit .header .tab *': switchList,
			'#edit_cancel *': hideEditForm,
			'#edit_ok *': editPage,
			'.page:not(.inactive) .flipper a *': pageClickHandler,
			'.page .flipper .edit *': function () {toggleEditForm(closest(this, '.page'));},
			'.page .flipper .remove *': clearPage,
			'.page.inactive .flipper a *': function () {toggleEditForm(closest(this, '.page'));},
			'#edit .list .item': selectLink
		};

	function d(id) {
		return document.getElementById(id);
	}

	function $ (selector) {
		return document.querySelectorAll(selector);
	}

	function closest(el, selector) {
		while (el) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentElement;
		}
		return null;
	}

	function onDrag(e) {
		if (e.screenX > 0 || e.screenY > 0) {
			var TargetPosX,
				TargetPosY,
				modificator,
				i,
				moved,
				tmpPosX,
				tmpPosY,
				p_left = e.x - _offsetX,
				p_top = e.y - _offsetY,
				col = Math.floor((p_left + PAGE_WIDTH / 2 + DELTA) / (PAGE_WIDTH + DELTA)),
				row = Math.floor((p_top + PAGE_HEIGHT / 2 + DELTA) / (PAGE_HEIGHT + DELTA)),
				position = row * COLUMNS_COUNT + col;
			dragPage.style.left = p_left;
			dragPage.style.top = p_top;
			if ((position >= 0) && (position < ROWS_COUNT * COLUMNS_COUNT) && (position !== dragPage.index)) {
				if (Math.abs(p_left - col * (PAGE_WIDTH + DELTA)) < PAGE_WIDTH / 2) {
					TargetPosX = pagePosX;
					TargetPosY = pagePosY;
					modificator = (position > dragPage.index) ? 1 : -1;
					i = dragPage.index;
					do {
						i += modificator;
						moved = d('page' + i);
						tmpPosX = parseFloat(moved.style.left);
						tmpPosY = parseFloat(moved.style.top);
						moved.style.left = TargetPosX;
						moved.style.top = TargetPosY;
						TargetPosX = tmpPosX;
						TargetPosY = tmpPosY;
						moved.setAttribute('id', 'page' + (i - modificator));
						moved.index = i - modificator;
					} while (i !== position);
					pagePosX = TargetPosX;
					pagePosY = TargetPosY;
					dragPage.index = position;
					dragPage.setAttribute('id', 'page' + position);
					set.insertBefore(dragPage, d('page' + (position + 1)));
				}
			}
		}
	}
	function stopDrag() {
		document.ondrag = null;
		document.ondragend = null;
		dragPage.ondragover = null;
		dragPage.style.zIndex = null;
		dragPage.classList.remove('draged');
		dragPage.style.left = pagePosX;
		dragPage.style.top = pagePosY;
		dragPage.style.width = '';
		dragPage.style.height = '';
		back.swap(lastPosition, dragPage.index);
		lastPosition = null;
	}
	function prepareDrag(e) {
		dragPage = closest(e.target, '.page');
		if (dragPage.classList.contains('page')) {
			lastPosition = dragPage.index;
			dragPage.classList.add('draged');
			dragPage.style.zIndex = 1000;
			pagePosX = dragPage.offsetLeft;
			pagePosY = dragPage.offsetTop;
			_offsetX = e.x - pagePosX;
			_offsetY = e.y - pagePosY;
			dragPage.style.width = PAGE_WIDTH + 15;
			dragPage.style.height = PAGE_HEIGHT + 15;
			document.ondrag = onDrag;
			document.ondragend = stopDrag;
		}
	}
	function showEditForm() {
		var inputUrl = $('#link_url input')[0];
		currentEditPage.appendChild(edit);
		$('#edit .header .tab.active')[0].click();
		inputUrl.value = currentEditPage.url;
		inputUrl.title = currentEditPage.url || '';
		inputUrl.onchange();
		setTimeout(function () {
			currentEditPage.classList.add('turned', 'ontop');
		}, 10);
	}
	function hideEditForm() {
		currentEditPage.classList.remove('turned');
		setTimeout(function () {
			currentEditPage.classList.remove('ontop');
			currentEditPage = null;
		}, 300);
	}
	function toggleEditForm(page) {
		if (!currentEditPage) {
			currentEditPage = page;
			showEditForm();
			return;
		}
		if (currentEditPage && page !== currentEditPage) {
			hideEditForm();
			setTimeout(function () {
				currentEditPage = page;
				showEditForm();
			}, 310);
		}
	}
	function clearPage (event) {
		chrome.extension.sendRequest({
			action: 'clear',
			index: closest(this, '.page').index
		}, function() {});
	}
	function removePage(page) {
		page.querySelector('a').removeAttribute('href');
		page.classList.remove('fresh');
		page.style.webkitTransform = 'scale(0.3)';
		setTimeout(function () {
			if (FLOW){
				if (page === first_flow_page){
					first_flow_page = getNextActivePage();
				}
				page.classList.add('deleting');
				flowTo(getNextActivePage() || getPrevActivePage());
				setTimeout(function () {
					page.style['margin-left'] = '';
					page.classList.remove('deleting');
					page.classList.add('inactive');
				}, 500);
			} else {
				page.classList.add('inactive');
			}
			page.querySelector('.thumbnail').removeAttribute('style');
			page.querySelector('.plus').removeAttribute('style');
			page.style.webkitTransform = 'scale(1)';
			setTimeout(function () {
				page.style.webkitTransform = '';
			}, 10);
		}, 200);
	}
	function calcSize() {
		var _width = window.innerWidth,
			_height = window.innerHeight,
			PROPORTION = _height / _width;
		PAGE_WIDTH = FLOW ? _width / 2 : (_width - (DELTA * (COLUMNS_COUNT + 1))) / COLUMNS_COUNT;
		PAGE_HEIGHT = FLOW ? _height / 2 : PAGE_WIDTH * PROPORTION;
		if (!FLOW && PAGE_HEIGHT * ROWS_COUNT + ((ROWS_COUNT + 1) * DELTA) > _height) {
			PAGE_HEIGHT = (_height - (DELTA * (ROWS_COUNT + 1))) / ROWS_COUNT;
			PAGE_WIDTH = PAGE_HEIGHT / PROPORTION;
		}
	}
	function updatePage(slotIndex, page, thumb) {
		page = page || d('page' + slotIndex);
		var oldUrl = page.url;
		page.url = slotsList[slotIndex] ? slotsList[slotIndex].url : null;
		page.thumb = thumb ? thumb :
			slotsList[slotIndex] && slotsList[slotIndex].thumb ? slotsList[slotIndex].thumb :
			(oldUrl === page.url) ? page.thumb : '';
		if (page.url) {
			page.querySelector('a').setAttribute('href', page.url);
			if(!page.thumb){
				if (slotsList[slotIndex].favicon && slotsList[slotIndex].favicon.href){
					page.querySelector('.plus').style['-webkit-mask-image'] = 'URL(' + slotsList[slotIndex].favicon.href + ')';
					page.querySelector('.plus').style['background-color'] = slotsList[slotIndex].favicon.color || '#FFF';
				} else {
					page.querySelector('.plus').style['background-image'] = 'URL(' + slotsList[slotIndex].favicon + ')';
				}
			}
			page.classList.remove('inactive', 'fresh');
			page.querySelector('.thumbnail').style['background-image'] = 'URL(' + page.thumb + ')';
		}
	}
	function pageClickHandler(event) {
		var page;
		page = closest(this, '.page');
		if (FLOW && !page.classList.contains('current')){
			event.preventDefault();
			if (event.button !== 0) {return;}
			flowTo(page);
		} else {
			if (event.button !== 0) {return;}
			setTimeout(function(){
				page.classList.add('full');
			}, 10);
		}
	}
	function createPages() {
		var thumbnailnode = document.createElement('div'),
			pages = document.createDocumentFragment(),
			i,
			j,
			index,
			leftPos,
			topPos,
			page,
			innerHtml =
			'<div class="flipper">'+
				'<a class="link">'+
					'<div class="backgradient"></div>'+
					'<div class="plus"><i class="st-plus-circle"></i></div>'+
					'<div class="thumbnail"></div>'+
				'</a>'+
				'<button class="edit" title="'+chrome.i18n.getMessage('m_edit') + '"><i class="st-pencil"></i></button>'+
				'<button class="remove" title="'+chrome.i18n.getMessage('m_clear') + '"><i class="st-trash"></i></button>'+
			'</div>';
		thumbnailnode.setAttribute('class', 'page inactive');
		thumbnailnode.insertAdjacentHTML('beforeend', innerHtml);
		index = 0;
		for (i = 0; i < ROWS_COUNT; i++) {
			for (j = 0; j < COLUMNS_COUNT; j++) {
				page = thumbnailnode.cloneNode(true);
				page.draggable = true;
				page.setAttribute('id', 'page' + index);
				page.index = index;
				leftPos = j * (PAGE_WIDTH + DELTA);
				topPos = i * (PAGE_HEIGHT + DELTA);
				page.style.left = leftPos;
				page.style.top = topPos;
				pages.appendChild(page);
				updatePage(index, page);
				index++;
			}
		}
		set.appendChild(pages);
		page.firstElementChild.appendChild(edit);
		document.ondragstart = prepareDrag;
	}
	function clicksDelegate (event) {
		for (var selector in handlers){
			if (event.target.matches(selector) || event.target.matches(selector.replace('*', ''))){
				var target = closest(event.target, selector.replace('*', ''));
				handlers[selector].call(target, event);
				return;
			}
		}
	}
	function setBackGradient () {
		var grad_radius = Math.sqrt(PAGE_WIDTH * PAGE_WIDTH / 4 + PAGE_HEIGHT * PAGE_HEIGHT / 3),
			grad_radiusF = Math.sqrt(window.innerWidth * window.innerWidth / 4 + window.innerHeight * window.innerHeight / 3);
		backgradient.innerHTML =
		['.backgradient {',
			'background-image: -webkit-gradient(radial, center top, 5, center 30%, ' +
					grad_radius + ', from(#000065), to(#000010))',
			'}',
		'.full .backgradient {',
			'background-image: -webkit-gradient(radial, center top, 5, center 30%, ' +
					grad_radiusF + ', from(#000065), to(#000010))',
			'}'].join('\n');
	}
	function setPagesSize() {
		var i, j, index, leftPos, topPos, page, rules, setWidth, setHeight;
		calcSize();
		setBackGradient();
		setWidth = ((PAGE_WIDTH + DELTA) * COLUMNS_COUNT - DELTA);
		setHeight = ((PAGE_HEIGHT + DELTA) * ROWS_COUNT - DELTA);
		rules =
		['#set {',
			'width: ' + setWidth + 'px;',
			'height: ' + setHeight + 'px;',
		'}',
		'.page {',
			'width: ' + PAGE_WIDTH + 'px;',
			'height: ' + PAGE_HEIGHT + 'px;',
			'}',
		'.page.full {',
			'width: ' + window.innerWidth + 'px;',
			'height: ' + window.innerHeight + 'px;',
			'left: '+ -DELTA + 'px !important;',
			'top: '+ -(window.innerHeight - setHeight)/2 + 'px !important;',
			'z-index: 1000;',
			'}',
		'.plus i {',
			'font-size: ' + PAGE_HEIGHT  * 35.457 / 100 + 'px'].join('\n');
		index = 0;
		tile_style.innerHTML = rules;
		for (i = 0; i < ROWS_COUNT; i++) {
			for (j = 0; j < COLUMNS_COUNT; j++) {
				leftPos = j * (PAGE_WIDTH + DELTA);
				topPos = i * (PAGE_HEIGHT + DELTA);
				page = d('page' + index);
				if (page) {
					page.style.left = leftPos;
					page.style.top = topPos;
					index++;
				}
			}
		}
	}

	function firstInit () {
		chrome.topSites.get(function (topSites) {
			var length = topSites.length < slotsList.length ? topSites.length : slotsList.length,
				deniedCount = 0;
			back.settings.NEW = false;
			for (var i = 0; i < length; i++){
				if (!back.editPage(topSites[i].url, i - deniedCount)){
					deniedCount++;
				}
			}
		});
	}

	function buildList (linksList, isTab) {
		var node = $('#edit .list .tree')[0],
			list = document.createDocumentFragment(),
			protocol = /^https?:/,
			item;
		[].slice.call(node.children).forEach(function(link){node.removeChild(link);});
		for (var i = 0; i < linksList.length; i++) {
			if (protocol.test(linksList[i].url)) {
				item = document.createElement('li');
				item.style['background-image'] = 'URL(' + (linksList[i].favIconUrl || 'chrome://favicon/'+linksList[i].url) + ')';
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

	function switchToTabs() {
		var tabs = [];
		chrome.windows.getAll({populate: true}, function (windows) {
			for (var i = 0; i < windows.length; i++) {
				tabs = tabs.concat(windows[i].tabs);
			}
			buildList(tabs, true);
		});
	}
	function switchToHistory() {
		chrome.history.search({
			text: '',
			startTime: (new Date()).getTime() - 1000 * 60 * 60 * 24 * 7
		}, function (visitItems) {
			buildList(visitItems);
		});
	}
	function switchToTop() {
		chrome.topSites.get(function (topSites) {
			buildList(topSites);
		});
	}
	function switchToBookmarks () {
	}

	function switchList () {
		if (this.getAttribute('disabled') === 'disabled'){return;}
		$('#edit .header .tab.active')[0].classList.remove('active');
		this.classList.add('active');
		this.id === 'tabs' ? switchToTabs() :
			this.id === 'history' ? switchToHistory() :
			this.id === 'topsites' ? switchToTop()
			: switchToBookmarks();
	}

	function selectLink (event) {
		var inputUrl = $('#link_url input')[0];
		inputUrl.value = this.url;
		inputUrl.onchange();
		currentItem && currentItem.classList.remove('selected');
		currentItem = this;
		this.classList.add('selected');
		inputUrl.select();
	}
	function editPage() {
		var state = edit_ok.getAttribute('disabled');
		if (state === 'disabled'){return;}
		back.editPage($('#link_url input')[0].value, currentEditPage.index, currentItem && currentItem.tab);
		hideEditForm();
	}

	function urlChange (event) {
		if (event && event.type === 'paste'){
			setTimeout(urlChange, 1);
			return;
		}
		var protocol = /^https?:\/\//,
			domain = /^[\w]+[\w-\.]+/,
			url = $('#link_url input')[0].value;
		currentItem && currentItem.classList.remove('selected');
		currentItem = null;
		if (!protocol.test(url) && !domain.test(url)){
			edit_ok.setAttribute('disabled', 'disabled');
		} else {
			edit_ok.removeAttribute('disabled');
		}
	}

	function current_index(){
		var i = first_flow_page.index,
			res = i,
			classes;
		for (; i<current_flow_page.index; i++) {
			classes = d('page'+i).classList;
			if (!classes.contains('inactive') && !classes.contains('deleting')) {
				res++;
			}
		}
		return res;
	}

	function getNextActivePage() {
		var tmp;
		if (first_flow_page){
			tmp = current_flow_page;
		} else {
			tmp = set.firstElementChild;
			if (!tmp.classList.contains('inactive')){
				return tmp;
			}
		}
		while (tmp = tmp.nextElementSibling){
			if (!tmp.classList.contains('inactive')){
				return tmp;
			}
		}
	}
	function getPrevActivePage(){
		var tmp = current_flow_page;
		while (tmp = tmp.previousElementSibling){
			if (!tmp.classList.contains('inactive')){
				return tmp;
			}
		}
	}
	function flowTo(target) {
		if(target){
			current_flow_page.classList.remove('current');
			current_flow_page = target;
			current_flow_page.classList.add('current');
			first_flow_page.style['margin-left'] = (first_flow_page.index - current_index()) * 10 - 20*(first_flow_page !== current_flow_page) + '%';
		}
	}

	function scrollFlow(e) {
		if (!FLOW){return;}
		if (e.wheelDelta < 0) {
			flowTo(getNextActivePage());
		} else if (e.wheelDelta > 0) {
			flowTo(getPrevActivePage());
		}
	}

	function keyHandler(e) {
		if(e.keyCode === 27 && currentEditPage){
			hideEditForm();
		}
		if (!FLOW){return;}
		if (e.keyCode === 39) {
			flowTo(getNextActivePage());
		} else if (e.keyCode === 37) {
			flowTo(getPrevActivePage());
		}
	}

	function toggleDisplay() {
		if (FLOW){
			main.classList.remove('flow');
			current_flow_page.classList.remove('current');
			first_flow_page.style['margin-left'] = '';
			first_flow_page = current_flow_page = null;
		} else {
			first_flow_page = current_flow_page = getNextActivePage();
			if (!first_flow_page){return;}
			current_flow_page.classList.add('current');
			first_flow_page.style['margin-left'] = '0';
			main.classList.add('flow');
		}
		FLOW = !FLOW;
		chrome.extension.sendRequest({
			action: 'toggleView',
			FLOW: FLOW
		}, function() {});
		setPagesSize();
		setBackGradient();
	}
	function init () {
		var _width = window.innerWidth,
			_height = window.innerHeight,
			styles = document.createElement('style');
		document.head.appendChild(styles.cloneNode(true)).setAttribute('id','backgradient');
		document.head.appendChild(styles.cloneNode(true)).setAttribute('id','tile_style');
		$('#tabs span')[0].innerText = chrome.i18n.getMessage('fn_tabs');
		$('#bookmarks span')[0].innerText = chrome.i18n.getMessage('fn_bookmarks');
		$('#history span')[0].innerText = chrome.i18n.getMessage('fn_history');
		$('#topsites span')[0].innerText = chrome.i18n.getMessage('fn_top');
		document.onclick = clicksDelegate;
		back = chrome.extension.getBackgroundPage();
		slotsList = back.slotsList;
		COLUMNS_COUNT = back.settings.COLUMNS_COUNT;
		ROWS_COUNT = back.settings.ROWS_COUNT;
		function hacks() {
			var wait = null;
			setPagesSize();
			createPages();
			back.settings.NEW && firstInit();
			back.settings.FLOW && toggleDisplay();
			window.onresize = function () {
				if (_width !== window.innerWidth || _height !== window.innerHeight) {
					_width = window.innerWidth;
					_height = window.innerHeight;
					clearTimeout(wait);
					wait = setTimeout(setPagesSize, 100);
				}
			};
			var inputUrl = $('#link_url input')[0];
			inputUrl.onpaste = inputUrl.onkeyup = inputUrl.onchange = urlChange;
			inputUrl.onkeydown = function (event) {
				if (event.keyCode === 13){
					editPage();
				}
				if (FLOW && (event.keyCode === 39 || event.keyCode === 37)){
					event.stopPropagation();
				}
			};
			$('#edit .tree')[0].onmousewheel = function (event) {
				if (event.wheelDeltaX === 0){event.stopPropagation();}
			};
			document.onkeydown = keyHandler;
			document.onmousewheel = scrollFlow;
		}
		if (!slotsList.length) {
			back.subscribe(hacks);
		} else { hacks(); }
	}

	chrome.extension.onRequest.addListener(
		function (request, sender, sendResponse) {
			if (sender.id === chrome.i18n.getMessage('@@extension_id')) {
				switch (request.action) {
				case 'updatePage':
					updatePage(request.params.index, null, request.params.thumb);
					break;
				case 'remove':
					removePage(d('page'+request.params.index));
					break;
				case 'pageIsFresh':
					request.params.indexes.forEach(function(index){
						d('page'+index).classList.add('fresh');
					});
					break;
				}
			}
		}
	);

	window.onload = init();

}());