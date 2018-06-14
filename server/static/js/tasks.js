var _ENTER = 13;
var TASKS_CARD1_DATA_ELEMENT = new DataElement('#card1', ['.day-container']);
var TASKS_CARD2_DATA_ELEMENT = new DataElement('#card2', ['#categories-wrapper']);

window.onload = function() {
    TASKS_CARD1_DATA_ELEMENT.showLoader();
    TASKS_CARD2_DATA_ELEMENT.showLoader();
    requestTasksCurWeek();
    requestTaskCategories();
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
		success: function(resp) {
            if (resp['success']) {
                $('#day' + resp['cur_dow'] + '-container').addClass('today-container');

                for (var task of resp['tasks']) {
                    $('#day' + task['dow']).append('<div class="task dark">' + task['task'] + '</div>');
                }

                TASKS_CARD1_DATA_ELEMENT.hideLoader();
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

function requestTaskCategories() {
    $.post({
		url: '/api/tasks/getcategories',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({}),
		success: function(resp) {
            if (resp['success']) {
                var i;
                for (i = 0; i < resp['categories'].length; i++) {
                    var category = resp['categories'][i];
                    var html = '<div class="category" id="cat' + category['cid'] + '">'
                        + '<div class="category-name">' + category['category'] + '</div>';
                    for (var task of category['tasks']) {
                        html += '<div class="task">' + task['task'] + '</div>'
                    }
                    html += '<input class="new-item" type="text" value="" placeholder="add task" onkeypress="newTaskKeyPress(this, event, \'category\', ' + category['cid'] + ')">'
                    html += '</div>';
                    $('#col' + ((i+1) % 4).toString()).append(html);
                }
                var addCatHtml = '<div class="add-category"><div class="bar vertical"></div><div class="bar horizontal"></div></div>';
                $('#col' + ((i+1) % 4).toString()).append(addCatHtml);


                TASKS_CARD2_DATA_ELEMENT.hideLoader();
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
