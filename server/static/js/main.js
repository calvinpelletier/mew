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
			console.log(JSON.stringify(response));
			drawBarGraph(response.labels, response.values, "chart0", title);
		},
		fail: function() {
			// TODO: what happens here?
		}
	});
}

function filterAndDrawLineGraph(minutes, domains) {
	console.log("Drawing line graph for last " + minutes + " minutes, and for " + domains.length + " domains.")
	data = filter(window.raw_line_graph_data.data, domains, minutes);
	console.log(data);
	drawLineGraph(data["x"], data["y"], "chart1");
}

function requestLineGraphData() {
	if (typeof window.raw_line_graph_data !== "undefined") {
		filterAndDrawLineGraph(get_minutes_in_timeframe(), get_selected_hostnames());
		return;
	}

	// Note: we always fetch all day, it's just filtered to a timespan later.
	var postData = {
		"days": null,
		"timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
	};

	// Get graph data from server.
	$.post({
		url: '/api/stackedgraph',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(postData),
		success: function(response) {
			console.log("Success! " + response);
			window.raw_line_graph_data = response;
			createHostnameCheckboxes(window.raw_line_graph_data.hostnames);
			filterAndDrawLineGraph(get_minutes_in_timeframe(), get_selected_hostnames());
		},
		fail: function() {
			// TODO: what happens here?
		}
	});
}

function get_minutes(chosenTimeframe) {
	if (chosenTimeframe == "today") {
	    var now = new Date();
      var beginningOfDay = new Date(now).setHours(0,0,0,0);
      var mins = (now - beginningOfDay) / (1000 * 60);
      return mins;
	} else if (chosenTimeframe == "all") {
		return null;
	} else {
		console.log("Unknown timeframe ID: " + chosenTimeframe);
		return 1440; // Just default to last 24 hours, I guess
	}
}

window.onload = function() {
	// Default is one day, 5 sites
	requestBarGraphData(24 * 60, 5);

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		var chosenTimeframe = e.currentTarget.id;
		var minutes;
		if (chosenTimeframe in TIMEFRAME_MINUTE_DURATIONS) {
			minutes = TIMEFRAME_MINUTE_DURATIONS[chosenTimeframe];
		} else {
			minutes = get_minutes(chosenTimeframe);
		}
		requestBarGraphData(minutes, 5);
	});

	// Default is one week
	requestLineGraphData(7 * 24 * 60, get_selected_hostnames());

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
		requestLineGraphData(get_minutes_in_timeframe(), get_selected_hostnames());
	});
};
