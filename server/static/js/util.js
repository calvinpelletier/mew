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

function formatTime(value) {
  if (value < 1) {
    return Math.round(value * 60) + " seconds";
  } else if (value < 120) {
    return Math.round(value) + " minutes";
  } else {
    return (value / 60).toFixed(1) + " hours";
  }
}