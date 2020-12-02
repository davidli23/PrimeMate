// List of blocked sites
blockedSites = [];

time_left = 0;

paused = false;

// Listens for starting session and releasing blocked sites
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == "start session") {
		time_left = Math.floor(request.time*600);
		blockWebsites(request.sites);
		runTimer();
	}
	if (request.message == "get blocked sites") {
      	sendResponse({sites: blockedSites, paused: paused});
	}
	if (request.message == "get tick") {
		sendResponse({time: time_left});
	}
	if (request.message == "get paused") {
		sendResponse({paused: paused});
	}
	if (request.message == "play pause") {
		pause();
	}
});

// Starts timer
function runTimer() {
	var timer = setInterval(function() {
		if (paused) {
			clearInterval(timer);
		}
		if (time_left < 0) {
			chrome.runtime.sendMessage({message: "close popup"});
			window.alert("Time for a break! You've earned it!");
			chrome.browserAction.setPopup({popup: "popup.html"});
				blockedSites = [];
			clearInterval(timer);
		}
		else if (time_left%10 == 0)  {
			chrome.runtime.sendMessage({message: "tick",
				time: time_left});
		}
		time_left -= 1;
		console.log(time_left)
	}, 100);
}

// Initializes blocked sites array
function blockWebsites(sites) {
	sites.forEach(function(site) {
		blockedSites.push(site);
	});
}

function pause() {
	chrome.runtime.sendMessage({message: "switch pause", paused: paused});
	if (!paused) {
		paused = true;
	}
	else {
		paused = false;
		runTimer();
	}
}