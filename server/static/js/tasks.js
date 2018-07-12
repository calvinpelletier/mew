var _ENTER = 13;
var TASKS_CARD1_DATA_ELEMENT = new DataElement('#card1', ['.day-container']);
var TASKS_CARD2_DATA_ELEMENT = new DataElement('#card2', ['#categories-wrapper']);
var global_task_indicator_selected = null;
var DOW_TO_DOW_NUM = {'su': 0, 'm': 1, 'tu': 2, 'w': 3, 'th': 4, 'f': 5, 'sa': 6};
var DOW_NUM_TO_DOW = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];

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
        } else {
            // dow == 'empty' when removing task from a day
            var dow = indicatorPath.substring(indicatorPath.indexOf('_') + 1, indicatorPath.indexOf('.png'));
            assignTaskToDay(global_task_indicator_selected, dow);
        }
    }

    closeIndicatorPopup();
}

function onClickIndicator(target, e) {
    var id = target.parentNode.parentNode.id.substring(16);
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
    var id = target.id.substring(8);
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

function addTaskToContainer(taskText, taskId, container, completed, indicator='none') {
    var isDayTask = container.attr('id').startsWith('day');

    if (completed != 0) {
        var done = 'task-done ';
        if (!isDayTask) {
            indicator = 'done';
        }
    } else {
        var done = '';
    }

    if (isDayTask) {
        var id = 'day-task' + taskId;
        var wrapperId = 'day-task-wrapper' + taskId;
    } else {
        var id = 'cat-task' + taskId;
        var wrapperId = 'cat-task-wrapper' + taskId;
    }

    var html = '<div class="task ' + done + '" id="' + id + '" onclick="onClickTask(this)">' + taskText + '</div>';
    if (indicator != 'none') {
        var src = '/static/img/task_' + indicator + '.png';
        html = '<div class="task-indicator-wrapper"><img class="task-indicator" '
            + 'id="indicator' + taskId + '" '
            + 'onclick="onClickIndicator(this, event)" src="' + src + '" height="20" width="20"></div>'
            + html;
    }
    html = '<div class="task-wrapper" id="' + wrapperId + '">' + html + '</div>';

    container.append(html);
}

function finishTask(taskId) {
    $('#day-task' + taskId).addClass('task-done');
    $('#cat-task' + taskId).addClass('task-done');
    $('#indicator' + taskId).attr('src', '/static/img/task_done.png');

    $.post({
		url: '/api/tasks/finish',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'task_id': taskId
		}),
		success: function(resp) {

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
    $('#cat-task' + taskId).removeClass('task-done');

    var dayTask = $('#day-task' + taskId);
    if (dayTask.length != 0) {
        dayTask.removeClass('task-done');
        var dow = dayTask.parent().parent().attr('id').substring(3);
        $('#indicator' + taskId).attr('src', '/static/img/task_' + DOW_NUM_TO_DOW[dow] + '.png');
    } else {
        $('#indicator' + taskId).attr('src', '/static/img/task_empty.png');
    }

    $.post({
		url: '/api/tasks/unfinish',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
            'task_id': taskId
		}),
		success: function(resp) {

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

function assignTaskToDay(taskId, dow) {
    $('#indicator' + taskId).attr('src', '/static/img/task_' + dow + '.png');

    // remove the task from its previously assigned day
    $('#day-task-wrapper' + taskId).remove();

    if (dow == 'empty') {
        var dow_num = -1;
    } else {
        var dow_num = DOW_TO_DOW_NUM[dow];

        // add task to new day
        addTaskToContainer($('#cat-task' + taskId).text(), taskId, $('#day' + dow_num), 0);
    }

    $.post({
        url: '/api/tasks/assign',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
            'task_id': taskId,
            'dow': dow_num,
        }),
        success: function(resp) {
		},
		statusCode: {
            500: function() {
              this.fail();
            }
        },
		fail: function() {
            // TODO
		}
    })
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
                    addTaskToContainer(task['task'], task['task_id'], $('#day' + task['dow']), task['completed']);
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
		data: JSON.stringify({
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
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
                        if (task['dow'] == -1) {
                            var indicator = 'empty'
                        } else {
                            var indicator = DOW_NUM_TO_DOW[parseInt(task['dow'])];
                        }
                        addTaskToContainer(task['task'], task['task_id'], container, task['completed'], indicator);
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
