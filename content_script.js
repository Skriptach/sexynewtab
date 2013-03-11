function shotScreen(){
	try{
		chrome.extension.sendRequest({action: "refreshThumb"}, function(response) {});
	}
	catch(e){
		console.log(e);
	}
}

if("complete" == document.readyState){
	shotScreen();
} else window.addEventListener('load', shotScreen);
