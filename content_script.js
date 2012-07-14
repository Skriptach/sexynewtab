var urls = [], thumbs;
try{
	chrome.extension.sendRequest({action: "getSlots"}, function(response) {
		urls = response.urls;
		thumbs = response.thumbs;
		if(!urls.length){
			chrome.extension.sendRequest({action:"subscribe", callback: shotScreen}, function(){});
		}
		else shotScreen();
	});	
}
catch(e){
	console.log(e);
}
window.onload = shotScreen;

function shotScreen(){
	function by_URL(element, index, array){
		return (document.URL == element.url);
	}
	
	if( urls.length && "complete" == document.readyState && urls.indexOf(document.URL) !== -1 ){
		try{
			chrome.extension.sendRequest({action: "refreshThumb"}, function(response) {});
		}
		catch(e){
			console.log(e);
			return;
		}
	}
}