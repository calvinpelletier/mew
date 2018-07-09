var _ENTER = 13;
var TASKS_CARD1_DATA_ELEMENT = new DataElement('#card1', ['.day-container']);
var TASKS_CARD2_DATA_ELEMENT = new DataElement('#card2', ['#categories-wrapper']);
var global_task_indicator_selected = null;

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

function onClickNewIndicator(target) {
    var indicatorPath = target.getAttribute('src');
    var oldIndicator = $('#indicator' + global_task_indicator_selected).attr('src');
    if (indicatorPath != oldIndicator) {
        if (oldIndicator == '/static/img/task_done.png') {
            // indicator used to be done but now isnt
            unfinishTask(global_task_indicator_selected);
        } else if (indicatorPath == '/static/img/task_done.png') {
            finishTask(global_task_indicator_selected);
        }
    }

    closeIndicatorPopup();
}

function onClickIndicator(target, e) {
    var id = target.parentNode.parentNode.id.substring(7);
    global_task_indicator_selected = id;
    var popup = $('.indicator-popup');
    var posLeft = target.offsetLeft - popup.outerWidth() / 2 + 9;
    if (posLeft < 15) {
        posLeft = 15;
    }
    popup.attr('style', 'display: none; left: ' + posLeft + 'px; top: ' + (target.offsetTop + 25) + 'px;');
    popup.fadeIn(200);
    var arrow = $('.indicator-arrow');
    arrow.attr('style', 'display: none; left: ' + (target.offsetLeft) + 'px; top: ' + (target.offsetTop + 17) + 'px;');
    arrow.fadeIn(200);
}

function onClickTask(target) {
    var id = target.id.substring(4);
    if (target.classList.contains('task-done')) {
        unfinishTask(id);
    } else {
        finishTask(id);
    }
}

function closeIndicatorPopup() {
    var popup = $('.indicator-popup');
    popup.attr('style', 'display: none;');
    var arrow = $('.indicator-arrow');
    arrow.attr('style', 'display: none;');
}

function addTaskToContainer(taskText, taskId, container, addIndicator, completed) {
    var done = '';
    var src = '/static/img/task_empty.png';
    if (completed != 0) {
        done = 'task-done';
        src = '/static/img/task_done.png';
    }
    var html = '<div class="task ' + done + '" id="task' + taskId + '" onclick="onClickTask(this)">' + taskText + '</div>';
    if (addIndicator) {
        html = '<div class="task-indicator-wrapper"><img class="task-indicator" '
            + 'id="indicator' + taskId + '" '
            + 'onclick="onClickIndicator(this, event)" src="' + src + '" height="20" width="20"></div>'
            + html;
    }
    html = '<div class="task-wrapper" id="wrapper' + taskId + '">' + html + '</div>';
    container.append(html);
}

function finishTask(taskId) {
    $.post({
		url: '/api/tasks/finish',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'task_id': taskId
		}),
		success: function(resp) {
            $('#task' + taskId).addClass('task-done');
            $('#indicator' + taskId).attr('src', '/static/img/task_done.png');
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

function unfinishTask(taskId) {
    $.post({
		url: '/api/tasks/unfinish',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
            'task_id': taskId
		}),
		success: function(resp) {
            $('#task' + taskId).removeClass('task-done');
            $('#indicator' + taskId).attr('src', '/static/img/task_empty.png');
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
                    addTaskToContainer(task['task'], task['task_id'], $('#day' + task['dow']), false, task['completed']);
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
                        addTaskToContainer(task['task'], task['task_id'], container, true, task['completed']);
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
