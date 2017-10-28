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

	$('#logout-link').on('click', function(e) {
		logout();
	});
};
