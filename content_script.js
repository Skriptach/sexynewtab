var slots = [];
try{
	chrome.extension.sendRequest({action: "getSlots"}, function(response) {
		slots = response.slots;
		if(!slots.length){
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
	
	if( slots.length && "complete" == document.readyState && slots.slice(1,-1).filter(by_URL).length ){
		try{
			chrome.extension.sendRequest({action: "refreshThumb"}, function(response) {});
		}
		catch(e){
			console.log(e);
			return;
		}
	}
}