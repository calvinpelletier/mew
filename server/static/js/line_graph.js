function filterAndDrawLineGraph(minutes) {
	console.log("Drawing line graph for last " + minutes + " minutes.")
	let filteredData = filterData(window.raw_line_graph_data.data, minutes);
	let bucketedData = bucketData(filteredData);
	drawLineGraph(bucketedData["x"], bucketedData["y"], "chart1");
}

function requestLineGraphData() {
	if (typeof window.raw_line_graph_data !== "undefined") {
		filterAndDrawLineGraph(getLineGraphMinutes());
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
			filterAndDrawLineGraph(getLineGraphMinutes());
		},
		statusCode: {
            500: function() {
              this.fail();
            }
        },
		fail: function() {
			toastr.error('Request for line graph data failed.');
		}
	});
}

function getLineGraphMinutes() {
	timeframeId = $('input.timeframe-choice:checked', '#chart1-options').attr('id');
	if (timeframeId in MINUTE_DURATIONS) {
		minutes = MINUTE_DURATIONS[timeframeId];
	} else {
		console.log("ERROR IN DURATION: " + timeframeId);
		minutes = 0;
	}
	return minutes;
}

function drawLineGraph(timestamp_labels, data, divId) {
	var N_VISIBLE_DOMAINS = 4;

	var chartData = [];
	var i = 0;
	for (var domain in data) {
		// Zip together timestamps with data
		var fullData = timestamp_labels.map(function(ts, i) {
		  return [ts.getTime(), data[domain][i]];
		});

		chartData.push({
			name: domain,
			data: fullData,
			visible: i < N_VISIBLE_DOMAINS
		});
		i++;
	}

	Highcharts.chart(divId, {
		title: {text: null},
		yAxis: {
			title: {
				text: 'minutes',
				style: {
					textTransform: 'uppercase'
				}
			},
			minorTickInterval: 'auto',
			labels: {
				style: {
					fontSize: '12px'
				}
			}
		},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			itemStyle: {
				fontWeight: 'bold',
				fontSize: '13px'
			}
		},
		xAxis: {
			type: 'datetime',
	        labels: {
	            format: '{value:%Y-%m-%d}',
	            rotation: 45,
	            align: 'left',
				style: {
					fontSize: '12px'
				}
	        },
			gridLineWidth: 1,
		},
		tooltip: {
			pointFormatter: function() {
				return this.series.name + ': ' + formatTime(this.y);
			},
			borderWidth: 0,
			backgroundColor: 'rgba(219,219,216,0.8)',
			shadow: false
		},
		series: chartData,
		responsive: {
			rules: [{
				condition: {
					maxWidth: 500
				},
				chartOptions: {
					legend: {
						layout: 'horizontal',
						align: 'center',
						verticalAlign: 'bottom'
					}
				}
			}]
		},
		credits: {
	        enabled: false
	    },

		// theme stuff
		colors: ['#7cb5ec', '#f7a35c', '#90ee7e', '#7798BF', '#aaeeee', '#ff0066',
		'#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
		chart: {
			backgroundColor: null,
			style: {
				fontFamily: 'Sinkin-Sans200XLight, sans-serif'
			}
		},
		plotOptions: {
			candlestick: {
				lineColor: '#404048'
			}
		},
		background2: '#F0F0EA'
	});
}
