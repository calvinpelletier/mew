function filterAndDrawLineGraph() {
	var minutes = getLineGraphMinutes()
	console.log("Drawing line graph for last " + minutes + " minutes.")
	data = filter(window.raw_line_graph_data.data, minutes);
	drawLineGraph(data["x"], data["y"], "chart1");
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

// TODO: filter by time range
function filter(summaryData, minutes) {
	/* summaryData should be of the form:
	[
		{
			"date": ...
			"summary" : {
				hostname: timestamp
				another_hostname: another_timestamp
			}
		}
	]
	*/
	domains = window.raw_line_graph_data.hostnames;
	x = [];
	y = {};

	if (minutes) {
		startTime = new Date(new Date().getTime() - MS_PER_MINUTE * minutes).getTime() / 1000;
		var filteredData = summaryData.filter(function(summarizedDay){
			return summarizedDay.date >= startTime;
		});
		// TODO: we'll need to filter domains, too
	} else {
		filteredData = summaryData;
	}

	domains.forEach(function(d) {
		y[d] = [];
	});

	filteredData.forEach(function(day) {
		x.push(new Date(day.date * 1000));
		domains.forEach(function(d) {
			y[d].push(day.summary[d] || 0)
		});
	});

	return {
		"x": x,
		"y": y
	};
}

function drawLineGraph(timestamp_labels, data, divId) {
	console.log(timestamp_labels);
	console.log(data);
	var N_VISIBLE_DOMAINS = 4;

	var chartData = [];
	var i = 0;
	for (var domain in data) {
		chartData.push({
			name: domain,
			data: data[domain],
			visible: i < N_VISIBLE_DOMAINS,
			pointStart: Date.UTC(timestamp_labels[0].getFullYear(), timestamp_labels[0].getMonth(), timestamp_labels[0].getDate()),
	        pointInterval: 1000 * 60 * 60 * 24
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
