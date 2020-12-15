var exons;
var gene;
var url;
var introns;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.message == 'send exons') {
		if (request.exons.length > 0) {
			exons = request.exons;
			gene = request.gene;
			url = request.url;
			introns = request.introns;
			window.open('results.html');
		} else {
			alert('No exons found');
		}
	}
	if (request.message == 'get exons') {
		sendResponse({ exons: exons, gene: gene, url: url, introns: introns });
	}
});
