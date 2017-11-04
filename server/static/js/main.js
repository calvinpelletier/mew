window.onload = function() {
	initSettings();
	requestBarGraphData();
	requestMainData(true);

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		if (!CARD2_DATA_ELEMENT.isLoading()) {
		    requestBarGraphData();
		}
	});

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
	    if (!CARD2_DATA_ELEMENT.isLoading()) {
            filterAndDrawLineGraph();
	    }
	});

	$('#logout-link').on('click', function(e) {
		logout();
	});
};
