window.onload = function() {
	// TODO: customize these requests
	var postData = {
		"minutes": 1440, // one day
		"max_sites": 5
	};

	// Get graph data from server.
	$.post({
		url: '/api/graph',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(postData),
		success: function(response) {
            console.log(response);
            title = "Last 24 Hours - Total Time: " + response.total;
			drawBarGraph(response.labels, response.values, "chart0", title);
		},
		fail: function() {
			// TODO: what happens here?
		}
	});
};
