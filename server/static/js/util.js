// Map from checkbox id to duration, in minutes
var BAR_GRAPH_DURATIONS = {
  "last-hour" : 60,
  "last-24" : 1440,
  "last-week" : 10080,
  "last-year": 525600,
  "all": null
}

var MINUTE_DURATIONS = BAR_GRAPH_DURATIONS;
MINUTE_DURATIONS["last-month"] = 44640;
MINUTE_DURATIONS["last-3-months"] = 132480;

var MS_PER_MINUTE = 60000;
var MS_PER_DAY = MS_PER_MINUTE * 60 * 24;

var _KEY_0 = 48;
var _KEY_9 = 57;
var _KEY_DOT = 46;

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

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
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

function validateNumeric(event) {
    return (event.charCode >= _KEY_0 && event.charCode <= _KEY_9) || event.charCode == _KEY_DOT;
}

// Shows the loader inside `loaderParent`, and hides any selectors in dataElements
function _showLoader(loaderParent, dataElements) {
    $(loaderParent + ' .loader').removeClass('hidden');

    dataElements.forEach(function(selector) {
        $(selector).addClass('hidden');
    });
}

// Hides the loader inside `loaderParent`, and shows any selectors in dataElements
function _hideLoader(loaderParent, dataElements) {
    $(loaderParent + ' .loader').addClass('hidden');

    dataElements.forEach(function(selector) {
        $(selector).removeClass('hidden');
    });
}

var DataElement = (function() {
    // constructor
    function DataElement(loaderParent, selectors) {
        this._loaderParent = loaderParent;
        this._selectors = selectors;
        this._isLoading = false;
    };

    DataElement.prototype.isLoading = function() {
        return this._isLoading;
    };
    DataElement.prototype.showLoader = function() {
        this._isLoading = true;
        _showLoader(this._loaderParent, this._selectors);
    };
    DataElement.prototype.hideLoader = function() {
        this._isLoading = false;
        _hideLoader(this._loaderParent, this._selectors);
    };

    return DataElement;
})();

var CARD0_DATA_ELEMENT = new DataElement('#card0', ['div.sub-today']);
var CARD1_DATA_ELEMENT = new DataElement('#card1', ['#chart0']);
var CARD2_DATA_ELEMENT = new DataElement('#card2', ['#chart1']);
var SETTINGS_DATA_ELEMENT = new DataElement('div#settings-content', ['.settings-section-a', '.settings-section-b']);
