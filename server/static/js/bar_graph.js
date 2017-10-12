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
            $('#card1-title').text(title);
			console.log(JSON.stringify(response));
			drawBarGraph(response.labels, response.values, "chart0", title);
		},
		fail: function() {
			// TODO: what happens here?
		}
	});
}

function drawBarGraph(labels, values, divId, title) {
  Highcharts.chart(divId, {
    chart: {
        type: 'bar',
		backgroundColor: null,
		style: {
			fontFamily: 'Sinkin-Sans200XLight, sans-serif'
		}
    },
    title: {
        text: null
    },
    xAxis: {
        categories: labels,
        title: {
            text: null
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Time spent (minutes)',
            align: 'high'
        },
        labels: {
            overflow: 'justify'
        }
    },
    tooltip: {
        enabled: false,
        valueSuffix: ' minutes'
    },
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: true,
                formatter: function() {
                    return formatTime(this.y);
                }
            }
        }
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'x',
        showInLegend: false,
        data: values,
        // color: '#2d333c'
        color: '#31c4e9'
        // color: '#344754'
        // color: '#47e48f'
    }]
});
}
