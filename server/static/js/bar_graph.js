function getBarGraphMinutes(chosenTimeframe) {
  var timeframeId = $('input.timeframe-choice:checked', '#chart0-options').attr('id');
  var minutes;
  if (timeframeId in MINUTE_DURATIONS) {
    minutes = MINUTE_DURATIONS[timeframeId];
  } else if (timeframeId == "today") {
    var now = new Date();
    var beginningOfDay = new Date(now).setHours(0,0,0,0);
    minutes = (now - beginningOfDay) / (1000 * 60);
  } else {
		console.log("Unknown timeframe ID: " + timeframeId);
		minutes = 1440; // Just default to last 24 hours, I guess
	}
  return minutes;
}

function requestBarGraphData()
{
	// TODO: maybe customize this?
	var max_sites = 5;

	var postData = {
		"minutes": getBarGraphMinutes(),
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

function drawBarGraph(labels, values, divId, title) {
  chartDiv = document.getElementById(divId);

  console.log("Drawing bar graph with labels: " + labels + "\nand values: " + values);

  chartValues = values.reverse()
  chartLabels = labels.reverse()

  var chartData = [{
    type: 'bar',
    x: chartValues,
    y: chartLabels,
    orientation: 'h',
    hoverinfo: 'text+all',
    text: chartValues.map(formatTime)
  }];

  var layout = {
    xaxis: {title: 'Minutes Spent'},
    yaxis: {title: 'Website'},
    margin: {t: 20},
    hovermode: 'closest'
  };

  Plotly.purge(chartDiv);
  Plotly.plot(chartDiv, chartData, layout);
}