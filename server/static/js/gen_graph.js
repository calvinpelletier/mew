var color = Chart.helpers.color;

// From https://stackoverflow.com/a/25683102
var randomColorGenerator = function() {
  return color('#' + (Math.random().toString(16) + '0000000').slice(2, 8)).alpha(0.5);
};

function formatTime(value) {
  if (value < 1) {
    return Math.round(value * 60) + " seconds";
  } else if (value < 120) {
    return Math.round(value) + " minutes";
  } else {
    return (value / 60).toFixed(1) + " hours";
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