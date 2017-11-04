var BG_FAIL_PLACEHOLDER = "Failed to load bar graph data.";
var BG_NO_DATA_PLACEHOLDER = "No data found for bar graph.";

function getBarGraphConfig() {
    var $timeframeObj = $('input.timeframe-choice:checked', '#chart0-options');
    var timeframeId = $timeframeObj.attr('id');

    var durations = $.extend({}, BAR_GRAPH_DURATIONS);
    var now = new Date();
    var beginningOfDay = new Date(now).setHours(0,0,0,0);
    var minutes = (now - beginningOfDay) / (1000 * 60);
    durations["today"] = minutes;

    var timespanName;
    if ($timeframeObj.length == 0) {
        timespanName = "Last 24 Hours";
        timeframeId = "last-24";
    } else {
        timespanName = $.trim($timeframeObj.parent().text());
    }

    return {
        "timespanName": timespanName,
        "timespanId": timeframeId,
        "durations": durations
    }
}

function drawBarGraphFailure(message) {
    CARD1_DATA_ELEMENT.hideLoader();
    $("#chart0").hide();
    $("#chart0-nodata").text(message);
    $("#chart0-nodata").removeClass('hidden');
}


function requestBarGraphData()
{
    var graphConfig = getBarGraphConfig();
    // tiny helper function to display the bar graph data
    var _display = function() {
        let chosenData = window.raw_bar_graph_data[graphConfig.timespanId];
        $('#card1-title').text(graphConfig.timespanName);
        $('#card1-subtitle').text("Total Time: " + formatTime(chosenData.total, true));

        drawBarGraph(chosenData.labels, chosenData.values);
        CARD1_DATA_ELEMENT.hideLoader();
    }

    if (window.raw_bar_graph_data) {
        _display();
    } else {

        // TODO: maybe customize this?
        var maxSites = 5;
        var postData = {
            "max_sites": maxSites,
            "durations" : graphConfig.durations
        };

        success = function(response) {
            window.raw_bar_graph_data = response;
            _display();
        };

        fail = function() {
            toastr.error('Request for bar graph data failed.');
            // TODO: create some sort of "loading failed graphic"
            // temporary solution - just hide the whole thing
            drawBarGraphFailure(BG_FAIL_PLACEHOLDER);
        };

        postBarGraphData(postData, success, fail);
    }
}

function drawBarGraph(labels, values) {
    // Show/hide relevant divs
    $("#chart0").show();
    $("#chart0-nodata").addClass('hidden');

    var scrollTop = $(window).scrollTop();

    if (labels.length == 0) {
        console.log("Bar graph endpoint returned no data.");
        drawBarGraphFailure(BG_NO_DATA_PLACEHOLDER);
    } else {
        Highcharts.chart("chart0", {
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
