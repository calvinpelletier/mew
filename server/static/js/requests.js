// Bundles a bunch of api calls into one
// TODO: include bar graph data
function requestMainData(includeLineGraphData) {
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
                return
            }
		    if (includeLineGraphData) {
		        window.raw_line_graph_data = response['linegraph'];
                console.log(response['linegraph']);

                // Show usage today in top card
                if (window.raw_line_graph_data) {
                    let _data = window.raw_line_graph_data.data;
                    var today = _data[_data.length - 1]['summary'];
                    var total = today['_total'];
                    var unprod = today['_unprod'];
                    showTotalAndUnprodUsage(total, unprod);
                } else {
                    showTotalAndUnprodUsage(0, 0);
                }


                filterAndDrawLineGraph();
		    }
            // Draw streak
			if (response['streak'] != -1) {
				showStreak(response['streak']);
				showQuotaPercent(response['quota-percent']);
			}
		},
		statusCode: {
            500: function() {
              this.fail();
            }
        },
		fail: function() {
			toastr.error('Request for line graph data failed.');
			// TODO: create some sort of "loading failed graphic"
            // temporary solution - just hide the whole thing
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

function postUnprodSites(sites) {
    $.post({
        url: '/api/unprodsites',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'sites': sites
        }),
        success: function(response) {
            if (!response['success']) {
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

function postQuota(quota, quotaType, quotaUnit) {
    $.post({
        url: '/api/quota',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'quota': quota,
            'quota_type': quotaType,
            'quota_unit': quotaUnit
        }),
        success: function(response) {
            if (!response['success']) {
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
