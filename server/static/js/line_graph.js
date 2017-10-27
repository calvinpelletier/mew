var LG_FAIL_PLACEHOLDER = "Failed to load line graph data.";
var LG_NO_DATA_PLACEHOLDER = "No data found for line graph.";

var GRAPH_NAME_CHANGES = {
    "_total" : "All Sites",
    "_unprod" : "Unproductive Sites"
};

// Highcharts object
var lineGraph;

function filterAndDrawLineGraph() {
    if (window.raw_line_graph_data) {
        let filteredData = filterData(window.raw_line_graph_data.data, getLineGraphMinutes());
        let bucketedData = bucketData(filteredData);
        drawLineGraph(bucketedData["x"], bucketedData["y"], "chart1");
    } else {
        drawLineGraphFailure(LG_NO_DATA_PLACEHOLDER);
    }
	hideLineGraphLoader();
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

function hideLineGraphLoader() {
	$("#card2 .loader").hide();
}

function drawLineGraphFailure(message) {
	hideLineGraphLoader();
    $("#chart1").hide();
    $("#chart1-nodata").text(message);
    $("#chart1-nodata").removeClass('hidden');
}

function drawLineGraph(timestamp_labels, data, divId) {
	var N_VISIBLE_DOMAINS = 4;

	visible = {};
	if (lineGraph) {
        for (var i = 0;i < lineGraph.series.length; i++) {
            if (lineGraph.series[i].visible) {
                visible[lineGraph.series[i].name] = true;
            }
        }
	} else {
	    var domainList = Object.keys(data);
	    for (var i = 0;i < N_VISIBLE_DOMAINS; i++) {
	        visible[domainList[i]] = true;
	    }
	}

	var chartData = [];
	var i = 0;
	for (var domain in data) {
		// Zip together timestamps with data
		var fullData = timestamp_labels.map(function(ts, i) {
		  return [ts.getTime(), data[domain][i]];
		});

		let _visible = (domain in visible) ? true : false;

		let nameInGraph = domain;

		if (nameInGraph in GRAPH_NAME_CHANGES) {
		    nameInGraph = GRAPH_NAME_CHANGES[nameInGraph];
		}

		chartData.push({
			name: nameInGraph,
			data: fullData,
			visible: _visible
		});
		i++;
	}

	var scrollTop = $(window).scrollTop();

    lineGraph = Highcharts.chart(divId, {
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
            },
            margin: 50
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


	$(window).scrollTop(scrollTop);
}
