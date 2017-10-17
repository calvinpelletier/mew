
// If there are more than this many days in the line graph, the data will
// be bucketed per month.
BUCKETING_THRESHOLD = 100;

// TODO: filter by time range
function filterData(summaryData, minutes) {
	/* summaryData should be of the form:
	[
		{
			"date": ...
			"summary" : {
				hostname: timespan
				another_hostname: another_timespan
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

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}


// Returns a string
function getMonthDay(date) {
    return date.getUTCMonth().pad(2) + date.getUTCDate().pad(2);
}

function bucketData(data) {
    if (data.x.length > BUCKETING_THRESHOLD) {

        var domains = Object.keys(data.y);

        var currentWeek = null;
        var cwStr = null
        var cwData = {};

        var weekStarts = []
        // Map from hostname to list of integers, one per day.
        var weekBucketedData = {};
        domains.forEach(function(d) {
            weekBucketedData[d] = [];
        });

        data.x.forEach(function(d, i) {
            // Get start of week
            // We want day of week to be 1 (which is Monday)
            let daysToSub = (d.getUTCDay() + 6) % 7;
            let startOfWeek = new Date(d);
            startOfWeek.setUTCDate(d.getUTCDate() - daysToSub);
            let sowStr = getMonthDay(startOfWeek);
            if (!currentWeek || cwStr != sowStr) {
                if (currentWeek) {
                    weekStarts.push(currentWeek);
                    Object.keys(cwData).forEach(function(hostname) {
                        weekBucketedData[hostname].push(cwData[hostname]);
                    });
                }
                console.log(startOfWeek);
                currentWeek = startOfWeek;
                cwStr = sowStr;
                cwData = {};
            }

            domains.forEach(function(hostname) {
                let summary = data.y[hostname]
                cwData[hostname] = (cwData[hostname]) ? (cwData[hostname] + summary[i]) : summary[i];
            });


        });

        console.log("WEEK STARTS: " + weekStarts);

        return {
            "x": weekStarts,
            "y": weekBucketedData
        };
    } else {
        return data;
    }
}