var BG_FAIL_PLACEHOLDER = "Failed to load bar graph data.";
var BG_NO_DATA_PLACEHOLDER = "No data found for bar graph.";

function getBarGraphConfig() {
    var $timeframeObj = $('input.timeframe-choice:checked', '#chart0-options');
    var timeframeId = $timeframeObj.attr('id');
    var minutes;
    if (timeframeId in MINUTE_DURATIONS) {
        minutes = MINUTE_DURATIONS[timeframeId];
    } else if (timeframeId == "today") {
        var now = new Date();
        var beginningOfDay = new Date(now).setHours(0,0,0,0);
        minutes = (now - beginningOfDay) / (1000 * 60);
    } else {
        console.log("Unknown timeframe ID: " + timeframeId);
        minutes = 1440; // Just default to last 24 hours, I guess
    }

    var timespanName;
    if ($timeframeObj.length == 0) {
        timespanName = "Last 24 Hours";
    } else {
        timespanName = $.trim($timeframeObj.parent().text());
    }

    return {
        "timespanName": timespanName,
        "minutes": minutes
    }
}

function hideBarGraphLoader() {
	$("#card1 .loader").hide();
}

function drawBarGraphFailure(message) {
    hideBarGraphLoader();
    $("#chart0").hide();
    $("#chart0-nodata").text(message);
    $("#chart0-nodata").removeClass('hidden');
}


function requestBarGraphData()
{
    var graphConfig = getBarGraphConfig();
    // TODO: maybe customize this?
    var maxSites = 5;

    var postData = {
        "minutes": graphConfig.minutes,
        "max_sites": maxSites
    };

    // Get graph data from server.
    $.post({
        url: '/api/bargraph',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(postData),
        success: function(response) {
            $('#card1-title').text(graphConfig.timespanName);
            $('#card1-subtitle').text("Total Time: " + formatTime(response.total, true));
            drawBarGraph(response.labels, response.values, "chart0");
            hideBarGraphLoader();

        },
        statusCode: {
            500: function() {
                this.fail();
            }
        },
        fail: function() {
            toastr.error('Request for bar graph data failed.');
            // TODO: create some sort of "loading failed graphic"
            // temporary solution - just hide the whole thing
            drawBarGraphFailure(BG_FAIL_PLACEHOLDER);
        }
    });
}

function drawBarGraph(labels, values, divId) {
    var scrollTop = $(window).scrollTop();

    if (labels.length == 0) {
        console.log("Bar graph endpoint returned no data.");
        drawBarGraphFailure(BG_NO_DATA_PLACEHOLDER);
    } else {
        Highcharts.chart(divId, {
            chart: {
                type: 'bar',
                backgroundColor: null,
                style: {
                    fontFamily: 'Sinkin-Sans200XLight, sans-serif'
                }
            },
            title: {
                text: null
            },
            xAxis: {
                categories: labels,
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Time spent (minutes)',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                enabled: false,
                valueSuffix: ' minutes'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        formatter: function() {
                            return formatTime(this.y);
                        }
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'x',
                showInLegend: false,
                data: values,
                // color: '#2d333c'
                color: '#31c4e9'
                // color: '#344754'
                // color: '#47e48f'
            }]
        });
    }

    $(window).scrollTop(scrollTop);
}
