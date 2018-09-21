var _ENTER = 13;
var TASKS_CARD1_DATA_ELEMENT = new DataElement('#card1', ['.day-container']);
var TASKS_CARD2_DATA_ELEMENT = new DataElement('#card2', ['#categories-wrapper', '.card2-links']);
var global_task_indicator_selected = null;
var DOW_TO_DOW_NUM = {'su': 0, 'm': 1, 'tu': 2, 'w': 3, 'th': 4, 'f': 5, 'sa': 6};
var DOW_NUM_TO_DOW = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
var global_category_colors = {};

window.onload = function() {
    TASKS_CARD1_DATA_ELEMENT.showLoader();
    TASKS_CARD2_DATA_ELEMENT.showLoader();
    requestTasks();
}


// init google auth
function onOAuthLoad() {
	gapi.load('auth2', function() {
		gapi.auth2.init();
	});
}

// ~~~~~~~~~~~~~
// INPUT FUNCTIONS
// ~~~~~~~~~~~~~
window.onclick = function(event) {
    if (global_task_indicator_selected != null
        && !event.target.classList.contains('task-indicator')
        && !event.target.classList.contains('indicator-popup')
    ) {
        closeIndicatorPopup();
    }
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
                if (type == 'category') {
                    var indicator = 'empty';
                } else {
                    var indicator = 'none';
                }
                addTaskToContainer(resp['task'], resp['task_id'], container, 0, indicator);
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

function onClickAddCategory() {
    // send category to server with 'unnamed' as title
    $.post({
        url: '/api/tasks/add-category',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({'name': 'unnamed'}),
        success: function(resp) {
            if (resp['success']) {
                $('#col' + resp['column'].toString()).append(
                    getCategoryHTML(resp['cid'], 'unnamed', resp['color'])
                );
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


function onMouseOverCatTitle(o) {
    var parent = $(o);
    var icons = parent.find('img');
    if (parent.find('.rename-cat').hasClass('hidden')) {
        // if we're not in edit mode
        icons.each(function (index) {
            $(this).removeClass('hidden');
        });
    }
}

function onMouseOutCatTitle(o) {
    var icons = $(o).find('img');
    icons.each(function (index) {
        $(this).addClass('hidden');
    });
}


function onClickEditCat(o) {
    var pencil = $(o);
    var parent = pencil.parent();
    var input = parent.find('.rename-cat');
    parent.find('.category-name-text').addClass('hidden');
    input.removeClass('hidden');
    pencil.addClass('hidden');
    input.select();
}

function renameCatKeyPress(o, e, cid) {
    if (e.keyCode == _ENTER) {
        var newName = o.value;
        uneditCategory(cid);
        renameCategory(cid, newName);
    }
}
// ~~~~~~~~~~~~~


// ~~~~~~~~~~~~~
// FROM SERVER
// ~~~~~~~~~~~~~
function requestTasks() {
    $.post({
        url: '/api/tasks/get',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
		}),
		success: function(resp) {
            if (resp['success']) {
                // TASK CATEGORIES
                // sort by row before adding to columns sequentially
                resp['categories'].sort(function(a,b) {
                    return (a['row'] > b['row']) ? 1 : ((b['row'] > a['row']) ? -1 : 0);
                });

                renderCategories(resp['categories']);

                // RENDER TASKS
                for (var category of resp['categories']) {
                    for (var task of category['tasks']) {
                        // dont show if task was cleared
                        if (task['cleared']) {continue;}

                        if (task['dow'] == -1) {
                            var indicator = 'empty'
                        } else {
                            var indicator = DOW_NUM_TO_DOW[parseInt(task['dow'])];
                        }
                        addTaskToContainer(task['task'], task['task_id'], $('#cat' + category['cid']), task['completed'], indicator);
                    }
                }

                TASKS_CARD2_DATA_ELEMENT.hideLoader();

                // WEEK TASKS
                $('#day' + resp['cur_dow'] + '-container').addClass('today-container');
                for (var task of resp['week_tasks']) {
                    if (task['category'] == -1) {
                        var color = 'none';
                    } else {
                        var color = global_category_colors[task['category']];
                    }
                    addTaskToContainer(task['task'], task['task_id'], $('#day' + task['dow']), task['completed'], 'none', color);
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
// ~~~~~~~~~~~~~


// ~~~~~~~~~~~~~
// TO SERVER
// ~~~~~~~~~~~~~
function clearFinishedTasks() {
    // get all elements that start with 'cat-task'
    var tasks = $('[id^=cat-task]');
    tasks.each(function() {
        if (this.classList.contains('task-done')) {
            // parent is task wrapper
            this.parentElement.remove();
        }
    });

    $.post({
		url: '/api/tasks/clear-finished',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
            // leaving this in case we need it
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

        var category = parseInt($('#cat-task' + taskId).parent().parent().attr('id').substring(3));

        // add task to new day
        addTaskToContainer(
            $('#cat-task' + taskId).text(),
            taskId,
            $('#day' + dow_num),
            0,
            'none',
            global_category_colors[category]
        );
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
    });
}

function renameCategory(cid, newName) {
    $.post({
        url: '/api/tasks/rename-category',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'cid': cid,
            'new_name': newName,
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

// there's also code to server in newTaskKeyPress and onClickAddCategory in input section

// ~~~~~~~~~~~~~


// ~~~~~~~~~~~~~
// HELPER FUNCTIONS
// ~~~~~~~~~~~~~
function renderCategories(categories) {
    categories.sort(function (a, b) {
        return a['row'] - b['row'];
    });
    for (var category of categories) {
        global_category_colors[category['cid']] = category['color'];
        $('#col' + category['column'].toString()).append(
            getCategoryHTML(category['cid'], category['name'], category['color'])
        );
    }
}

function closeIndicatorPopup() {
    var popup = $('.indicator-popup');
    popup.attr('style', 'display: none;');
    var arrow = $('.indicator-arrow');
    arrow.attr('style', 'display: none;');
    global_task_indicator_selected = null;
}


function addTaskToContainer(taskText, taskId, container, completed, indicator='none', color='none') {
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
        html = '<div class="task-indicator-wrapper"><img class="clickable task-indicator" '
            + 'id="indicator' + taskId + '" '
            + 'onclick="onClickIndicator(this, event)" src="' + src + '" height="20" width="20"></div>'
            + html;
    }
    if (color != 'none') {
        html = '<div class="color-strip-wrapper"><div class="color-strip" style="background-color: #' + color + '"></div></div>' + html;
        var stretch = ' style="align-items: stretch"';
    } else {
        var stretch = '';
    }
    html = '<div class="task-wrapper" id="' + wrapperId + '"' + stretch + '>' + html + '</div>';

    container.append(html);
}

function getCategoryHTML(cid, name, color, column) {
    var textColor = bgColorToTextColor(color);
    if (textColor == 'ffffff') {
        var pencil = '/static/img/pencil_white.png';
        var more = '/static/img/more_white.png';
    } else { // text color is black
        var pencil = '/static/img/pencil_black.png';
        var more = '/static/img/more_black.png';
    }

    var html = '<div class="category">'
        + '<div class="category-name" style="background-color: #' + color + '; color: #' + textColor + '"'
        + 'onmouseover="onMouseOverCatTitle(this)" onmouseout="onMouseOutCatTitle(this)">'
        + '<span class="category-name-text">' + name + '</span>'
        + '<input class="rename-cat hidden" type="text" style="color: #' + textColor + '" onkeypress="renameCatKeyPress(this, event, ' + cid + ')" value="' + name + '">'
        + '<img class="clickable cat-menu hidden" onclick="onClickCatMenu(this, event)" height="25" width="25" src="' + more + '">'
        + '<img class="clickable edit-cat hidden" onclick="onClickEditCat(this, event)" height="20" width="20" src="' + pencil + '">'
        + '</div>' + '<div id="cat' + cid + '">' + '</div>'
        + '<input class="new-item" type="text" value="" placeholder="add task" onkeypress="newTaskKeyPress(this, event, \'category\', '
        + cid + ')">' + '</div>';
    return html;
}

// returns white if average rgb value is <128 and black otherwise
function bgColorToTextColor(bg) {
    if ((parseInt(bg.substring(0,2), 16) + parseInt(bg.substring(2,4), 16) + parseInt(bg.substring(4,6), 16)) < 128 * 3) {
        return 'ffffff';
    } else {
        return '000000';
    }
}

function uneditCategory(cid) {
    var cat = $('#cat' + cid).parent();
    var label = cat.find('span');
    var input = cat.find('.rename-cat');
    label.html(input.val());
    label.removeClass('hidden');
    input.addClass('hidden');
}
// ~~~~~~~~~~~~~
