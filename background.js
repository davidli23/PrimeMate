var exons;
var gene;
var url;
var introns;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message == "send exons") {
    exons = request.exons;
    gene = request.gene;
    url = request.url;
    introns = request.introns;
    window.open("results.html");
  }
  if (request.message == "get exons") {
    sendResponse({exons: exons, gene: gene, url: url, introns: introns});
  }
});
