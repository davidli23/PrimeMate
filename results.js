var exons;
var gene;
var url;
var introns;
var params;
var allPrimerPairs;
var primerPairs = [];

var selectedPrimer = null;
var numberPrimersDisplayed = 10;

var activePage = 1;
var totalPages;

var groupSize = 5 * numberPrimersDisplayed;
var groupInd = 0;
var favInd = 1;

var favHighlightNumber = 3;
var favHighlighted = [];

chrome.runtime.sendMessage({ message: 'get exons' }, function (response) {
	exons = response.exons;
	gene = response.gene;
	url = response.url;
	introns = response.introns;
	params = response.params;
	console.log(primerPairs);
	setTimeout(function () {
		allPrimerPairs = calculate(exons, params);
		groupInd = addGroup(primerPairs, allPrimerPairs, groupInd, groupSize);
		totalPages = Math.ceil(primerPairs.length / numberPrimersDisplayed);
		createPage();
		if (primerPairs.length === 0) {
			$('.col-3 .dropdown').attr('hidden', true);
			$('.no-results').removeAttr('hidden');
			$('#nav-bar').attr('hidden', true);
		}
	}, 100);
});

// Called when the page is first loaded
function createPage() {
	// Update properties, switch from loading screen
	$('title').text('Results: ' + gene);
	$('#data').attr('hidden', false);
	$('#loading').attr('hidden', true);
	// Add gene link
	let geneLink = $('#gene-link');
	geneLink.text('(' + gene + ')');
	geneLink.attr('href', url);

	// Switching tabs
	$('#primerTabs li a').click(() => {
		highlightPrimerPair(selectedPrimer, true);
		$('.primer-text').collapse('hide');
		$('.fav-text').collapse('hide');
		$('.copy-btn').attr('hidden', true);
	});

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
		$('#exon-table').append(exonRow);

		if (exonInd < exons.length - 1) {
			let intronRow = $('<tr></tr>');
			intronRow.append($('<td></td>'));
			intronRow.append(
				$('<td>Intron (length: ' + introns[exonInd + 1] + ')</td>')
			);
			$('#exon-table').append(intronRow);
		}
	});

	// Initialize highlighted favorites array
	for (let i = 0; i < favHighlightNumber; i++) {
		favHighlighted.push(null);
	}

	// Add primers to display
	for (
		let i = 0;
		i < Math.min(primerPairs.length, numberPrimersDisplayed);
		i++
	) {
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
		"<div class='card primer-card' id='primerPair" + i + "'></div>"
	);
	let cardHeader = $(
		"<div class='card-header' id='primerHeading" + i + "'></div>'"
	);
	let cardHeaderRow = $("<div class='row'></div>");
	cardHeader.append(cardHeaderRow);
	primerPairElement.append(cardHeader);
	let primerPairBtn = $(
		"<button class='primer-btn btn btn-link btn-block text-left mr-auto collapsed' type='button' id = 'headerBtn" +
			i +
			"'data-toggle='collapse' data-target='#primerText" +
			i +
			"' aria-expanded='false' aria-controls='primerText" +
			i +
			"'>Primer Pair " +
			(index + 1).toString() +
			'</button>'
	);
	primerPairBtn.click(function () {
		highlightPrimerPair(primerPair, !primerPairBtn.hasClass('collapsed'));
		if (!$('.primer-text').hasClass('collapsing')) {
			$('.copy-btn-main').attr('hidden', true);
			if (!primerPairBtn.hasClass('collapsed')) {
				cardHeaderRow.find('.copy-btn').attr('hidden', true);
			} else {
				cardHeaderRow.find('.copy-btn').removeAttr('hidden');
			}
		}
	});
	cardHeaderRow.append(primerPairBtn);
	let primerPairText = $(
		"<div id='primerText" +
			i +
			"' class='primer-text collapse' aria-labelledby='primerHeading" +
			i +
			"' data-parent='#primers'></div>"
	);
	primerPairElement.append(primerPairText);
	let primerPairBody = $("<div class='card-body'></div>");
	primerPairBody.append(primerPairInfo(primerPair));
	primerPairText.append(primerPairBody);

	let copyBtn = $(
		'<button class="copy-btn copy-btn-main shadown-none align-middle" data-toggle="tooltip" data-placement="top" data-trigger="click" title="Copied" hidden>' +
			'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard align-middle" viewBox="0 0 16 16">' +
			'<path fill-rule="evenodd" d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>' +
			'<path fill-rule="evenodd" d="M9.5 1h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>' +
			'</svg></button>'
	);
	copyBtn.tooltip('enable');
	copyBtn.click(function () {
		if (window.getSelection) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(primerPairBody[0]);
			selection.removeAllRanges();
			selection.addRange(range);
			document.execCommand('copy');
			setTimeout(function () {
				copyBtn.tooltip('hide');
			}, 1000);
		}
	});
	cardHeaderRow.append(copyBtn);
	let primerPairFav = $('<button class="fav-btn shadow-none">&#9734;</button>');
	primerPairFav.click(function () {
		favButton(primerPairFav, primerPair);
	});
	cardHeaderRow.append(primerPairFav);
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
	$('.copy-btn-main').attr('hidden', true);
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
				highlightPrimerPair(
					primerPairs[primerNumber],
					!primerPairBtn.hasClass('collapsed')
				);
				if (!$('.primer-text').hasClass('collapsing')) {
					$('.copy-btn-main').attr('hidden', true);
					if (!primerPairBtn.hasClass('collapsed')) {
						primerPair.find('.copy-btn').attr('hidden', true);
					} else {
						primerPair.find('.copy-btn').removeAttr('hidden');
					}
				}
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
				favButton(primerPairFav, primerPairs[primerNumber]);
			});
			let copyBtn = primerPair.find('.copy-btn');
			copyBtn.tooltip('enable');
			copyBtn.off('click').on('click', function () {
				if (window.getSelection) {
					copyBtn.tooltip('show');
					const selection = window.getSelection();
					const range = document.createRange();
					range.selectNodeContents(primerPair.find('.card-body')[0]);
					selection.removeAllRanges();
					selection.addRange(range);
					document.execCommand('copy');
					setTimeout(function () {
						copyBtn.tooltip('hide');
					}, 1000);
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
function highlightPrimerPair(primerPair, remove) {
	if (!$('.primer-text').hasClass('collapsing')) {
		if (remove || selectedPrimer != primerPair) {
			if (selectedPrimer != null) {
				let selectedExon = selectedPrimer.exon;
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
			selectedPrimer = primerPair;
			if (remove) {
				selectedPrimer = null;
			}
		}
	}
}

// Highlight primer in exon function
function updateFavHighlights() {
	console.log(favHighlighted);
}

// Favorite button click functionq
function favButton(button, primerPair) {
	// Add as favorite
	if (!primerPair.favorite) {
		button.html('&#9733;');
		button.addClass('fav-btn-active');
		$('#favorites-list').append(createFavCard(primerPair, button));
		primerPair.favorite = true;
	}
	// Remove favorite
	else {
		button.html('&#9734;');
		button.removeClass('fav-btn-active');
		let after = false;
		$('#favorites-list div.primer-card').each(function (index) {
			if (
				!after &&
				$(this).attr('id') == 'favoriteItem' + primerPair.id.toString()
			) {
				after = true;
			}
			if (after) {
				$(this)
					.find('.btn-link')
					.text('Favorite ' + index.toString());
			}
		});
		favInd -= 1;
		$('#favoriteItem' + primerPair.id.toString()).remove();
		primerPair.favorite = false;
	}
}

function createFavCard(primerPair, button) {
	let card = $(
		`<div class="card primer-card" id="favoriteItem${primerPair.id}"></div>`
	);
	card.append(
		$(
			`<div class="card-header"><div class="row"><button class="primer-btn btn btn-link btn-block text-left mr-auto collapsed" type="button" id="headerBtn${primerPair.id}" data-toggle="collapse" data-target="#favoriteText${primerPair.id}" aria-expanded='false' aria-controls='favoriteText${primerPair.id}'>Favorite ${favInd}</button></div></div>`
		)
	);
	favInd += 1;
	card.find('.primer-btn').click(function () {
		if (!$('.fav-text').hasClass('collapsing')) {
			$('.copy-btn-main').attr('hidden', true);
			if (!$(this).hasClass('collapsed')) {
				card.find('.copy-btn').attr('hidden', true);
			} else {
				card.find('.copy-btn').removeAttr('hidden');
			}
		}
	});
	let favBtn = $(
		'<button class="fav-btn fav-btn-active shadow-none">&#9733;</button>'
	);
	let copyBtn = $(
		'<button class="copy-btn shadown-none align-middle" data-toggle="tooltip" data-placement="top" data-trigger="click" title="Copied" hidden>' +
			'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard align-middle" viewBox="0 0 16 16">' +
			'<path fill-rule="evenodd" d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>' +
			'<path fill-rule="evenodd" d="M9.5 1h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>' +
			'</svg></button>'
	);
	let highlightBtn = $(
		'<button class="highlight-btn shadown-none align-middle" title="Highlight">' +
			'<img class="highlight-img" src="assets/highlighter.svg" />' +
			'</button>'
	);
	card.find('.row').append(copyBtn);
	card.find('.row').append(highlightBtn);
	card.find('.row').append(favBtn);
	card.append(
		$(
			`<div class="card-body fav-text collapse" id="favoriteText${primerPair.id}"></div>`
		)
	);
	card.find('.card-body').append(primerPairInfo(primerPair));
	copyBtn.tooltip('enable');
	copyBtn.click(function () {
		if (window.getSelection) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(card.find('.card-body')[0]);
			selection.removeAllRanges();
			selection.addRange(range);
			document.execCommand('copy');
			setTimeout(function () {
				copyBtn.tooltip('hide');
			}, 1000);
		}
	});
	favBtn.click(function () {
		button.html('&#9734;');
		button.removeClass('fav-btn-active');
		let after = false;
		$('#favorites-list div.primer-card').each(function (index) {
			if (
				!after &&
				$(this).attr('id') == 'favoriteItem' + primerPair.id.toString()
			) {
				after = true;
			}
			if (after) {
				$(this)
					.find('.btn-link')
					.text('Favorite ' + index.toString());
			}
		});
		favInd -= 1;
		$('#favoriteItem' + primerPair.id.toString()).remove();
		if ($('#favorites-list li').length == 1) {
			$('#dummy-list-item').removeAttr('hidden');
		}
		primerPair.favorite = false;
	});
	highlightBtn.click(function () {
		for (let i = 0; i < favHighlightNumber; i++) {
			// If already highlighted
			if (
				favHighlighted[i] !== null &&
				favHighlighted[i].id === primerPair.id
			) {
				favHighlighted[i] = null;
				$(this).removeClass('highlight-btn-active');
				updateFavHighlights();
				return;
			}
		}
		for (let i = 0; i < favHighlightNumber; i++) {
			if (favHighlighted[i] === null) {
				favHighlighted[i] = {
					id: primerPair.id,
					forward: {
						exon: primerPair.exon,
						left: primerPair.fInd,
						right: primerPair.fInd + primerPair.fLen,
					},
					reverse: {
						exon: primerPair.exon + 1,
						left: primerPair.rInd,
						right: primerPair.rInd + primerPair.rLen,
					},
				};
				$(this).addClass('highlight-btn-active');
				updateFavHighlights();
				return;
			}
		}
	});
	return card;
}

// Create info element for primer pair
function primerPairInfo(primerPair) {
	let fSelfComp = primerPair.fHairpin;
	let rSelfComp = primerPair.rHairpin;
	let dimerization = primerPair.dimer;

	let body = $('<div class="primer-props"></div>');
	let propForward = $('<div></div>');
	propForward.append(
		$(
			"<div class='prop-heading'>Forward (Exon " +
				primerPair.exon.toString() +
				')</div>'
		)
	);
	propForward.append(
		$("<div class='prop-body'>" + primerPair.fPrimer + '</div>')
	);
	propForward.append(
		$(
			"<div class='prop-body'>" +
				'Location: ' +
				primerPair.startLocation +
				'</div>'
		)
	);
	body.append(propForward);
	let propReverse = $('<div></div>');
	propReverse.append(
		$(
			"<div class='prop-heading'>Reverse (Exon " +
				(primerPair.exon + 1).toString() +
				')</div>'
		)
	);
	propReverse.append(
		$("<div class='prop-body'>" + primerPair.rPrimer + '</div>')
	);
	propReverse.append(
		$(
			"<div class='prop-body'>" +
				'Location: ' +
				primerPair.endLocation +
				'</div>'
		)
	);
	body.append(propReverse);
	let propLength = $('<div></div>');
	propLength.append($("<div class='prop-heading'>Length (bp)</div>"));
	propLength.append(
		$(
			"<div class='prop-body'>for: " +
				primerPair.fLen.toString() +
				' | rev: ' +
				primerPair.rLen.toString() +
				' | total: ' +
				(primerPair.fLen + primerPair.dist + primerPair.rLen).toString() +
				'</div>'
		)
	);
	body.append(propLength);
	let propTempBasic = $('<div></div>');
	propTempBasic.append(
		$("<div class='prop-heading'>Melting Temp (ºC) (Basic)</div>")
	);
	propTempBasic.append(
		$(
			"<div class='prop-body'>for: " +
				primerPair.fMeltTempBasic.toFixed(1).toString() +
				' | rev: ' +
				primerPair.rMeltTempBasic.toFixed(1).toString() +
				' | diff: ' +
				primerPair.meltTempDiffBasic.toFixed(2).toString() +
				'</div>'
		)
	);
	body.append(propTempBasic);
	let propTempSalt = $('<div></div>');
	propTempSalt.append(
		$("<div class='prop-heading'>Melting Temp (ºC) (Salt Adjusted)</div>")
	);
	propTempSalt.append(
		$(
			"<div class='prop-body'>for: " +
				primerPair.fMeltTempSalt.toFixed(1).toString() +
				' | rev: ' +
				primerPair.rMeltTempSalt.toFixed(1).toString() +
				' | diff: ' +
				primerPair.meltTempDiffSalt.toFixed(2).toString() +
				'</div>'
		)
	);
	body.append(propTempSalt);
	let propGCContent = $('<div></div>');
	propGCContent.append($("<div class='prop-heading'>G/C Content</div>"));
	propGCContent.append(
		$(
			"<div class='prop-body'>for: " +
				primerPair.fPercentGC.toFixed(1).toString() +
				'% | rev: ' +
				primerPair.rPercentGC.toFixed(1).toString() +
				'%</div>'
		)
	);
	body.append(propGCContent);
	let propGCClamp = $('<div></div>');
	propGCClamp.append(
		$("<div class='prop-heading'>Start/End with G/C Pair</div>")
	);
	propGCClamp.append(
		$(
			"<div class='prop-body'>for: starts-" +
				primerPair.fClamps.starts.toString() +
				', ends-' +
				primerPair.fClamps.ends.toString() +
				'</div>'
		)
	);
	propGCClamp.append(
		$(
			"<div class='prop-body'>rev: starts-" +
				primerPair.rClamps.starts.toString() +
				', ends-' +
				primerPair.rClamps.ends.toString() +
				'</div>'
		)
	);
	body.append(propGCClamp);
	let propHairpin = $('<div></div>');
	propHairpin.append($("<div class='prop-heading'>Hairpin</div>"));
	propHairpin.append(
		$(
			"<div class='prop-body'>for: " +
				fSelfComp.toString() +
				' | rev: ' +
				rSelfComp.toString() +
				'</div>'
		)
	);
	body.append(propHairpin);
	let propDimer = $('<div></div>');
	propDimer.append($("<div class='prop-heading'>Dimerization</div>"));
	propDimer.append($("<div class='prop-body'>" + dimerization + '</div>'));
	body.append(propDimer);

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
	updatePages(1);
}
