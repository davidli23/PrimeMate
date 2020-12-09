var exons;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message == "send exons") {
    exons = request.exons;
    window.open("results.html");
  }
  if (request.message == "get exons") {
    sendResponse({exons: exons});
  }
});
