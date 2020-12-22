var exons;
var gene;
var url;
var introns;
var params;
var allPrimerPairs;
var primerPairs = [];

var selectedPrimer = -1;
var numberPrimersDisplayed = 10;

var activePage = 1;
var totalPages;

var groupSize = 5 * numberPrimersDisplayed;
var groupInd = 0;

chrome.runtime.sendMessage({ message: 'get exons' }, function (response) {
	exons = response.exons;
	gene = response.gene;
	url = response.url;
	introns = response.introns;
	params = response.params;
	allPrimerPairs = calculate(exons, params);
	groupInd = addGroup(primerPairs, allPrimerPairs, groupInd, groupSize);
	totalPages = Math.ceil(primerPairs.length / numberPrimersDisplayed);
	console.log(primerPairs);
	updatePage();
});

// Called when the page is first loaded
function updatePage() {
	// Update properties, switch from loading screen
	$('title').text('Results: ' + gene);
	$('#data').attr('hidden', false);
	$('#loading').attr('hidden', true);
	// Add gene link
	let geneLink = $('#gene-link');
	geneLink.text('(' + gene + ')');
	geneLink.attr('href', url);

	// show more button function
	$('#show-more').click(function () {
		let selectedPage = totalPages;
		groupInd = addGroup(primerPairs, allPrimerPairs, groupInd, groupSize);
		totalPages = Math.ceil(primerPairs.length / numberPrimersDisplayed);
		updatePages(selectedPage);
	});

	initializeSliders();

	// Add exons to exon table;
	exons.forEach(function (exon, exonInd) {
		let exonElement = $('<td></td>');
		exonElement.attr('id', 'exon' + (exonInd + 1).toString());
		exonElement.append($("<span class='pre_text'></span>"));
		exonElement.append($("<span class='high_text'></span>"));
		exonElement.append($("<span class='post_text'></span>"));
		exonElement.find('.pre_text').text(exon);

		let exonRow = $('<tr></tr>');
		exonRow.attr('id', 'exon_row' + (exonInd + 1).toString());
		exonRow.append($('<td>' + (exonInd + 1).toString() + '</td>'));
		exonRow.append(exonElement);
		$('#exon_table').append(exonRow);

		if (exonInd < exons.length - 1) {
			let intronRow = $('<tr></tr>');
			intronRow.append($('<td></td>'));
			intronRow.append(
				$('<td>Intron (length: ' + introns[exonInd + 1] + ')</td>')
			);
			$('#exon_table').append(intronRow);
		}
	});

	// Add primers to display
	for (let i = 0; i < numberPrimersDisplayed; i++) {
		createPrimer(primerPairs[i], i);
	}

	// Check if need less pages
	for (let i = 2; i <= 5; i++) {
		if (numberPrimersDisplayed * (i - 1) > primerPairs.length) {
			$('#page-item-' + i.toString()).attr('hidden', true);
		}
	}

	// Add click function to primer pair pages
	$('.page-link').click(function () {
		// Gets the selected page
		let selectedPageText = $(this).text();
		let selectedPage = 0;
		if (selectedPageText == '<') {
			selectedPage = activePage - 1;
		} else if (selectedPageText == '>') {
			selectedPage = activePage + 1;
		} else if (selectedPageText == '<<') {
			selectedPage = 1;
		} else if (selectedPageText == '>>') {
			selectedPage = totalPages;
		} else {
			selectedPage = parseInt(selectedPageText);
		}

		updatePages(selectedPage);
	});
}

