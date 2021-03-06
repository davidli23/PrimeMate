// Event listener for popup start button click
chrome.runtime.onMessage.addListener(function (request) {
	if (request.message == 'start') {
		run(request.params);
	}
});

function run(params) {
	// exons is wrapped set of each exon element
	let exons = $('.bg2 .text_sequence.exon_sequence');
	// Array of exon strings
	let exonsText = [];
	exons.each(function () {
		exonsText.push(this.textContent.trim().replace(/(\r\n|\n|\r)/gm, ''));
	});

	let lenInd = -1;
	$('#ensembl_panel_1')
		.find('.ss_header')
		.children()
		.each(function (index) {
			if ($(this).attr('title') == 'Length') {
				lenInd = index;
			}
		});

	let introns = [];
	$('.bg1').each(function () {
		introns.push($(this).children()[lenInd].textContent);
	});
	console.log(introns);

	let gene = $('title').text().split(' ')[1];
	let url = window.location.href;

	chrome.runtime.sendMessage({
		message: 'send exons',
		gene: gene,
		url: url,
		exons: exonsText,
		introns: introns,
		params: params,
	});
}
