var TIMEFRAME_MINUTE_DURATIONS = {
	"last-hour" : 60,
	"last-24" : 1440,
	"last-week": 10080,
	"last-year": 525600,
}

function requestBarGraphData(minutes, max_sites)
{
	var postData = {
		"minutes": minutes,
		"max_sites": max_sites
	};

	// Get graph data from server.
	$.post({
		url: '/api/bargraph',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(postData),
		success: function(response) {
            title = "Last 24 Hours - Total Time: " + formatTime(response.total);
			drawBarGraph(response.labels, response.values, "chart0", title);
		},
		fail: function() {
			// TODO: what happens here?
		}
	});
}

function get_minutes(chosenTimeframe) {
	if (chosenTimeframe == "today") {
		// TODO
	} else if (chosenTimeframe == "all") {
		// TODO
	} else {
		console.log("Unknown timeframe ID: " + chosenTimeframe);
	}
}

window.onload = function() {
	// Default is one day, 5 sites
	requestBarGraphData(24 * 60, 5);

	$('input.timeframe-choice').on('change', function (e) {
		var chosenTimeframe = e.currentTarget.id;
		var minutes;
		if (chosenTimeframe in TIMEFRAME_MINUTE_DURATIONS) {
			minutes = TIMEFRAME_MINUTE_DURATIONS[chosenTimeframe];
		} else {
			minutes = get_minutes(chosenTimeframe);
		}

		requestBarGraphData(minutes, 5);
});

};