// Create cards in primer accordion
function createPrimer(primerPair, index) {
	let i = index.toString();
	let primerPairElement = $(
		"<div class='card' id='primerPair" +
			i +
			"' style='margin-bottom:8px'></div>"
	);
	let cardHeader = $(
		"<div class='card-header' id='primerHeading" +
			i +
			"' style='padding:6px 8px'></div>'"
	);
	let cardHeaderRow = $("<div class='row'></div>");
	cardHeader.append(cardHeaderRow);
	primerPairElement.append(cardHeader);
	let primerPairBtn = $(
		"<button class='btn btn-link btn-block text-left collapsed' type='button' id = 'headerBtn" +
			i +
			"'data-toggle='collapse' data-target='#primerText" +
			i +
			"' aria-expanded='false' aria-controls='primerText" +
			i +
			"' style='padding: 4px 6px; width: 85%'>Primer Pair " +
			(index + 1).toString() +
			'</button>'
	);
	primerPairBtn.click(function () {
		highlightPrimerPair(index, !primerPairBtn.hasClass('collapsed'));
	});
	cardHeaderRow.append(primerPairBtn);
	let primerPairFav = $(
		'<button class="btn fav-btn shadow-none">&#9734;</button>'
	);
	primerPairFav.click(function () {
		if (!primerPair.favorite) {
			primerPairFav.html('&#9733;');
			primerPairFav.addClass('fav-btn-active');
			primerPair.favorite = true;
		} else {
			primerPairFav.html('&#9734;');
			primerPairFav.removeClass('fav-btn-active');
			primerPair.favorite = false;
		}
	});
	cardHeaderRow.append(primerPairFav);
	let primerPairText = $(
		"<div id='primerText" +
			i +
			"' class='primer-text collapse' aria-labelledby='primerHeading" +
			i +
			"' data-parent='#primers'></div>"
	);
	primerPairElement.append(primerPairText);
	let primerPairBody = $("<div class='card-body' style='padding:8px'></div>");
	primerPairBody.append(primerPairInfo(primerPair));
	primerPairText.append(primerPairBody);
	$('#primers').append(primerPairElement);
}

function initializeSliders() {
	$(document).on('click', '#sortMenu', function (e) {
		e.stopPropagation();
	});
	$('#sort-tempDiff-val').html($('#sort-tempDiff').val());
	$('#sort-tempDiff').on('input change', () => {
		$('#sort-tempDiff-val').html($('#sort-tempDiff').val());
	});
	$('#sort-indTemp-val').html($('#sort-indTemp').val());
	$('#sort-indTemp').on('input change', () => {
		$('#sort-indTemp-val').html($('#sort-indTemp').val());
	});
	$('#sort-length-val').html($('#sort-length').val());
	$('#sort-length').on('input change', () => {
		$('#sort-length-val').html($('#sort-length').val());
	});
	$('#sort-GCContent-val').html($('#sort-GCContent').val());
	$('#sort-GCContent').on('input change', () => {
		$('#sort-GCContent-val').html($('#sort-GCContent').val());
	});
	$('#sort-GCClamp-val').html($('#sort-GCClamp').val());
	$('#sort-GCClamp').on('input change', () => {
		$('#sort-GCClamp-val').html($('#sort-GCClamp').val());
	});
	$('#sortBtn').click(function () {
		highlightPrimerPair(selectedPrimer, true);
		selectedPrimer = -1;

		$('#sortMenu').dropdown('toggle');

		$('#sorting-loading').attr('hidden', false);
		$('#primers').attr('hidden', true);
		$('#nav-bar').attr('hidden', true);
		setTimeout(function () {
			$('#sorting-loading').attr('hidden', true);
			$('#primers').attr('hidden', false);
			$('#nav-bar').attr('hidden', false);
		}, 600);

		let total =
			parseInt($('#sort-tempDiff').val()) +
			parseInt($('#sort-indTemp').val()) +
			parseInt($('#sort-length').val()) +
			parseInt($('#sort-GCContent').val()) +
			parseInt($('#sort-GCClamp').val());
		let tempDiffWeight = (100 * parseInt($('#sort-tempDiff').val())) / total;
		let indTempWeight = (100 * parseInt($('#sort-indTemp').val())) / total;
		let lengthWeight = (100 * parseInt($('#sort-length').val())) / total;
		let GCContentWeight = (100 * parseInt($('#sort-GCContent').val())) / total;
		let GCClampWeight = (100 * parseInt($('#sort-GCClamp').val())) / total;
		sortPrimers({
			tempDiff: tempDiffWeight,
			indMeltTemp: indTempWeight,
			indGCContent: GCContentWeight,
			length: lengthWeight,
			clamps: GCClampWeight,
		});
	});
}

