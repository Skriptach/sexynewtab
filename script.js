COLUMNS_COUNT=4;
ROWS_COUNT=3;
try{
	var slots = chrome.extension.getBackgroundPage().slots;
}
catch(e){
	console.log(e);
	return;
}
if (!!localStorage["rows"]){
	ROWS_COUNT=localStorage["rows"]-0;}
if (!!localStorage["col"]){
	COLUMNS_COUNT=localStorage["col"]-0;}
DELTA=8;
menuSelectedPage=null;
currentEditPage=null;
OptionsMenu=false;
reports=null;
function pagesNumberChanged(e, id){
	var s=e.currentTarget;
	if (id===0){
	ROWS_COUNT=s.options[s.selectedIndex].value;
	localStorage["rows"]=ROWS_COUNT;
	}else{
		COLUMNS_COUNT=s.options[s.selectedIndex].value;
		localStorage["col"]=COLUMNS_COUNT;
	}
}
var dragPage=null;
var lastPosition=null;

function onDrag(e){
	if( e.screenX > 0 || e.screenY > 0 ){
		var p_left = e.x-_offsetX;
		var p_top = e.y-_offsetY;
		dragPage.style.left=p_left;
		dragPage.style.top=p_top;
		var col=Math.floor((p_left+PAGE_WIDTH/2+DELTA)/(PAGE_WIDTH+DELTA));
		var row=Math.floor((p_top+PAGE_HEIGHT/2+DELTA)/(PAGE_HEIGHT+DELTA));
		var position=row*COLUMNS_COUNT+col+1;
		if ((position>0)&&(position<=ROWS_COUNT*COLUMNS_COUNT)&&(position!=dragPage.index)){
			if( Math.abs(p_left-col*(PAGE_WIDTH+DELTA))<PAGE_WIDTH/2 ){
				var TargetPosX=pagePosX, TargetPosY=pagePosY;
				var modificator = (position>dragPage.index)? 1: -1;
				var i = dragPage.index;
				var prevPage = dragPage;
				do{
					i+=modificator;
					var moved=d('page'+i);
					var tmpPosX = parseFloat(moved.style.left);
					var tmpPosY = parseFloat(moved.style.top);
					moved.style.left = TargetPosX;
					moved.style.top = TargetPosY;
					TargetPosX = tmpPosX;
					TargetPosY = tmpPosY;
					moved.setAttribute('id','page'+String(i-modificator));
					moved.index=i-modificator;
				}while( i != position );
				pagePosX = TargetPosX;
				pagePosY = TargetPosY;
				dragPage.index=position;
				dragPage.setAttribute('id','page'+position);
			}
		}
	}
}
function stopDrag(e){
	document.ondrag=null;
	document.ondragend=null;
	dragPage.ondragover=null;
	dragPage.style.zIndex=null;
	dragPage.className='page';
	dragPage.style.left=pagePosX;
	dragPage.style.top=pagePosY;
	dragPage.style.width=parseFloat(dragPage.style.width)-15;
	dragPage.style.height=parseFloat(dragPage.style.height)-15;
	chrome.extension.getBackgroundPage().swap(lastPosition, dragPage.index);
	lastPosition = null;
}
function PrepareDrag(e){
	hideContextMenu();
	dragPage=e.target.parentElement.parentElement;
	if(dragPage.getAttribute('class') === 'page'){
		lastPosition=dragPage.index;
		dragPage.className='page draged';
		dragPage.style.zIndex=1000;
		pagePosX=parseFloat(dragPage.style.left);
		pagePosY=parseFloat(dragPage.style.top);
		_offsetX=e.x-pagePosX;
		_offsetY=e.y-pagePosY;
		dragPage.style.width=parseFloat(dragPage.style.width)+15;
		dragPage.style.height=parseFloat(dragPage.style.height)+15;
		document.ondrag=onDrag;
		document.ondragend=stopDrag;
	}
}
function removePage(page){
	chrome.extension.getBackgroundPage().remove(page.index);
	page.style.webkitTransform="scale(0.3)";
	var hold=setTimeout(function(){
		//page.thumb=null;
		page.firstElementChild.lastElementChild.removeAttribute('href');
		//page.lastElementChild.lastElementChild.setAttribute('title',slots[i].title);
		page.firstElementChild.lastElementChild.lastElementChild.style['background']='';
		page.onclick=function(e){
					if(e.button===0){
						toggleEditForm(e.currentTarget);
					}
				};
		page.oncontextmenu=null;
		page.style.webkitTransform="scale(1)";
	}, 200);
}
function hideContextMenu(){
   document.onmousedown=null;
   menu.style['visibility']='hidden';
   menuSelectedPage=null;
}
function menuClick(id){
	if (id===0){
		//Edit
		toggleEditForm(menuSelectedPage);
	} else if (id==1){
		//chrome.tabs.create({url: menuSelectedPage.thumb.url, selected:true})
	} else if (id==2){
		removePage(menuSelectedPage);
	}
	hideContextMenu();
}
function d(id){
	return document.getElementById(id);
}
function oncontextpage(e){
	menuSelectedPage=e.currentTarget;
	var _left=e.x+1;
	var _top=e.y+1;
	if(_left+menu.offsetWidth>window.innerWidth){_left-=menu.offsetWidth;}
	if(_top+menu.offsetHeight>window.innerHeight){_top-=menu.offsetHeight;}
	menu.style.left=_left;
	menu.style.top=_top;
	menu.style['visibility']='visible';
	document.onmousedown=hideContextMenu;
	e.preventDefault();
}
window.onload=function(){
	var _width=window.innerWidth;
	var _height=window.innerHeight;
	function hacks(){
		window.onresize=function(){
			if (!set.hasChildNodes()){
				createPages();
			}
			else setPagesSize();
		};
		if (_width<=1 || _height<=1){
			console.log("Hack is here!");// Ещё иногда, при открытии таба, объект window имеет неправильный размер
			//window.onresize();				// <- Поэтому используем "костыль".
			reportError("window_size");
		}else createPages();
	}
	try{
		if(!slots.length){
			chrome.extension.getBackgroundPage().subscribe(hacks);
		}
		else hacks();
	}
	catch(e){
		console.log(e);
		return;
	}
};
optionsbutton.onclick=function(){
	if(!OptionsMenu){
		selectRows.selectedIndex=ROWS_COUNT-2;
		selectCols.selectedIndex=COLUMNS_COUNT - 3;
		options.style.display="block";
		OptionsMenu=!OptionsMenu;
	}
	else{
		options.style.display="none";
		OptionsMenu=!OptionsMenu;}
};
function createPages(){
	calcSize();
	var link=document.createElement("a");
	link.setAttribute("class", "link");
	var bgradient=document.createElement("div");
	bgradient.setAttribute("class", "backgradient");
	link.appendChild(bgradient);
	var logo=document.createElement("div");
	logo.setAttribute("class", "logo");
	link.appendChild(logo);
	var thumbnail=document.createElement("div");
	thumbnail.setAttribute("class", "thumbnail");
	link.appendChild(thumbnail);
	var pagefliper=document.createElement("div");
	pagefliper.setAttribute("class", "fliper");
	pagefliper.appendChild(link);
	var thumbnailnode=document.createElement("div");
	thumbnailnode.setAttribute("class", "page");
	thumbnailnode.appendChild(pagefliper);
	var styles=document.styleSheets[1];
	for(var i=0;i<styles.cssRules.length;i++){
		if(styles.cssRules[i].selectorText.indexOf(".backgradient") > -1){
		styles.cssRules[i].style['background']='-webkit-gradient(radial, center top, 5, center 30%, '+
		grad_radius+', from(#000065), to(#000010))';
		}
	}
	var index=1;
	for (var i=0;i<ROWS_COUNT;i++){
		for (var j=0;j<COLUMNS_COUNT;j++){
			var leftPos=(j*(PAGE_WIDTH+DELTA));
			var topPos=(i*(PAGE_HEIGHT+DELTA));
			var page=thumbnailnode.cloneNode(true);
			page.setAttribute('id','page'+index);
			page.style.width=PAGE_WIDTH;
			page.style.height=PAGE_HEIGHT;
			page.style.left=leftPos;
			page.style.top=topPos;
			page.index=index;
			set.appendChild(page);
			//page.draggable=true;
			updatePageThumb(index, page);
			index++;
		}
	}
	//document.ondragstart = PrepareDrag;
	index--;
	d('page' + index).firstElementChild.appendChild(edit);
	edit.onclick = function(e){e.stopPropagation();};
	edit_cancel.onclick=function(e){
		hideEditForm(currentEditPage);
	};
	edit_ok.onclick=editPage;
	tabs.onclick=expandNode;
	bookmarks.onclick=expandNode;
	history.onclick=expandNode;
	document.onclick = pageClickHandler;
	document.ondragstart=PrepareDrag;
}
function pageClickHandler(event){
	var page, _left, _top;
	if(event.button===0){
		try{
			page = event.target.parentElement.parentElement.parentElement;
		} catch(error){
			//do nothing. because it seems just was clicked any of top elements
		}
		if (event.target.hasAttribute('style')){
			_left=set.offsetLeft;
			_top=set.offsetTop;
			page.style.zIndex=1000;
			page.style.left=-_left;
			page.style.top=-_top;
			page.style.width=window.innerWidth;
			page.style.height=window.innerHeight;
			event.target.style['-webkit-border-radius']='0';
		} else {toggleEditForm(page);}
	}
}
function showEditForm(page){
	page.appendChild(edit);
	//edit.style.display="block"
	page.className = 'page turned';
	//edit.style.left=parseInt(page.style.left)+set.offsetLeft;
	//edit.style.top=parseInt(page.style.top)+set.offsetTop;
}
function hideEditForm(page){
	//edit.style.display=null;
	page.className = 'page';
	currentEditPage=null;
}
function toggleEditForm(page){
	if ( !currentEditPage){
		currentEditPage = page;
		editPageId=page.index;
		showEditForm(currentEditPage);
	}
	if( currentEditPage && page != currentEditPage ){
		hideEditForm(currentEditPage);
		currentEditPage = page;
		editPageId=page.index;
		var hold=setTimeout(function(){
			showEditForm(currentEditPage);
			}, 1000);
	}
}
function updatePageThumb(slotIndex, page){
	if (null === page){
		page = d('page'+slotIndex);
	}
	if (null!==slots[slotIndex].url){
		page.oncontextmenu=oncontextpage;
		page.firstElementChild.lastElementChild.setAttribute('href',slots[slotIndex].url);
		//page.lastElementChild.lastElementChild.setAttribute('title',slots[i].title);
		page.firstElementChild.lastElementChild.lastElementChild.style['background']='URL('+slots[slotIndex].thumb+')';
	}
}
function setPagesSize(){
calcSize();
var styles=document.styleSheets[1];
for(var i=0;i<styles.cssRules.length;i++){
	if(styles.cssRules[i].selectorText.indexOf(".backgradient")>-1){
	styles.cssRules[i].style['background']='-webkit-gradient(radial, center top, 5, center 30%, '+
	grad_radius+', from(#000065), to(#000010))';
	}
}
var index=1;
for (var i=0;i<ROWS_COUNT;i++){
	for (var j=0;j<COLUMNS_COUNT;j++){
		var leftPos=(j*(PAGE_WIDTH+DELTA));
		var topPos=(i*(PAGE_HEIGHT+DELTA));
		var pagestyle=d('page'+index).style;
		pagestyle.left=leftPos;
		pagestyle.top=topPos;
		pagestyle.width=PAGE_WIDTH;
		pagestyle.height=PAGE_HEIGHT;
		index++;
	}}
}
function calcSize(){
	var _width=window.innerWidth;
	var _height=window.innerHeight;
	var PROPORTION=_height/_width;
	PAGE_WIDTH=(_width-(DELTA*(COLUMNS_COUNT+1)))/COLUMNS_COUNT;
	PAGE_HEIGHT=PAGE_WIDTH*PROPORTION;
	if (PAGE_HEIGHT*ROWS_COUNT+((ROWS_COUNT+1)*DELTA)>_height){
		PAGE_HEIGHT=(_height-(DELTA * (ROWS_COUNT+1)))/ROWS_COUNT;
		PAGE_WIDTH=PAGE_HEIGHT/PROPORTION;}
	var setstyle=set.style;
	setstyle.width=(PAGE_WIDTH+DELTA)*(COLUMNS_COUNT)-DELTA;
	setstyle.height=(PAGE_HEIGHT+DELTA)*(ROWS_COUNT)-DELTA;
	grad_radius=Math.sqrt(PAGE_WIDTH*PAGE_WIDTH/4+PAGE_HEIGHT*PAGE_HEIGHT/3);
	edit.style.width=PAGE_WIDTH;
	edit.style.height=PAGE_HEIGHT;
}
function expandNode(e){
	var node=this.nextElementSibling;
	var protocol = /^https?:/;
	if(node.childElementCount){
		node.style.display = (node.style.display == "none") ? "block" : "none";
	}
	else{
		chrome.windows.getAll({populate:true},function(windows){
			for(var i=0;i<windows.length;i++){
				var tabs=windows[i].tabs;
				for (var j=0;j<tabs.length;j++) {
					if ( protocol.test(tabs[j].url) ){
						var item=document.createElement('div');
						item.style['background-image']="URL("+tabs[j].favIconUrl+")";
						item.setAttribute("class", "item");
						item.tabId=tabs[j].id;
						item.url=tabs[j].url;
						item.innerHTML="<nobr>"+tabs[j].title+"</nobr>";
						// TODO: delegate
						item.onclick=function(){
							if(typeof currentItem == "undefined"){
								currentItem=this;}
							else{
								currentItem.firstChild.className = null;
								currentItem=this;
							}
							this.firstChild.className = "selected";
							link_url.value = this.url;
						};
						node.appendChild(item);
					}
				}
			}
		});
		node.style.display="block";
	}
}
function editPage(e){
	chrome.extension.getBackgroundPage().editPage(currentItem.tabId, editPageId);
	hideEditForm(currentEditPage);
}

function reportError(type){
	if(reports===null){
		var mess=document.createElement("div");
		reports=footer.appendChild(mess);
	}
	var line = document.createElement("p");
	line.innerText=chrome.i18n.getMessage(type);
	reports.appendChild(line);
}
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if(sender.id){
      switch (request.action){
        case "updatePageThumb":
          updatePageThumb(request.params.index);
        break;
      }
    }
  });