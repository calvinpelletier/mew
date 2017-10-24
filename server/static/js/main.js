

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

window.onload = function() {
	initSettings();
	requestBarGraphData();

	// Bundles a bunch of api calls into one
	// TODO: include bar graph data
	$.post({
		url: '/api/getmaindata',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			"timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
		}),
		success: function(response) {
			console.log(JSON.stringify(response));
			window.raw_line_graph_data = response['linegraph'];
			filterAndDrawLineGraph();

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

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		requestBarGraphData();
	});

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
		filterAndDrawLineGraph();
	});
};
