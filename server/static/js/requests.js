// Bundles a bunch of api calls into one
// TODO: include bar graph data
function requestMainData(includeLineGraphData) {
    // Show the loader over card0 (the stats at the top of the page)
    showLoader('#card0', ['div.sub-today'])
    $.post({
		url: '/api/getmaindata',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
			'max_sites': 20,
			"ignore_linegraph_data": !includeLineGraphData
		}),
		success: function(response) {
            if (!response['success']) {
                // TODO
                return;
            }
		    if (includeLineGraphData) {
                window.raw_line_graph_data = response['linegraph'];
                showTotalAndUnprodUsage();
                filterAndDrawLineGraph();
		    }
            // Draw streak
			if (response['streak'] != -1) {
				showStreak(response['streak']);
				showQuotaPercent(response['quota-percent']);
			}

			hideLoader('#card0', ['div.sub-today'])
		},
		statusCode: {
            500: function() {
              this.fail();
            }
        },
		fail: function() {
			toastr.error('Request for line graph data failed.');
            drawLineGraphFailure(LG_FAIL_PLACEHOLDER);
		}
	});
}

function postBarGraphData(data, success, fail) {
    // Get graph data from server.
    $.post({
        url: '/api/bargraph',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: success,
        statusCode: {
            500: function() {
                this.fail();
            }
        },
        fail: fail
    });
}

function postSettings(sites, quota, quotaType, quotaUnit) {
    // Show the loader over card0 and card2
    showLoader('#card0', ['div.sub-today']);
    showLoader('#card2', ['#chart1']);

    $.post({
        url: '/api/settings',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'unprod_sites': sites,
            'quota': quota,
            'quota_type': quotaType,
            'quota_unit': quotaUnit,
            'ret_linegraph': true,
            'ret_streak': true
        }),
        success: function(response) {
            hideLoader('#card0', ['div.sub-today']);
            hideLoader('#card2', ['#chart1']);
            if (response['success']) {
                if ('linegraph' in response) {
                    window.raw_line_graph_data = response['linegraph'];
                    showTotalAndUnprodUsage();
                    filterAndDrawLineGraph();
                }
                if ('streak' in response && 'percent_usage_today' in response) {
                    showStreak(response['streak']);
    				showQuotaPercent(response['percent_usage_today']);
                }
            } else {
                // TODO
            }
        },
        statusCode: {
            500: function() {
              this.fail();
            }
        },
        fail: function() {
            // TODO
        }
    });
}