// Update page bar
function updatePages(selectedPage) {
	let offset = parseInt($('#page-link-1').text()) - 1;
	if (selectedPage == 1) {
		$('#page-item-prev').addClass('disabled');
		$('#page-item-front').addClass('disabled');
		$('#page-item-next').removeClass('disabled');
		$('#page-item-end').removeClass('disabled');
		$('#show-more').attr('hidden', true);
	} else if (selectedPage == totalPages) {
		$('#page-item-next').addClass('disabled');
		$('#page-item-end').addClass('disabled');
		$('#page-item-prev').removeClass('disabled');
		$('#page-item-front').removeClass('disabled');
		if (groupInd < allPrimerPairs.length) {
			$('#show-more').attr('hidden', false);
		}
	} else {
		$('#page-item-prev').removeClass('disabled');
		$('#page-item-front').removeClass('disabled');
		$('#page-item-next').removeClass('disabled');
		$('#page-item-end').removeClass('disabled');
		$('#show-more').attr('hidden', true);
	}

	for (let i = 1; i <= 5; i++) {
		$('#page-item-' + i.toString()).removeClass('active');
	}

	if (selectedPage <= 3) {
		$('#page-link-1').text(1);
		$('#page-link-2').text(2);
		$('#page-link-3').text(3);
		$('#page-link-4').text(4);
		$('#page-link-5').text(5);
		$('#page-item-' + selectedPage.toString()).addClass('active');
	} else if (selectedPage >= totalPages - 2) {
		if (totalPages == 4) {
			$('#page-link-1').text('1');
			$('#page-link-2').text(2);
			$('#page-link-3').text(3);
			$('#page-link-4').text(4);
			$('#page-item-4').addClass('active');
		} else {
			$('#page-link-1').text(totalPages - 4);
			$('#page-link-2').text(totalPages - 3);
			$('#page-link-3').text(totalPages - 2);
			$('#page-link-4').text(totalPages - 1);
			$('#page-link-5').text(totalPages);
			$('#page-item-' + (selectedPage - totalPages + 5).toString()).addClass(
				'active'
			);
		}
	} else {
		$('#page-link-1').text((selectedPage - 2).toString());
		$('#page-link-2').text((selectedPage - 1).toString());
		$('#page-link-3').text(selectedPage.toString());
		$('#page-link-4').text((selectedPage + 1).toString());
		$('#page-link-5').text((selectedPage + 2).toString());
		$('#page-item-3').addClass('active');
	}
	activePage = selectedPage;
	updatePrimers();
}

// Update primers loaded in accordion
function updatePrimers() {
	highlightPrimerPair(selectedPrimer, true);
	selectedPrimer = -1;
	for (let i = 0; i < numberPrimersDisplayed; i++) {
		let primerNumber = (activePage - 1) * numberPrimersDisplayed + i;
		if (primerNumber >= primerPairs.length) {
			let primerPair = $('#primerPair' + i.toString());
			primerPair.attr('hidden', true);
			let primerText = $('#primerText' + i.toString());
			primerText.collapse('hide');
		} else {
			let primerPair = $('#primerPair' + i.toString());
			primerPair.attr('hidden', false);
			let primerPairBtn = $('#headerBtn' + i.toString());
			primerPairBtn.text('Primer Pair ' + (primerNumber + 1).toString());
			primerPairBtn.off('click').on('click', function () {
				highlightPrimerPair(primerNumber, !primerPairBtn.hasClass('collapsed'));
			});
			let primerPairFav = primerPair.find('.fav-btn');
			if (!primerPairs[primerNumber].favorite) {
				primerPairFav.html('&#9734;');
				primerPairFav.removeClass('fav-btn-active');
			} else {
				primerPairFav.html('&#9733;');
				primerPairFav.addClass('fav-btn-active');
			}
			primerPairFav.off('click').on('click', function () {
				if (!primerPairs[primerNumber].favorite) {
					primerPairFav.html('&#9733;');
					primerPairFav.addClass('fav-btn-active');
					primerPairs[primerNumber].favorite = true;
				} else {
					primerPairFav.html('&#9734;');
					primerPairFav.removeClass('fav-btn-active');
					primerPairs[primerNumber].favorite = false;
				}
			});
			let primerText = $('#primerText' + i.toString());
			primerText.collapse('hide');
			primerText
				.find('.card-body')
				.find('div')
				.replaceWith(primerPairInfo(primerPairs[primerNumber]));
		}
	}
}

