

function setQuotaPercent(percent) {
	$('#quota-percent').text(percent.toString() + '%');
	var deg = 360. * percent / 100.;
	var activeBorder = $('#quota-percent-border');
	if (deg <= 180){
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, #344754 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
    else{
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, #31c4e9 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
}

window.onload = function() {
	requestBarGraphData();
	requestLineGraphData();

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		requestBarGraphData();
	});

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
		requestLineGraphData();
	});

	setQuotaPercent(65);

	$('#settings-icon').on('click', function(e) {
		console.log("Clicked settings.");
		$('#body-container').attr('class', 'blur');
		$('#settings-dialog').show();

		// Temporary - just to close the dialog
		$('#settings-dialog').on('click', function(e) {
			$('#body-container').removeClass('blur');
			$('#settings-dialog').hide();
		});
	});
};
