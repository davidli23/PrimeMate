$("#start_button")[0].addEventListener('click', onClick);

// Start button in popup
function onClick() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {message: "start"});
	});
}
