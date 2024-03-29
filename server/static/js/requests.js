// Bundles a bunch of api calls into one
// TODO: include bar graph data
function requestMainData(includeLineGraphData) {
    // Show the loader over card0 (the stats at the top of the page)
    CARD0_DATA_ELEMENT.showLoader();
    CARD2_DATA_ELEMENT.showLoader();
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
            // If no data, show the user a dialog that tells them to install
            // the Chrome extension.
            if (!response['success'] || response['linegraph'].data.length == 0) {
                $("#nodata-container").removeClass("hidden");
                $('#body-container').addClass('blur');
                $('#body-container').addClass('no-scrolling');
            } else {
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
            }

			CARD0_DATA_ELEMENT.hideLoader();
			CARD2_DATA_ELEMENT.hideLoader();
		},
		statusCode: {
            500: function() {
              this.fail();
            }
        },
		fail: function() {
			toastr.error('Request for line graph data failed.');
            drawLineGraphFailure(LG_FAIL_PLACEHOLDER);
            CARD0_DATA_ELEMENT.hideLoader();
            CARD2_DATA_ELEMENT.hideLoader();
		}
	});
}

function postBarGraphData(data, success, fail) {
    CARD1_DATA_ELEMENT.showLoader();
    // Get graph data from server.
    $.post({
        url: '/api/bargraph',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(response) {
            CARD1_DATA_ELEMENT.hideLoader();
            success(response);
        },
        statusCode: {
            500: function() {
                this.fail();
            }
        },
        fail: function(response) {
            CARD1_DATA_ELEMENT.hideLoader();
            fail(response);
        }
    });
}

function postSettings(sites, quota, quotaType, quotaUnit) {
    CARD0_DATA_ELEMENT.showLoader();
    CARD2_DATA_ELEMENT.showLoader();

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
            CARD0_DATA_ELEMENT.hideLoader();
            CARD2_DATA_ELEMENT.hideLoader();
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
