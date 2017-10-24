// Map from checkbox id to duration, in minutes
var MINUTE_DURATIONS = {
  "last-hour" : 60,
  "last-24" : 1440,
  "last-week" : 10080,
  "last-month" : 44640,
  "last-3-months" : 132480,
  "last-year": 525600,
  "all": null
}

var MS_PER_MINUTE = 60000;
var MS_PER_DAY = MS_PER_MINUTE * 60 * 24;

if (!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function formatTime(value, allowBeyondHours) {
  if (allowBeyondHours == null) {
      allowBeyondHours = false;
  }

  if (value < 1) {
    return Math.round(value * 60) + " seconds";
  } else if (value < 60) {
    return Math.round(value) + " minutes";
  } else {
    let numHours = value / 60;
    if (numHours < 24) {
        return numHours.toFixed(1) + " hours";
    } else if (allowBeyondHours == false) {
        return Math.round(numHours) + " hours";
    } else {
        return (numHours / 24).toFixed(1) + " days";
    }
  }
}
