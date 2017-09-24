window.onload = function() {
	requestBarGraphData();
	requestLineGraphData();

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		requestBarGraphData();
	});

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
		requestLineGraphData();
	});
};
