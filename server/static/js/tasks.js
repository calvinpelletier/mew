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
    $.post({
		url: '/api/tasks/getbyweek',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
		}),
		success: function(response) {
            console.log(response);
            if (response['success']) {
                for (var task of response['tasks']) {
                    $('#day' + task['dow']).append('<div class="item">' + task['task'] + '</div>');
                }
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

function newTaskKeyPress(o, e, i) {
    if (e.keyCode == _ENTER) {
        var day = $('#day' + i);
        day.append('<div class="item">' + o.value + '</div>');

        $.post({
            url: '/api/tasks/add',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                'task': o.value,
                'dow': parseInt(i),
            }),
            success: function(response) {
                // TODO maybe add some indication of a task being saved successfully
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

        o.value = '';
    }
}
