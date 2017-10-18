

function setQuotaPercent(percent) {
	$('#quota-percent').text(percent.toString() + '%');
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
			window.raw_line_graph_data = response['linegraph'];
			filterAndDrawLineGraph();

			// TODO: set streak
			console.log(response['streak'])
		},
		statusCode: {
            500: function() {
              this.fail();
            }
        },
		fail: function() {
			toastr.error('Request for line graph data failed.');
		}
	});

	$('#chart0-options input.timeframe-choice').on('change', function (e) {
		requestBarGraphData();
	});

	$('#chart1-options input.timeframe-choice').on('change', function (e) {
		filterAndDrawLineGraph();
	});

	setQuotaPercent(65);

	$('#settings-icon').on('click', function(e) {
		console.log("Clicked settings.");
		$('#body-container').attr('class', 'blur');
		$('#settings-dialog').show();

		// Temporary - just to close the dialog
		$('#settings-dialog').on('click', function(e) {
			$('#body-container').removeClass('blur');
			$('#settings-dialog').hide();
		});
	});
};
