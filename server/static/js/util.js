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
        let numHoursFixed = numHours.toFixed(1);
        if (numHoursFixed % 1 == 0) {
            numHoursFixed = Math.floor(numHoursFixed);
        }
        return numHoursFixed + " hours";
    } else if (allowBeyondHours == false) {
        return Math.round(numHours) + " hours";
    } else {
        let numDaysFixed = (numHours / 24).toFixed(1);
        if (numDaysFixed % 1 == 0) {
            numDaysFixed = Math.floor(numDaysFixed);
        }
        return numDaysFixed + " days";
    }
  }
}

function setQuotaPercent(percent) {
	if (percent > 100) {
		$('#quota-percent').text('>100%');
		percent = 100;
	} else {
		$('#quota-percent').text(percent.toString() + '%');
	}
	var deg = 360. * percent / 100.;
	var activeBorder = $('#quota-percent-border');
	if (deg <= 180){
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, #344754 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
    else{
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, #31c4e9 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
}
