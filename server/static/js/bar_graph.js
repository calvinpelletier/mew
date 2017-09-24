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