// Highlight primer in exon function
function highlightPrimerPair(primerIndex, remove) {
	if (!$('.primer-text').hasClass('collapsing')) {
		let primerPair = primerPairs[primerIndex];
		if (remove || selectedPrimer != primerIndex) {
			if (selectedPrimer >= 0) {
				let selectedExon = primerPairs[selectedPrimer].exon;
				let fExonElement = $('#exon' + selectedExon.toString());
				let fExonText = exons[selectedExon - 1];
				let rExonElement = $('#exon' + (selectedExon + 1).toString());
				let rExonText = exons[selectedExon];
				fExonElement.find('.pre_text').text(fExonText);
				fExonElement.find('.high_text').text('');
				fExonElement.find('.post_text').text('');
				rExonElement.find('.pre_text').text(rExonText);
				rExonElement.find('.high_text').text('');
				rExonElement.find('.post_text').text('');
			}
			if (!remove) {
				let fExonElement = $('#exon' + primerPair.exon.toString());
				let fExonText = exons[primerPair.exon - 1];
				let rExonElement = $('#exon' + (primerPair.exon + 1).toString());
				let rExonText = exons[primerPair.exon];
				fExonElement
					.find('.pre_text')
					.text(fExonText.substring(0, primerPair.fInd));
				fExonElement
					.find('.high_text')
					.text(
						fExonText.substring(
							primerPair.fInd,
							primerPair.fInd + primerPair.fLen
						)
					);
				fExonElement
					.find('.post_text')
					.text(fExonText.substring(primerPair.fInd + primerPair.fLen));
				rExonElement
					.find('.pre_text')
					.text(rExonText.substring(0, primerPair.rInd));
				rExonElement
					.find('.high_text')
					.text(
						rExonText.substring(
							primerPair.rInd,
							primerPair.rInd + primerPair.rLen
						)
					);
				rExonElement
					.find('.post_text')
					.text(rExonText.substring(primerPair.rInd + primerPair.rLen));
			}
			selectedPrimer = primerIndex;
			if (remove) {
				selectedPrimer = -1;
			}
		}
	}
}

