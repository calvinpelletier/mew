window.onload = function() {
	initSettings();
	requestBarGraphData();
	requestMainData(true);

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		requestBarGraphData();
	});

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
		filterAndDrawLineGraph();
	});

	// tmp
	openAttachAcc();
};

// generic onclick function for capturing clicks that should close a modal
window.onclick = function(event) {
	var attach_acc = document.getElementById('attach-acc-container');
	if (event.target == document.getElementById('settings-container')) {
		$('#settings-container').addClass('hidden');
		$('#body-container').removeClass('blur');
		$('#body-container').removeClass('no-scrolling');
	} else if (attach_acc != null && event.target == attach_acc) {
		closeAttachAcc();
	} else if (event.target == document.getElementById('quota-val')
			|| event.target == document.getElementById('quota-unit')
			|| event.target == document.getElementById('quota-type')) {
		// hint the user about the toggle
		if (!$('#quota-toggle').is(':checked')) {
			$('#quota-enable-msg').removeClass('hidden');
		}
	}
}

window.onresize = function() {
	var attach_acc = $('#attach-acc-container');
	if (attach_acc != null && !attach_acc.hasClass('hidden')) {
		renderGoogleButton();
	}
};

function onOAuthLoad() {
    // init google auth
	gapi.load('auth2', function() {
		gapi.auth2.init();
	});
}
