// Checks if there are previous options
chrome.runtime.sendMessage({ message: 'get params' }, function (response) {
	if (response.params != null) {
		fillInputs(response.params);
	}
});

// When start button is clicked
$('#start_button').click(function () {
	// Gets params inputs
	let params = {
		length: {
			lower: parseInt($('#input-length-lb').val()),
			upper: parseInt($('#input-length-ub').val()),
			total: parseInt($('#input-total-len').val()),
		},
		percentGC: {
			lower: parseFloat($('#input-percent-lb').val()),
			upper: parseFloat($('#input-percent-ub').val()),
		},
		temperature: {
			type: $('#input-temp-type').val(),
			ideal: parseFloat($('#input-temp-ideal').val()),
		},
		dimerThresh: parseInt($('#input-dimer-threshold').val()),
	};
	if (validParams(params)) {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			chrome.tabs.sendMessage(tabs[0].id, { message: 'start', params: params });
			window.close();
		});
	} else {
		alert('Invalid parameters!');
	}
});

// Fills in previous inputs
function fillInputs(params) {
	$('#input-length-lb').val(params.length.lower);
	$('#input-length-ub').val(params.length.upper);
	$('#input-total-len').val(params.length.total);
	$('#input-percent-lb').val(params.percentGC.lower);
	$('#input-percent-ub').val(params.percentGC.upper);
	$('#input-temp-type').val(params.temperature.type);
	$('#input-temp-ideal').val(params.temperature.ideal);
	$('#input-dimer-threshold').val(params.dimerThresh);
}

// Checks if parameters are valid
function validParams(params) {
	if (
		isNaN(params.length.lower) ||
		isNaN(params.length.upper) ||
		isNaN(params.length.total) ||
		isNaN(params.percentGC.lower) ||
		isNaN(params.percentGC.upper) ||
		isNaN(params.temperature.ideal)
	) {
		return false;
	}
	if (params.length.upper < params.length.lower) {
		return false;
	}
	if (params.length.total < params.length.lower * 2) {
		return false;
	}
	if (params.percentGC.upper < params.percentGC.lower) {
		return false;
	}
	return true;
}
