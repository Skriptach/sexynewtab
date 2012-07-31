/*jslint sloppy:true, nomen:true, browser:true, plusplus :true */
/*globals chrome console localStorage set optionsbutton selectRows selectCols options edit link_url footer */
(function () {
    var COLUMNS_COUNT = 4,
        ROWS_COUNT = 3,
        DELTA = 10,
        PAGE_WIDTH,
        PAGE_HEIGHT,
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
        grad_radius,
        currentItem;

    function d(id) {
        return document.getElementById(id);
    }

    try {
        urls = chrome.extension.getBackgroundPage().urls;
        thumbs = chrome.extension.getBackgroundPage().thumbs;
    } catch (e) {
        console.log(e);
        return;
    }
    if (!!localStorage.rows) {
        ROWS_COUNT = +localStorage.rows;
    }
    if (!!localStorage.col) {
        COLUMNS_COUNT = +localStorage.col;
    }
    function pagesNumberChanged(e, id) {
        var s = e.currentTarget;
        if (id === 0) {
            ROWS_COUNT = s.options[s.selectedIndex].value;
            localStorage.rows = ROWS_COUNT;
        } else {
            COLUMNS_COUNT = s.options[s.selectedIndex].value;
            localStorage.col = COLUMNS_COUNT;
        }
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
                    //prevPage = dragPage;
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
        dragPage.classList.remove("draged");
        dragPage.style.left = pagePosX;
        dragPage.style.top = pagePosY;
        dragPage.style.width = '';
        dragPage.style.height = '';
        chrome.extension.getBackgroundPage().swap(lastPosition, dragPage.index);
        lastPosition = null;
    }
    function PrepareDrag(e) {
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
                showEditForm(currentEditPage);
            }, 300);
        }
    }
    function removePage(page) {
        page.firstElementChild.firstElementChild.removeAttribute('href');
        page.classList.add('inactive');
        page.style.webkitTransform = "scale(0.3)";
        var hold = setTimeout(function () {
            //page.lastElementChild.lastElementChild.setAttribute('title',slots[i].title);
            page.firstElementChild.firstElementChild.lastElementChild.style['background-image'] = '';
            page.firstElementChild.firstElementChild.lastElementChild.removeAttribute('style');
            page.style.webkitTransform = "scale(1)";
        }, 200);
    }
    function calcSize() {
        var _width = window.innerWidth,
            _height = window.innerHeight,
            PROPORTION = _height / _width,
            setstyle;
        PAGE_WIDTH = (_width - (DELTA * (COLUMNS_COUNT + 1))) / COLUMNS_COUNT;
        PAGE_HEIGHT = PAGE_WIDTH * PROPORTION;
        if (PAGE_HEIGHT * ROWS_COUNT + ((ROWS_COUNT + 1) * DELTA) > _height) {
            PAGE_HEIGHT = (_height - (DELTA * (ROWS_COUNT + 1))) / ROWS_COUNT;
            PAGE_WIDTH = PAGE_HEIGHT / PROPORTION;
        }
        grad_radius = Math.sqrt(PAGE_WIDTH * PAGE_WIDTH / 4 + PAGE_HEIGHT * PAGE_HEIGHT / 3);
    }
    function updatePageThumb(slotIndex, page) {
        if (!page) {
            page = d('page' + slotIndex);
        }
        if (!!urls[slotIndex]) {
            page.firstElementChild.firstElementChild.setAttribute('href', urls[slotIndex]);
            //page.lastElementChild.lastElementChild.setAttribute('title',slots[i].title);
            page.classList.remove('inactive');
            if (thumbs[urls[slotIndex]]) {
                page.firstElementChild.firstElementChild.lastElementChild.style['background-image'] = 'URL(' + thumbs[urls[slotIndex]] + ')';
            }
        }
    }
    function pageClickHandler(event) {
        var page, _left, _top;
        if (event.button === 0) {
            try {
                page = event.target.parentElement.parentElement.parentElement;
            } catch (error) {
                //do nothing. because it seems just any of top elements was clicked.
            }
            if (event.target.className === 'thumbnail' && event.target.hasAttribute('style')) {
                _left = set.offsetLeft;
                _top = set.offsetTop;
                page.style.zIndex = 1000;
                page.style.left = -_left;
                page.style.top = -_top;
                page.style.width = window.innerWidth;
                page.style.height = window.innerHeight;
                event.target.style['-webkit-border-radius'] = '0';
            } else if (page && page.classList.contains('page')) { toggleEditForm(page); }
        }
    }
    function createPages() {
        var thumbnailnode = document.createElement("div"),
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
                    '<div class="logo"></div>'+
                    '<div class="thumbnail"></div>'+
                '</a>'+
            '</div>';
        thumbnailnode.setAttribute("class", "page inactive");
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
        edit.onclick = function (e) { e.stopPropagation(); };
        edit_cancel.onclick = function (e) {
            hideEditForm();
        };
        edit_ok.onclick = editPage;
        tabs.onclick = expandNode;
        bookmarks.onclick = expandNode;
        history.onclick = expandNode;
        document.onclick = pageClickHandler;
        document.ondragstart = PrepareDrag;
    }
    function setPagesSize() {
        calcSize();
        var i, j, index, leftPos, topPos, page, rules = '';
        backgradient.innerHTML =
        '.backgradient {\n' +
            '\tbackground-image: -webkit-gradient(radial, center top, 5, center 30%, ' +
                    grad_radius + ', from(#000065), to(#000010))\n' +
            '\t}';
        edit.style.width = PAGE_WIDTH;
        edit.style.height = PAGE_HEIGHT;
        rules +=
        '#set {\n' +
            '\twidth: ' + ((PAGE_WIDTH + DELTA) * COLUMNS_COUNT - DELTA) + 'px;\n' +
            '\theight: ' + ((PAGE_HEIGHT + DELTA) * ROWS_COUNT - DELTA) + 'px;\n' +
        '}\n'+
        '.page {\n' +
            '\twidth: ' + PAGE_WIDTH + 'px;\n' +
            '\theight: ' + PAGE_HEIGHT + 'px;\n' +
            '\t}\n';
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
    function expandNode(e) {
        var node = this.nextElementSibling,
            protocol = /^https?:/,
            i,
            j,
            tabs,
            item;
        if (node.childElementCount) {
            node.style.display = (node.style.display === "none") ? "block" : "none";
        } else {
            chrome.windows.getAll({populate: true}, function (windows) {
                for (i = 0; i < windows.length; i++) {
                    tabs = windows[i].tabs;
                    for (j = 0; j < tabs.length; j++) {
                        if (protocol.test(tabs[j].url)) {
                            item = document.createElement('div');
                            item.style['background-image'] = "URL(" + tabs[j].favIconUrl + ")";
                            item.setAttribute("class", "item");
                            item.tab = tabs[j];
                            item.url = tabs[j].url;
                            item.innerHTML = "<nobr>" + tabs[j].title + "</nobr>";
                            // TODO: delegate
                            item.onclick = function () {
                                if (typeof currentItem === "undefined") {
                                    currentItem = this;
                                } else {
                                    currentItem.firstChild.className = null;
                                    currentItem = this;
                                }
                                this.firstChild.className = "selected";
                                link_url.value = this.url;
                            };
                            node.appendChild(item);
                        }
                    }
                }
            });
            node.style.display = "block";
        }
    }
    function editPage(e) {
        chrome.extension.getBackgroundPage().editPage(currentItem.tab, currentEditPage.index);
        hideEditForm();
    }
    function toggleDisplay() {
        var first_flow_page, current_flow_page, current_index;

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
                    current_index++;
                    return tmp;
                }
            }
        }
        function getPrevActivePage(){
            var tmp = current_flow_page;
            while (tmp = tmp.previousElementSibling){
                if (!tmp.classList.contains('inactive')){
                    current_index--;
                    return tmp;
                }
            }
        }
        function flowNext(nearest) {
            var tmp = nearest();
            if(tmp){
                current_flow_page.classList.remove('current');
                current_flow_page = tmp;
                current_flow_page.classList.add('current');
                first_flow_page.style['margin-left'] = (first_flow_page.index - current_index) * 10 - 40*(first_flow_page != current_flow_page) + '%';
            }
        }
        function scrollFlow(e) {
            if (e.wheelDelta < 0) {
                flowNext(getNextActivePage);
            } else if (e.wheelDelta > 0) {
                flowNext(getPrevActivePage);
            }
        }

        return function(){
            if (main.classList.contains('flow')){
                main.classList.remove('flow');
                current_flow_page.classList.remove('current');
                first_flow_page.style['margin-left'] = '';
                document.onmousewheel = null;
                first_flow_page = current_flow_page = null;
            } else {
                first_flow_page = current_flow_page = getNextActivePage();
                current_flow_page.classList.add('current');
                first_flow_page.style['margin-left'] = '0';
                document.onmousewheel = scrollFlow;
                current_index = first_flow_page.index;
                main.classList.add('flow');
            }
        }
    }
    window.onload = function () {
        var _width = window.innerWidth,
            _height = window.innerHeight,
            styles = document.createElement("style");
        document.head.appendChild(styles.cloneNode(true)).setAttribute('id','backgradient');
        document.head.appendChild(styles.cloneNode(true)).setAttribute('id','tile_style');
        tabs.innerText = chrome.i18n.getMessage("fn_tabs");
        bookmarks.innerText = chrome.i18n.getMessage("fn_bookmarks");
        d('history').innerText = chrome.i18n.getMessage("fn_history");
        edit_cancel.value = chrome.i18n.getMessage("mb_cancal");
        toggle_button.onclick = toggleDisplay();
        function hacks() {
            var wait = null;
            setPagesSize();
            createPages();
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
    optionsbutton.onclick = function () {
        if (!OptionsMenu) {
            selectRows.selectedIndex = ROWS_COUNT - 2;
            selectCols.selectedIndex = COLUMNS_COUNT - 3;
            options.style.display = "block";
            OptionsMenu = !OptionsMenu;
        } else {
            options.style.display = "none";
            OptionsMenu = !OptionsMenu;
        }
    };

    function reportError(type) {
        var mess, line;
        if (reports === null) {
            mess = document.createElement("div");
            reports = footer.appendChild(mess);
        }
        line = document.createElement("p");
        line.innerText = chrome.i18n.getMessage(type);
        reports.appendChild(line);
    }
    chrome.extension.onRequest.addListener(
        function (request, sender, sendResponse) {
            if (sender.id === chrome.i18n.getMessage('@@extension_id')) {
                switch (request.action) {
                case "updatePageThumb":
                    updatePageThumb(request.params.index);
                    break;
                case "showEditForm":
                    toggleEditForm(d('page'+request.params.index));
                    break;
                case "remove":
                    removePage(d('page'+request.params.index));
                    break;
                }
            }
        }
    );
}());