var _ENTER = 13;
var TASKS_CARD1_DATA_ELEMENT = new DataElement('#card1', ['.day-container']);
var TASKS_CARD2_DATA_ELEMENT = new DataElement('#card2', ['#categories-wrapper', '.card2-links']);
var global_popup_active = null;
var DOW_TO_DOW_NUM = {'su': 0, 'm': 1, 'tu': 2, 'w': 3, 'th': 4, 'f': 5, 'sa': 6};
var DOW_NUM_TO_DOW = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
var GEAR_ICON = '/static/img/gear.svg';
var MORE_ICON = '/static/img/more_black.png';
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
function onClickNewIndicator(target) {
    var indicatorPath = target.getAttribute('src');
    var dow = indicatorPath.substring(indicatorPath.indexOf('_') + 1, indicatorPath.indexOf('.png'));
    assignTaskToDay(global_popup_active, dow);
    closePopup();
}


function onClickTaskMenu(target, e) {
    var id = $(target).parent().parent().find('.task').attr('id').substring(8);
    openPopup(target, id, 'task-options-popup');
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
                addTaskToContainer(resp['task'], resp['task_id'], container, 0);
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

function onMouseOverTask(o) {
    var img = $(o).find('img');
    img.removeClass('hidden');
}

function onMouseOutTask(o) {
    var img = $(o).find('img');
    img.addClass('hidden');
}

function onClickEditCat(o) {
    var cat = $('#cat' + global_popup_active).parent();
    var input = cat.find('.rename-cat');
    cat.find('.category-name-text').addClass('hidden');
    input.removeClass('hidden');
    input.select();
}

function renameCatKeyPress(o, e, cid) {
    if (e.keyCode == _ENTER) {
        var newName = o.value;
        uneditCategory(cid);
        renameCategory(cid, newName);
    }
}

function renameCatBlur(o, cid) {
    var newName = o.value;
    uneditCategory(cid);
    renameCategory(cid, newName);
}

function onClickCatSettings(target, id) {
    openPopup(target, id, 'cat-options-popup');
}

function selectCatColor(o) {
    var style = $(o).attr('style');
    var color = style.substring(style.indexOf('#') + 1);
    var cat = $('#cat' + global_popup_active).parent();
    cat.attr('style', 'border-top: 3px solid #' + color);

    $.post({
		url: '/api/tasks/set-cat-color',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
            'cid': global_popup_active,
            'color': color
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
                            var dowLabel = 'none'
                        } else {
                            var dowLabel = DOW_NUM_TO_DOW[parseInt(task['dow'])];
                        }
                        addTaskToContainer(task['task'], task['task_id'], $('#cat' + category['cid']), task['completed'], dowLabel);
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
// ~~~~~~~~~~~~~


// ~~~~~~~~~~~~~
// TO SERVER
// ~~~~~~~~~~~~~
function clearFinishedTasks() {
    // get all elements that start with 'cat-task'
    var tasks = $('[id^=cat-task]');
    tasks.each(function() {
        if (this.classList.contains('task-done') && !this.classList.contains('day-task')) {
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
    $('#cat-task' + taskId).addClass('task-done');

    var dayTask = $('#day-task' + taskId);
    if (dayTask.length != 0) {
        dayTask.addClass('task-done');
    }

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
    var dowLabel = $('#dow-label' + taskId);

    // remove the task from its previously assigned day
    $('#day-task' + taskId).parent().parent().remove();

    if (dow == 'empty') {
        dowLabel.addClass('hidden');
        var dow_num = -1;
    } else {
        dowLabel.removeClass('hidden');
        dowLabel.html(dow);

        var dow_num = DOW_TO_DOW_NUM[dow];

        var category = parseInt($('#cat-task' + taskId).parent().parent().parent().attr('id').substring(3));

        // add task to new day
        addTaskToContainer(
            $('#cat-task' + taskId).text(),
            taskId,
            $('#day' + dow_num),
            0,
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

function closePopup() {
    $('.popup-container').addClass('hidden');
    $('#task-options-popup').attr('style', 'display: none;');
    $('#cat-options-popup').attr('style', 'display: none;');
    $('.options-arrow').attr('style', 'display: none;');
    global_popup_active = null;
}


function addTaskToContainer(taskText, taskId, container, completed, dow='none', color='none') {
    var done = completed != 0 ? 'task-done ' : '';
    if (container.attr('id').startsWith('day')) {
        var id = 'day-task' + taskId;
        var dowLabel = '';
        var taskMenu = '';
    } else {
        var id = 'cat-task' + taskId;
        if (dow == 'none') {
            var dowLabel = '<div class="task-dow-label hidden" id="dow-label' + taskId + '"></div>';
        } else {
            var dowLabel = '<div class="task-dow-label" id="dow-label' + taskId + '">' + dow + '</div>'
        }
        var taskMenu =
            '<div class="task-menu-wrapper">' +
                '<img class="clickable task-menu hidden" onclick="onClickTaskMenu(this, event)"' +
                    'height="25" width="25" src="' + MORE_ICON + '">' +
            '</div>';
    }

    if (color != 'none') {
        var stretch = 'style="align-items: stretch"';
        var colorStrip =
            '<div class="color-strip-wrapper">' +
                '<div class="color-strip" style="background-color: #' + color + '"></div>' +
            '</div>';
    } else {
        var stretch = '';
        var colorStrip = '';
    }


    var html =
        '<div class="task-wrapper" ' + stretch + ' onmouseover="onMouseOverTask(this)" onmouseout="onMouseOutTask(this)">' +
            colorStrip +
            '<div class="task-subwrapper">' +
                dowLabel +
                '<div class="task ' + done + '" id="' + id + '" onclick="onClickTask(this)">' +
                    taskText +
                '</div>' +
                 taskMenu +
            '</div>' +
        '</div>';

    container.append(html);
}

function getCategoryHTML(cid, name, color, column) {
    var textColor = bgColorToTextColor(color);
    if (textColor == 'ffffff') {
        var more = '/static/img/more_white.png';
    } else { // text color is black
        var pencil = '/static/img/pencil_black.png';
        var more = '/static/img/more_black.png';
    }

    var html =
        '<div class="category" style="border-top: 3px solid #' + color + '">' +
            '<div class="category-header">' +
                '<span class="category-name-text">' + name + '</span>' +
                '<input class="rename-cat hidden" type="text" onblur="renameCatBlur(this, ' + cid + ')"' +
                    '" onkeypress="renameCatKeyPress(this, event, ' + cid + ')" value="' + name + '">' +
                '<div class="cat-settings-wrapper">' +
                    '<img class="clickable cat-settings-icon" onclick="onClickCatSettings(this, ' + cid + ')"' +
                        'height="25" width="25" src="' + GEAR_ICON + '">' +
                '</div>' +
            '</div>' +
            '<div id="cat' + cid + '">' + '</div>' +
            '<input class="new-item" type="text" value="" placeholder="add task"' +
                'onkeypress="newTaskKeyPress(this, event, \'category\', ' + cid + ')">' +
        '</div>';
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

function openPopup(target, sourceId, popupType) {
    global_popup_active = sourceId;
    $('.popup-container').removeClass('hidden');
    var popup = $('#' + popupType);
    var posLeft = target.offsetLeft - popup.outerWidth() / 2 + 9;
    if (posLeft < 15) {
        posLeft = 15;
    }
    if (posLeft + popup.outerWidth() > $(window).width()) {
        posLeft = $(window).width() - popup.outerWidth();
    }
    popup.attr('style', 'display: none; left: ' + posLeft + 'px; top: ' + ($(target).offset().top - $(document).scrollTop() + 25) + 'px;');
    popup.fadeIn(200);
    var arrow = $('.options-arrow');
    arrow.attr('style', 'display: none; left: ' + (target.offsetLeft) + 'px; top: ' + ($(target).offset().top - $(document).scrollTop() + 17) + 'px;');
    arrow.fadeIn(200);
}
// ~~~~~~~~~~~~~
