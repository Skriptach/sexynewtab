/*jslint sloppy:true, nomen:true, browser:true, plusplus :true */
/*globals chrome console localStorage set optionsbutton selectRows selectCols options edit link_url footer */
(function () {
	var COLUMNS_COUNT = 5,
		ROWS_COUNT = 4,
		DELTA = 10,
		PAGE_WIDTH,
		PAGE_HEIGHT,
		FLOW = false,
		menuSelectedPage = null,
		currentEditPage = null,
		OptionsMenu = false,
		reports = null,
		urls,
		thumbs,
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
			'.page .flipper .edit *': function (event) {toggleEditForm(closest(this, '.page'));},
			'.page .flipper .remove *': clearPage,
			'.page.inactive .flipper a *': function (event) {toggleEditForm(this.parentElement.parentElement);},
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
				prevPage,
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
	function stopDrag(e) {
		document.ondrag = null;
		document.ondragend = null;
		dragPage.ondragover = null;
		dragPage.style.zIndex = null;
		dragPage.classList.remove('draged');
		dragPage.style.left = pagePosX;
		dragPage.style.top = pagePosY;
		dragPage.style.width = '';
		dragPage.style.height = '';
		chrome.extension.getBackgroundPage().swap(lastPosition, dragPage.index);
		lastPosition = null;
	}
	function prepareDrag(e) {
		dragPage = e.target.parentElement.parentElement;
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
		currentEditPage.appendChild(edit);
		$('#edit .header .tab.active')[0].click();
		setTimeout(function () {
			currentEditPage.classList.add('turned');
		}, 10);
	}
	function hideEditForm() {
		currentEditPage.classList.remove('turned');
		currentEditPage = null;
	}
	function toggleEditForm(page) {
		if (!currentEditPage) {
			currentEditPage = page;
			showEditForm();
			return;
		}
		if (currentEditPage && page !== currentEditPage) {
			hideEditForm();
			currentEditPage = page;
			var hold = setTimeout(function () {
				showEditForm();
			}, 300);
		}
	}
	function clearPage (event) {
		chrome.extension.sendRequest({
			action: 'clear',
			index: closest(this, '.page').index
		}, function(response) {});
	}
	function removePage(page) {
		page.firstElementChild.firstElementChild.removeAttribute('href');
		page.classList.remove('fresh');
		page.style.webkitTransform = 'scale(0.3)';
		var hold = setTimeout(function () {
			if (FLOW){
				if (page === first_flow_page){
					first_flow_page = getNextActivePage();
				}
				page.classList.add('deleting');
				flowTo(getNextActivePage() || getPrevActivePage());
				setTimeout(function (argument) {
					page.style['margin-left'] = '';
					page.classList.remove('deleting');
					page.classList.add('inactive');
				}, 500);
			} else {
				page.classList.add('inactive');
			}
			page.firstElementChild.firstElementChild.lastElementChild.style['background-image'] = '';
			page.firstElementChild.firstElementChild.lastElementChild.removeAttribute('style');
			page.style.webkitTransform = 'scale(1)';
			setTimeout(function (argument) {
				page.style.webkitTransform = '';
			}, 10);
		}, 200);
	}
	function calcSize() {
		var _width = window.innerWidth,
			_height = window.innerHeight,
			PROPORTION = _height / _width,
			setstyle;
		PAGE_WIDTH = FLOW ? _width / 2 : (_width - (DELTA * (COLUMNS_COUNT + 1))) / COLUMNS_COUNT;
		PAGE_HEIGHT = FLOW ? _height / 2 : PAGE_WIDTH * PROPORTION;
		if (!FLOW && PAGE_HEIGHT * ROWS_COUNT + ((ROWS_COUNT + 1) * DELTA) > _height) {
			PAGE_HEIGHT = (_height - (DELTA * (ROWS_COUNT + 1))) / ROWS_COUNT;
			PAGE_WIDTH = PAGE_HEIGHT / PROPORTION;
		}
	}
	function updatePageThumb(slotIndex, page, thumb) {
		page = page || d('page' + slotIndex);
		thumb = thumb || thumbs[urls[slotIndex]];
		if (!!urls[slotIndex]) {
			page.firstElementChild.firstElementChild.setAttribute('href', urls[slotIndex]);
			page.classList.remove('inactive');
			if (thumb) {
				page.classList.remove('fresh');
				page.firstElementChild.firstElementChild.lastElementChild.style['background-image'] = 'URL(' + thumb + ')';
			}
		}
	}
	function pageClickHandler(event) {
		var page;
		page = event.target.parentElement.parentElement.parentElement;
		if (main.classList.contains('flow') && !page.classList.contains('current')){
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
				'<button class="edit" title="'+chrome.i18n.getMessage('m_edit') + '"><i class="st-pencil-alt"></i></button>'+
				'<button class="remove" title="'+chrome.i18n.getMessage('m_clear') + '"><i class="st-cancel-4"></i></button>'+
			'</div>';
		thumbnailnode.setAttribute('class', 'page inactive');
		thumbnailnode.insertAdjacentHTML('beforeend', innerHtml);
		index = 0;
		for (i = 0; i < ROWS_COUNT; i++) {
			for (j = 0; j < COLUMNS_COUNT; j++) {
				page = thumbnailnode.cloneNode(true);
				page.setAttribute('id', 'page' + index);
				page.index = index;
				leftPos = j * (PAGE_WIDTH + DELTA);
				topPos = i * (PAGE_HEIGHT + DELTA);
				page.style.left = leftPos;
				page.style.top = topPos;
				pages.appendChild(page);
				updatePageThumb(index, page);
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
			'}'].join('\n');
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
				} else {
					return;
				}
			}
		}
	}
	function switchList (e) {
		$('#edit .header .tab.active')[0].classList.remove('active');
		this.classList.add('active');
		this.id === 'tabs' ? switchToTabs() :
			this.id === 'history' ? switchToHistory() : switchToBookmarks();
	}
	function switchToTabs() {
		var node = $('#edit .list .tree')[0],
			list = document.createDocumentFragment(),
			protocol = /^https?:/,
			i,
			j,
			tabs,
			item;
		[].slice.call(node.children).forEach(function(link){node.removeChild(link);});
		chrome.windows.getAll({populate: true}, function (windows) {
			for (i = 0; i < windows.length; i++) {
				tabs = windows[i].tabs;
				for (j = 0; j < tabs.length; j++) {
					if (protocol.test(tabs[j].url)) {
						item = document.createElement('div');
						tabs[j].favIconUrl && (item.style['background-image'] = 'URL(' + tabs[j].favIconUrl + ')');
						item.setAttribute('class', 'item');
						item.tab = tabs[j];
						item.url = tabs[j].url;
						item.innerHTML = tabs[j].title;
						list.appendChild(item);
					}
				}
			}
			node.appendChild(list);
		});
	}
	function switchToHistory() {
		var node = $('#edit .list .tree')[0],
			list = document.createDocumentFragment(),
			protocol = /^https?:/,
			i,
			tabs,
			item;
		[].slice.call(node.children).forEach(function(link){node.removeChild(link);});
		chrome.history.search({
			text: '',
			startTime: (new Date()).getTime() - 1000 * 60 * 60 * 24 * 7
		}, function (visitItems) {
			for (i = 0; i < visitItems.length; i++) {
				if (protocol.test(visitItems[i].url)) {
					item = document.createElement('div');
					item.style['background-image'] = 'URL(chrome://favicon/' + visitItems[i].url + ')';
					item.setAttribute('class', 'item');
					item.url = visitItems[i].url;
					item.innerHTML = visitItems[i].title || visitItems[i].url;
					list.appendChild(item);
				}
			}
			node.appendChild(list);
		});
	}
	function switchToBookmarks () {
	}
	function selectLink () {
		if (currentItem) {
			currentItem.classList.remove('selected');
		}
		currentItem = this;
		this.classList.add('selected');
		$('#link_url input')[0].value = this.url;
	}
	function editPage(e) {
		chrome.extension.getBackgroundPage().editPage(currentItem.tab, currentEditPage.index);
		hideEditForm();
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
			first_flow_page.style['margin-left'] = (first_flow_page.index - current_index()) * 10 - 20*(first_flow_page != current_flow_page) + '%';
		}
	}
	function scrollFlow(e) {
		if (e.wheelDelta < 0 || e.keyCode === 39) {
			flowTo(getNextActivePage());
		} else if (e.wheelDelta > 0 || e.keyCode === 37) {
			flowTo(getPrevActivePage());
		}
	}

	function toggleDisplay() {
		if (FLOW){
			main.classList.remove('flow');
			current_flow_page.classList.remove('current');
			first_flow_page.style['margin-left'] = '';
			document.onmousewheel = null;
			first_flow_page = current_flow_page = null;
		} else {
			first_flow_page = current_flow_page = getNextActivePage();
			if (!first_flow_page){return;}
			current_flow_page.classList.add('current');
			first_flow_page.style['margin-left'] = '0';
			document.onkeydown = document.onmousewheel = scrollFlow;
			main.classList.add('flow');
		}
		FLOW = !FLOW;
		chrome.extension.sendRequest({
			action: 'toggleView',
			FLOW: FLOW
		}, function(response) {});
		calcSize();
		setBackGradient();
	}
	window.onload = function () {
		var _width = window.innerWidth,
			_height = window.innerHeight,
			styles = document.createElement('style'),
			back;
		container.style.display = 'none';
		document.head.appendChild(styles.cloneNode(true)).setAttribute('id','backgradient');
		document.head.appendChild(styles.cloneNode(true)).setAttribute('id','tile_style');
		$('#tabs span')[0].innerText = chrome.i18n.getMessage('fn_tabs');
		$('#bookmarks span')[0].innerText = chrome.i18n.getMessage('fn_bookmarks');
		$('#history span')[0].innerText = chrome.i18n.getMessage('fn_history');
		document.onclick = clicksDelegate;
		try {
			back = chrome.extension.getBackgroundPage();
		} catch (e) {
			console.log(e);
			return;
		}
		urls = back.urls;
		thumbs = back.thumbs;
		function hacks() {
			var wait = null;
			setPagesSize();
			createPages();
			back.settings.FLOW && toggleDisplay();
			// reflow
			setTimeout(function function_name (argument) {
				container.style.display = '';
			}, 0);
			window.onresize = function () {
				if (_width !== window.innerWidth || _height !== window.innerHeight) {
					_width = window.innerWidth;
					_height = window.innerHeight;
					clearTimeout(wait);
					wait = setTimeout(setPagesSize, 100);
				}
			};
		}
		if (!urls.length) {
			try {
				chrome.extension.getBackgroundPage().subscribe(hacks);
			} catch (e) {
				console.log(e);
				return;
			}
		} else { hacks(); }
	};

	chrome.extension.onRequest.addListener(
		function (request, sender, sendResponse) {
			if (sender.id === chrome.i18n.getMessage('@@extension_id')) {
				switch (request.action) {
				case 'updatePageThumb':
					updatePageThumb(request.params.index, null, request.params.thumb);
					break;
				case 'remove':
					removePage(d('page'+request.params.index));
					break;
				case 'pageIsFresh':
					request.params.indexes.forEach(function(el, i){
						d('page'+el).classList.add('fresh');
					});
					break;
				}
			}
		}
	);
}());