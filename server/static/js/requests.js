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
		    if (includeLineGraphData) {
		        window.raw_line_graph_data = response['linegraph'];
                console.log(response['linegraph']);
                filterAndDrawLineGraph();
		    }

			if (response['streak'] != -1) {
				$('#streak-val').text(response['streak'].toString());
				setQuotaPercent(response['quota-percent']);
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