var color = Chart.helpers.color;

// From https://stackoverflow.com/a/25683102
var randomColorGenerator = function () {
    return color('#' + (Math.random().toString(16) + '0000000').slice(2, 8)).alpha(0.5);
};

function formatTime(value) {
    if (value < 1) {
        return Math.round(value * 60) + " seconds";
    } else {
        return Math.round(value) + " minutes";
    }
}

var drawBarGraph = function(labels, values, canvas, title) {
	var num_bars = labels.length;

	var bar_colors = []
	for (var i = 0; i < num_bars; i++) {
		bar_colors.push(randomColorGenerator().rgbString());
	}

	var horizontalBarChartData = {
		labels: labels,
		datasets: [{
			label: 'Websites Visited',
			backgroundColor: bar_colors,
			data: values
		}]
	};

  if (window.myHorizontalBar) {
    window.myHorizontalBar.destroy();
  }


	var ctx = document.getElementById(canvas).getContext("2d");
	window.myHorizontalBar = new Chart(ctx, {
		type: 'horizontalBar',
		data: horizontalBarChartData,
		options: {
			// Elements options apply to all of the options unless overridden in a dataset
			// In this case, we are setting the border of each horizontal bar to be 2px wide
			elements: {
				rectangle: {
					borderWidth: 2,
				}
			},
			legend: {
				 display: false
			},
			responsive: true,
			title: {
				display: true,
				text: title
			},
			scales: {
				xAxes: [{
					display: true,
					ticks: {
						suggestedMin: 0, // minimum will be 0, unless there is a lower value.
					}
				}]
			},
			tooltips: {
						callbacks: {
							label: function(tooltipItem, chart) {
									return formatTime(parseFloat(tooltipItem.xLabel));
							}
						}
				}
		}
	});
}


/*
var chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

document.getElementById('randomizeData').addEventListener('click', function() {
    var zero = Math.random() < 0.2 ? true : false;
    horizontalBarChartData.datasets.forEach(function(dataset) {
        dataset.data = dataset.data.map(function() {
            return zero ? 0.0 : randomScalingFactor();
        });

    });
    window.myHorizontalBar.update();
});

var colorNames = Object.keys(chartColors);

document.getElementById('addDataset').addEventListener('click', function() {
    var colorName = colorNames[horizontalBarChartData.datasets.length % colorNames.length];;
    var dsColor = chartColors[colorName];
    var newDataset = {
        label: 'Dataset ' + horizontalBarChartData.datasets.length,
        backgroundColor: color(dsColor).alpha(0.5).rgbString(),
        borderColor: dsColor,
        data: []
    };

    for (var index = 0; index < horizontalBarChartData.labels.length; ++index) {
        newDataset.data.push(randomScalingFactor());
    }

    horizontalBarChartData.datasets.push(newDataset);
    window.myHorizontalBar.update();
});

document.getElementById('addData').addEventListener('click', function() {
    if (horizontalBarChartData.datasets.length > 0) {
        var month = MONTHS[horizontalBarChartData.labels.length % MONTHS.length];
        horizontalBarChartData.labels.push(month);

        for (var index = 0; index < horizontalBarChartData.datasets.length; ++index) {
            horizontalBarChartData.datasets[index].data.push(randomScalingFactor());
        }

        window.myHorizontalBar.update();
    }
});

document.getElementById('removeDataset').addEventListener('click', function() {
    horizontalBarChartData.datasets.splice(0, 1);
    window.myHorizontalBar.update();
});

document.getElementById('removeData').addEventListener('click', function() {
    horizontalBarChartData.labels.splice(-1, 1); // remove the label first

    horizontalBarChartData.datasets.forEach(function (dataset, datasetIndex) {
        dataset.data.pop();
    });

    window.myHorizontalBar.update();
});
*/