// Create info element for primer pair
function primerPairInfo(primerPair) {
	let fSelfComp = primerPair.fHairpin;
	let rSelfComp = primerPair.rHairpin;
	let dimerization = primerPair.dimer;

	let body = $('<div ></div>');
	let prop1 = $('<div></div>');
	prop1.append(
		$(
			"<div class='font-weight-bold' style='font-size:14px'>Forward (Exon " +
				primerPair.exon.toString() +
				')</div>'
		)
	);
	prop1.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>" +
				primerPair.fPrimer +
				'</div>'
		)
	);
	body.append(prop1);
	let prop2 = $('<div></div>');
	prop2.append(
		$(
			"<div class='font-weight-bold' style='font-size:14px'>Reverse (Exon " +
				(primerPair.exon + 1).toString() +
				')</div>'
		)
	);
	prop2.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>" +
				primerPair.rPrimer +
				'</div>'
		)
	);
	body.append(prop2);
	let prop8 = $('<div></div>');
	prop8.append(
		$("<div class='font-weight-bold' style='font-size:14px'>Length (bp)</div>")
	);
	prop8.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>for: " +
				primerPair.fLen.toString() +
				' | rev: ' +
				primerPair.rLen.toString() +
				' | total: ' +
				(primerPair.fLen + primerPair.dist + primerPair.rLen).toString() +
				'</div>'
		)
	);
	body.append(prop8);
	let prop9 = $('<div></div>');
	prop9.append(
		$(
			"<div class='font-weight-bold' style='font-size:14px'>Melting Temp (ºC) (Basic)</div>"
		)
	);
	prop9.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>for: " +
				primerPair.fMeltTempBasic.toFixed(1).toString() +
				' | rev: ' +
				primerPair.rMeltTempBasic.toFixed(1).toString() +
				' | diff: ' +
				primerPair.meltTempDiffBasic.toFixed(2).toString() +
				'</div>'
		)
	);
	body.append(prop9);
	let prop3 = $('<div></div>');
	prop3.append(
		$(
			"<div class='font-weight-bold' style='font-size:14px'>Melting Temp (ºC) (Salt Adjusted)</div>"
		)
	);
	prop3.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>for: " +
				primerPair.fMeltTempSalt.toFixed(1).toString() +
				' | rev: ' +
				primerPair.rMeltTempSalt.toFixed(1).toString() +
				' | diff: ' +
				primerPair.meltTempDiffSalt.toFixed(2).toString() +
				'</div>'
		)
	);
	body.append(prop3);
	let prop4 = $('<div></div>');
	prop4.append(
		$("<div class='font-weight-bold' style='font-size:14px'>G/C Content</div>")
	);
	prop4.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>for: " +
				primerPair.fPercentGC.toFixed(1).toString() +
				'% | rev: ' +
				primerPair.rPercentGC.toFixed(1).toString() +
				'%</div>'
		)
	);
	body.append(prop4);
	let prop5 = $('<div></div>');
	prop5.append(
		$(
			"<div class='font-weight-bold' style='font-size:14px'>Start/End with G/C Pair</div>"
		)
	);
	prop5.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>for: starts-" +
				primerPair.fClamps.starts.toString() +
				', ends-' +
				primerPair.fClamps.ends.toString() +
				'</div>'
		)
	);
	prop5.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>rev: starts-" +
				primerPair.rClamps.starts.toString() +
				', ends-' +
				primerPair.rClamps.ends.toString() +
				'</div>'
		)
	);
	body.append(prop5);
	let prop6 = $('<div></div>');
	prop6.append(
		$("<div class='font-weight-bold' style='font-size:14px'>Hairpin</div>")
	);
	prop6.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>for: " +
				fSelfComp.toString() +
				' | rev: ' +
				rSelfComp.toString() +
				'</div>'
		)
	);
	body.append(prop6);
	let prop7 = $('<div></div>');
	prop7.append(
		$("<div class='font-weight-bold' style='font-size:14px'>Dimerization</div>")
	);
	prop7.append(
		$(
			"<div class='font-italic' style='font-size:12px; text-indent:10%'>" +
				dimerization +
				'</div>'
		)
	);
	body.append(prop7);

	return body;
}

function sortPrimers(weights) {
	allPrimerPairs.forEach(function (primerPair) {
		primerPair.score =
			weights.tempDiff * primerPair.tempDiffScore +
			weights.indMeltTemp * primerPair.indMeltTempScore +
			weights.indGCContent * primerPair.indGCContentScore +
			weights.length * primerPair.lengthScore +
			weights.clamps * primerPair.clampScore;
	});
	allPrimerPairs.sort(function (p1, p2) {
		return p2.score - p1.score;
	});
	primerPairs = [];
	groupInd = addGroup(primerPairs, allPrimerPairs, 0, groupSize);
	totalPages = Math.ceil(primerPairs.length / numberPrimersDisplayed);
	console.log(primerPairs);
	updatePages(1);
}
