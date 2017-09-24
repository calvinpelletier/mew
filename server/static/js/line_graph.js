// Map from checkbox id to duration, in minutes
var MINUTE_DURATIONS = {
  "last-week" : 10080,
  "last-month" : 44640,
  "last-3-months" : 132480,
  "last-year": 525600,
  "all": null
}

var MS_PER_MINUTE = 60000;
var MS_PER_DAY = MS_PER_MINUTE * 60 * 24;

// Returns a list of hostnames based on which checkboxes are
// selected for the line graph
function get_selected_hostnames() {
  return $('.form-check-input:checkbox:checked').map(function(i, checkbox) {
    return checkbox.value;
  }).get();
}

function get_minutes_in_timeframe() {
  timeframeId = $('input.timeframe-choice:checked', '#chart1-options').attr('id');
  if (timeframeId in MINUTE_DURATIONS) {
    minutes = MINUTE_DURATIONS[timeframeId];
  } else {
    console.log("ERROR IN DURATION: " + timeframeId);
    minutes = 0;
  }
  return minutes;
}

function createHostnameCheckbox(hostname, checked) {
  var $container = $("<div>", {
    "class": "form-check"
  });
  var $checkbox = $("<input>", {
    "class": "form-check-input line-graph-hostname",
    "value": hostname,
    "type": "checkbox"
  });

  if (checked) {
    $checkbox.attr("checked", "checked");
  }

  var $label = $("<label>", {
    "class": "form-check-label"
  });

  $checkbox.change(function() {
    requestLineGraphData(get_minutes_in_timeframe(), get_selected_hostnames());
  });

  $label.append($checkbox);
  $label.append(hostname);
  $container.append($label);
  return $container;
}

// Creates checkboxes for every hostname,
// and adds listeners to update the line graph
function createHostnameCheckboxes(hostnames) {
  $("#hostnameCheckboxes").empty();
  var idx = 0;
  hostnames.forEach(function(hostname) {
    if (idx < 3) {
      $container = createHostnameCheckbox(hostname, true);
    } else {
      $container = createHostnameCheckbox(hostname, false);
    }

    $("#hostnameCheckboxes").append($container);
    idx += 1;
  });
}

// TODO: filter by time range
function filter(summaryData, domains, minutes) {
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
  x = [];
  y = {};

  if (minutes) {
    startTime = new Date(new Date().getTime() - MS_PER_MINUTE * minutes).getTime() / 1000;
    var filteredData = summaryData.filter(function(summarizedDay){
      return summarizedDay.date >= startTime
    });
    // TODO: we'll need to filter domains, too
  } else {
    filteredData = summaryData;
  }

  domains.forEach(function(d) {
    y[d] = []
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
  chartDiv = document.getElementById(divId);
  console.log("Data for line graph, inside drawing function: "
              + JSON.stringify(data));
  var plotData = [];

  for (var domain in data) {
    line = {
      x: timestamp_labels,
      y: data[domain],
      type: 'scatter',
      name: domain,
      // text: data[domain].map(formatTime),
      hoverinfo: 'text+all',
      text: data[domain].map(function(duration)
      {
        if (duration > 0) {
          return domain + ": " + formatTime(duration);
        }

      })
    };
    plotData.push(line);
  }

  layout = {
        // hovermode: !1,
  };

  Plotly.purge(chartDiv);
  Plotly.plot(chartDiv, plotData, layout);
}