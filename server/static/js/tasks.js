var _ENTER = 13;

window.onload = function() {
    requestTasksCurWeek();
}

function onOAuthLoad() {
    // init google auth
	gapi.load('auth2', function() {
		gapi.auth2.init();
	});
}

function requestTasksCurWeek() {
    // Show the loader over card0 (the stats at the top of the page)
    $.post({
		url: '/api/gettasks',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
		}),
		success: function(response) {
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

function newTaskKeyPress(o, e, i) {
    if (e.keyCode == _ENTER) {
        var day = $('#day' + i);
        day.append('<div class="item">' + o.value + '</div>');
        o.value = '';
    }
}
