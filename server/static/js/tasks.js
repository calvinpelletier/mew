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

function addTaskToContainer(taskText, taskId, container, addIndicator) {
    var html = '<div class="task" id="' + taskId + '">' + taskText + '</div>';
    if (addIndicator) {
        html = '<div class="task-indicator-wrapper"><img class="task-indicator" src="/static/img/task_empty.png" height="15" width="15"></div>' + html;
    }
    html = '<div class="task-wrapper">' + html + '</div>';
    container.append(html);
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
                    addTaskToContainer(task['task'], task['task_id'], $('#day' + task['dow']), false);
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
                    var html = '<div class="category">'
                        + '<div class="category-name">' + category['category'] + '</div>'
                        + '<div id="cat' + category['cid'] + '">';
                    html += '</div>';
                    html += '<input class="new-item" type="text" value="" placeholder="add task" onkeypress="newTaskKeyPress(this, event, \'category\', ' + category['cid'] + ')">'
                    html += '</div>';
                    $('#col' + ((i+1) % 4).toString()).append(html);
                    var container = $('#cat' + category['cid']);
                    for (var task of category['tasks']) {
                        addTaskToContainer(task['task'], task['task_id'], container, true);
                    }
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

// TODO: add loader next to input field during post request
function newTaskKeyPress(o, e, type, i) {
    if (e.keyCode == _ENTER) {
        var data = {
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'task': o.value,
        };
        if (type == 'day') {
            var container = $('#day' + i);
            data['dow'] = i;
        } else { // type == category
            var container = $('#cat' + i);
            data['category'] = i;
        }

        $.post({
            url: '/api/tasks/add',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(resp) {
                addTaskToContainer(resp['task'], resp['task_id'], container, type == 'category');
                o.value = '';
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
}
