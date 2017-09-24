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
		cuurentTheme = 'deep-purple',
		handlers = {
			'#toggle_button *': toggleDisplay,
			'#customize_button *': toggleCustomize,
			'#customize .theme *': function(){ switchTheme(this.getAttribute('data'), true);},
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
						moved = d(`page${i}`);
						tmpPosX = parseFloat(moved.style.left);
						tmpPosY = parseFloat(moved.style.top);
						moved.style.left = TargetPosX;
						moved.style.top = TargetPosY;
						TargetPosX = tmpPosX;
						TargetPosY = tmpPosY;
						moved.setAttribute('id', `page${i - modificator}`);
						moved.index = i - modificator;
					} while (i !== position);
					pagePosX = TargetPosX;
					pagePosY = TargetPosY;
					dragPage.index = position;
					dragPage.setAttribute('id', `page${position}`);
					set.insertBefore(dragPage, d(`page${position + 1}`));
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
		if (dragPage.classList.contains('turned') || FLOW) {
			e.preventDefault();
			return;
		}
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
		page.style.webkitTransform = 'scale(0.3)';
		setTimeout(function () {
			page.classList.add('inactive');
			if (FLOW){
				if (page === first_flow_page){
					first_flow_page = getNextActivePage();
				}
				page.classList.add('deleting');
				flowTo(getNextActivePage() || getPrevActivePage());
				setTimeout(function () {
					page.classList.remove('deleting');
				}, 500);
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
		page = page || d(`page${slotIndex}`);
		var oldUrl = page.url;
		page.url = slotsList[slotIndex] ? slotsList[slotIndex].url : null;
		page.thumb = thumb ? thumb :
			slotsList[slotIndex] && slotsList[slotIndex].thumb ? slotsList[slotIndex].thumb :
			(oldUrl === page.url) ? page.thumb : '';
		if (page.url) {
			page.querySelector('a').setAttribute('href', page.url);
			if(!page.thumb){
				var icon = page.querySelector('.plus');
				if (slotsList[slotIndex].favicon && slotsList[slotIndex].favicon.href){
					icon.style['background-image'] = '';
					icon.style['-webkit-mask-image'] = `url(${slotsList[slotIndex].favicon.href})`;
					icon.style['background-color'] = slotsList[slotIndex].favicon.color || '#FFF';
				} else {
					icon.style['background-color'] = '';
					icon.style['-webkit-mask-image'] = '';
					icon.style['background-image'] = `url(${slotsList[slotIndex].favicon})`;
				}
			}
			page.classList.remove('inactive');
			page.querySelector('.thumbnail').style['background-image'] = `url(${page.thumb})`;
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
			`<div class="flipper">
				<a class="link">
					<div class="backgradient"></div>
					<div class="plus"><i class="st-plus-circle"></i></div>
					<div class="thumbnail"></div>
				</a>
				<button class="edit" title="${chrome.i18n.getMessage('m_edit')}"><i class="st-pencil"></i></button>
				<button class="remove" title="${chrome.i18n.getMessage('m_clear')}"><i class="st-trash"></i></button>
			</div>`;
		thumbnailnode.setAttribute('class', 'page inactive');
		thumbnailnode.insertAdjacentHTML('beforeend', innerHtml);
		index = 0;
		for (i = 0; i < ROWS_COUNT; i++) {
			for (j = 0; j < COLUMNS_COUNT; j++) {
				page = thumbnailnode.cloneNode(true);
				page.draggable = true;
				page.setAttribute('id', `page${index}`);
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
		`.backgradient {
			background-image: -webkit-gradient(radial, center top, 5, center 30%,
					${grad_radius}, from(#000065), to(#000010))
			}
		.full .backgradient {
			background-image: -webkit-gradient(radial, center top, 5, center 30%,
					${grad_radiusF}, from(#000065), to(#000010))
			}`;
	}
	function setPagesSize() {
		var i, j, index, leftPos, topPos, page, rules, setWidth, setHeight;
		calcSize();
		setBackGradient();
		setWidth = ((PAGE_WIDTH + DELTA) * COLUMNS_COUNT - DELTA);
		setHeight = ((PAGE_HEIGHT + DELTA) * ROWS_COUNT - DELTA);
		$('.page').forEach(function (page, i, arr) {
			page.style.width = page.style.height = page.style.top = page.style.left = null;
		});
		rules =
		`#set {
			width: ${setWidth}px;
			height: ${setHeight}px;
		}
		.page {
			width: ${PAGE_WIDTH}px;
			height: ${PAGE_HEIGHT}px;
			}
		body:not(.flow) .page.full {
			width: ${window.innerWidth/2}px;
			height: ${window.innerHeight/2}px;
			left: ${(setWidth - window.innerWidth/2)/2}px !important;
			top: ${(setHeight - window.innerHeight/2)/2}px !important;
			}
		.plus i {
			font-size: ${PAGE_HEIGHT  * 35.457 / 100}px`;
		index = 0;
		tile_style.innerHTML = rules;
		for (i = 0; i < ROWS_COUNT; i++) {
			for (j = 0; j < COLUMNS_COUNT; j++) {
				leftPos = j * (PAGE_WIDTH + DELTA);
				topPos = i * (PAGE_HEIGHT + DELTA);
				page = d(`page${index}`);
				if (page) {
					page.style.left = leftPos;
					page.style.top = topPos;
					index++;
				}
			}
		}
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
				item.style['background-image'] = `url(${(linksList[i].favIconUrl || 'chrome://favicon/'+linksList[i].url)})`;
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
		if (this.disabled){return;}
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
		if (edit_ok.disabled){return;}
		back.editPage($('#link_url input')[0].value, currentEditPage.index, currentItem && currentItem.tab);
		updatePage(currentEditPage.index);
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
			edit_ok.setAttribute('disabled', '');
		} else {
			edit_ok.removeAttribute('disabled');
		}
	}

	function current_index(){
		var i = first_flow_page.index,
			res = i,
			classes;
		for (; i<current_flow_page.index; i++) {
			classes = d(`page${i}`).classList;
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

	function setFlowPagesSize() {
		var proportionW = d('set').clientWidth/100;
		var n = 0;
		var c = current_index();
		$('.flow .page').forEach(function (page, i, arr) {
			if (page.classList.contains('inactive')) {return;}
			page.style.left = proportionW * ( (n < c ? -5*(19-n)-50 : n === c ? 0 : 5*n + 50 ) );
			n++;
		});
	}

	function flowTo(target) {
		if(target){
			current_flow_page.classList.remove('current');
			current_flow_page = target;
			current_flow_page.classList.add('current');
			setFlowPagesSize();
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
		document.body.classList.toggle('flow');
		document.body.classList.add('reflow');
		FLOW = !FLOW;
		if (!FLOW){
			current_flow_page.classList.remove('current');
			first_flow_page = current_flow_page = null;
			setPagesSize();
		} else {
			first_flow_page = current_flow_page = getNextActivePage();
			if (!first_flow_page){return;}
			current_flow_page.classList.add('current');
			setFlowPagesSize(true);
		}
		setTimeout(function () {
			document.body.classList.remove('reflow');
		}, 0);
		chrome.extension.sendRequest({
			action: 'toggleView',
			FLOW: FLOW
		}, function() {});
		setBackGradient();
	}

	function toggleCustomize() {
		window.customize.classList.toggle('open');
	}

	function switchTheme (newTheme, save) {
		document.body.classList.remove(cuurentTheme);
		cuurentTheme = newTheme;
		document.body.classList.add(cuurentTheme);
		save && chrome.extension.sendRequest({
			action: 'switchTheme',
			theme: cuurentTheme
		}, function() {});
	}

	function setBackground(bg) {
		d('container').style['background-image'] = `url(${bg})`;
	}

	function bgChange (event) {
		if (event && event.type === 'paste'){
			setTimeout(bgChange, 1);
			return;
		}
		var bg = $('#background input')[0].value;
		setBackground(bg);
		chrome.extension.sendRequest({
			action: 'setBackground',
			back: bg
		}, function() {});
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
		$('#customize h3')[0].innerText = chrome.i18n.getMessage('theme_label');
		$('#customize h3')[1].innerText = chrome.i18n.getMessage('background_label');
		document.onclick = clicksDelegate;
		function ready(background) {
			back = background;
			slotsList = back.slotsList;
			COLUMNS_COUNT = back.settings.COLUMNS_COUNT;
			ROWS_COUNT = back.settings.ROWS_COUNT;
			var wait = null;
			setPagesSize();
			createPages();
			back.settings.THEME && switchTheme(back.settings.THEME);
			back.settings.BACK && setBackground(back.settings.BACK);
			back.settings.FLOW && toggleDisplay();
			listenMessages();
			window.onresize = function () {
				if (_width !== window.innerWidth || _height !== window.innerHeight) {
					_width = window.innerWidth;
					_height = window.innerHeight;
					clearTimeout(wait);
					wait = setTimeout(FLOW ? setFlowPagesSize : setPagesSize, 100);
				}
			};
			var inputUrl = $('#link_url input')[0];
			inputUrl.onpaste = inputUrl.onkeyup = inputUrl.onchange = urlChange;
			var inputBack = $('#background input')[0];
			inputBack.onpaste = inputBack.onkeyup = inputBack.onchange = bgChange;
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
		chrome.extension.getBackgroundPage().subscribe(ready);
	}

	function listenMessages (){
	chrome.extension.onRequest.addListener(
		function (request, sender, sendResponse) {
			if (sender.id === chrome.i18n.getMessage('@@extension_id')) {
				switch (request.action) {
				case 'updatePage':
					updatePage(request.params.index, null, request.params.thumb);
					break;
				case 'remove':
					removePage(d(`page${request.params.index}`));
					break;
				}
			}
		}
	);
	}

	window.onload = init();

}());