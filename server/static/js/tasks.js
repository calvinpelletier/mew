var _ENTER = 13;
var TASKS_CARD1_DATA_ELEMENT = new DataElement('#card1', ['.day-container']);
var TASKS_CARD2_DATA_ELEMENT = new DataElement('#card2', ['#categories-wrapper', '.card2-links']);
var TASKS_CARD3_DATA_ELEMENT = new DataElement('#card3', ['#tasks-completed-over-time', '#tasks-completed-per-month']);
var global_popup_active = null;
var DOW_TO_DOW_NUM = {'su': 0, 'm': 1, 'tu': 2, 'w': 3, 'th': 4, 'f': 5, 'sa': 6};
var DOW_NUM_TO_DOW = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
var GEAR_ICON = '/static/img/gear.svg';
var MORE_ICON = '/static/img/more_black.png';
var global_category_colors = {};
var global_category_order = null;

window.onload = function() {
    TASKS_CARD1_DATA_ELEMENT.showLoader();
    TASKS_CARD2_DATA_ELEMENT.showLoader();
    requestTasks();
    requestTaskStats();
}

// init google auth
function onOAuthLoad() {
	gapi.load('auth2', function() {
		gapi.auth2.init();
	});
}

function nullFunction() {}

// ~~~~~~~~~~~~~
// INPUT FUNCTIONS
// ~~~~~~~~~~~~~
function onClickNewIndicator(target) {
    var indicatorPath = target.getAttribute('src');
    var dow = indicatorPath.substring(indicatorPath.indexOf('_') + 1, indicatorPath.indexOf('.png'));
    assignTaskToDay(global_popup_active, dow);
    closePopup();
}

function onClickDayTaskMenu(target, e) {
    var id = $(target).parent().parent().find('.task').attr('id').substring(8);
    openPopup(target, id, 'day-task-options-popup');
}

function onClickCatTaskMenu(target, e) {
    var id = $(target).parent().parent().find('.task').attr('id').substring(8);
    openPopup(target, id, 'cat-task-options-popup');
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
    if (e.keyCode == _ENTER && o.value) {
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
    closePopup();
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

function updateCatColor(o) {
    var color = o.value;
    console.log(color);
    // var style = $(o).attr('style');
    // var color = style.substring(style.indexOf('#') + 1);
    var cat = $('#cat' + global_popup_active).parent();
    cat.attr('style', 'border-top: 5px solid #' + color);

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

function onClickDeleteTask() {
    $('#cat-task' + global_popup_active).parent().parent().remove();
    $('#day-task' + global_popup_active).parent().parent().remove();

    $.post({
        url: '/api/tasks/remove',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'task_id': global_popup_active
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

    closePopup();
}

function onClickDeleteCat() {
    $('#cat' + global_popup_active).parent().remove();

    $.post({
        url: '/api/tasks/delete-category',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            'cid': global_popup_active
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

    closePopup();
}

function onClickOffPopup(e) {
    if (!$(e.target).closest('.options-popup').length) {
        closePopup();
    }
}

function onClickMoveCategories() {
    // store current order in global_category_order
    global_category_order = [[], [], [], []];
    for (var col = 0; col < 4; col++) {
        $('#col' + col).children('.category').each(function(i) {
            global_category_order[col].push(this.id.substring('cat-wrapper'.length));
        });
    }

    // hide original card2 links
    $('#card2-links-not-reorganizing').addClass('hidden');

    // hide original category controls
    $('.cat-settings-wrapper').each(function(i) {
        $(this).addClass('hidden');
    });

    // hide cat tasks
    $('.task-wrapper').each(function(i) {
        if (this.parentElement.id.startsWith('cat')) {
            $(this).addClass('hidden');
        }
    });
    $('.new-item').each(function(i) {
        if (this.parentElement.id.startsWith('cat-wrapper')) {
            $(this).addClass('hidden');
        }
    });

    // show new card2 links
    $('#card2-links-reorganizing').removeClass('hidden');

    // show new category controls
    $('.cat-move-wrapper').each(function(i) {
        $(this).removeClass('hidden');
    });
}

function onClickStopMovingCategories() {
    // send new order to backend

    // hide new card 2 links
    $('#card2-links-reorganizing').addClass('hidden');

    // hide new category controls
    $('.cat-move-wrapper').each(function(i) {
        $(this).addClass('hidden');
    });

    // show original card2 links
    $('#card2-links-not-reorganizing').removeClass('hidden');

    // show original category controls
    $('.cat-settings-wrapper').each(function(i) {
        $(this).removeClass('hidden');
    });

    // show cat tasks
    $('.task-wrapper').each(function(i) {
        if (this.parentElement.id.startsWith('cat')) {
            $(this).removeClass('hidden');
        }
    });
    $('.new-item').each(function(i) {
        if (this.parentElement.id.startsWith('cat-wrapper')) {
            $(this).removeClass('hidden');
        }
    });
}

function onClickCatMove(o, dir, cid) {
    // get cur row and column
    var col = -1;
    var row = -1;
    var nFound = 0;
    console.log(global_category_order);
    console.log(cid);
    for (var i = 0; i < 4; i++) {
        var idx = global_category_order[i].indexOf(cid);
        console.log(idx);
        if (idx != -1) {
            col = i;
            row = idx;
            nFound++;
        }
    }
    if (nFound != 1) {
        console.log('[FATAL] found cid in more or less than 1 columns');
        return;
    }

    // adjust global_category_order
    if (dir == 'up') {
        if (row == 0) {return;}
        var swap = global_category_order[col][row - 1];
        global_category_order[col][row - 1] = global_category_order[col][row];
        global_category_order[col][row] = swap;
    } else if (dir == 'down') {
        if (row == global_category_order[col].length - 1) {return;}
        var swap = global_category_order[col][row + 1];
        global_category_order[col][row + 1] = global_category_order[col][row];
        global_category_order[col][row] = swap;
    } else if (dir == 'left') {
        if (col == 0) {return;}
        global_category_order[col - 1].push(cid);
        global_category_order[col].splice(row, 1);
    } else if (dir == 'right') {
        if (col == global_category_order.length - 1) {return;}
        global_category_order[col + 1].push(cid);
        global_category_order[col].splice(row, 1);
    } else {
        console.log('[FATAL] should never happen');
        return;
    }

    // send to back end
    $.post({
        url: '/api/tasks/set-cat-order',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
            'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
			'order': global_category_order,
		}),
		success: function(resp) {
            if (resp['success']) {
                // remove from dom and re-render because it's easier than shifting everything around
                // also re-fetch data from backend because i'm lazy and don't want to refactor the frontend code

                // clean dom
                $('.column').each(function(i) {
                    this.innerHTML = '';
                })

                // sort by row before adding to columns sequentially
                resp['categories'].sort(function(a,b) {
                    return (a['row'] > b['row']) ? 1 : ((b['row'] > a['row']) ? -1 : 0);
                });

                renderCategories(resp['categories']);

                // add tasks to dom but keep hidden
                for (var category of resp['categories']) {
                    for (var task of category['tasks']) {
                        if (task['dow'] == -1) {
                            var dowLabel = 'none'
                        } else {
                            var dowLabel = DOW_NUM_TO_DOW[parseInt(task['dow'])];
                        }
                        addTaskToContainer(
                            task['task'],
                            task['task_id'],
                            $('#cat' + category['cid']),
                            task['completed'],
                            dowLabel,
                            'none',
                            true // hide task
                        );
                    }
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
                        var color = getCatColor(task['category']);
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

function requestTaskStats() {
    $.post({
        url: '/api/tasks/stats',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
		}),
		success: function(resp) {
            if (resp['success']) {
                console.log(resp['tasks_completed_over_time']);
                console.log(resp['tasks_completed_per_month']);
                createLineGraph(
                    resp['tasks_completed_over_time'],
                    'tasks-completed-over-time',
                    'Total Tasks Completed'
                );
                createLineGraph(
                    resp['tasks_completed_per_month'],
                    'tasks-completed-per-month',
                    'Tasks Completed Per Month'
                );
                TASKS_CARD3_DATA_ELEMENT.hideLoader();
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
    $('#day-task' + taskId).addClass('task-done');

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
        dowLabel.parent().parent().addClass('no-strip');
    } else {
        dowLabel.removeClass('hidden');
        dowLabel.html(dow);
        dowLabel.parent().parent().removeClass('no-strip');

        var dow_num = DOW_TO_DOW_NUM[dow];

        var category = parseInt($('#cat-task' + taskId).parent().parent().parent().attr('id').substring(3));

        // add task to new day
        addTaskToContainer(
            $('#cat-task' + taskId).text(),
            taskId,
            $('#day' + dow_num),
            0,
            'none',
            getCatColor(category)
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
function renderCategories(categories, moveMode=false) {
    categories.sort(function (a, b) {
        return a['row'] - b['row'];
    });
    for (var category of categories) {
        global_category_colors[category['cid']] = category['color'];
        $('#col' + category['column'].toString()).append(
            getCategoryHTML(category['cid'], category['name'], category['color'], moveMode)
        );
    }
}

function closePopup() {
    $('.popup-container').addClass('hidden');
    $('#cat-task-options-popup').attr('style', 'display: none;');
    $('#day-task-options-popup').attr('style', 'display: none;');
    $('#cat-options-popup').attr('style', 'display: none;');
    $('.options-arrow').attr('style', 'display: none;');
    global_popup_active = null;
}

function addTaskToContainer(taskText, taskId, container, completed, dow='none', color='none', hidden=false) {
    var done = completed != 0 ? 'task-done ' : '';
    if (container.attr('id').startsWith('day')) {
        var id = 'day-task' + taskId;
        var dowLabel = '';
        var taskMenuFunction = 'onClickDayTaskMenu';
        if (color != 'none') {
            var strip = '<div class="task-strip" style="background-color: #' + color + '"></div>';
            var noStrip = '';
        } else {
            var strip = '<div class="task-strip hidden" style="background-color: #fff"></div>';
            var noStrip = 'no-strip';
        }
    } else {
        var id = 'cat-task' + taskId;
        var taskMenuFunction = 'onClickCatTaskMenu';
        if (dow == 'none') {
            var noStrip = 'no-strip';
            var strip = '<div class="task-strip hidden" id="dow-label' + taskId + '"></div>';
        } else {
            var noStrip = '';
            var strip = '<div class="task-strip" id="dow-label' + taskId + '">' + dow + '</div>'
        }
    }
    hidden = hidden ? ' hidden' : ' ';

    var html =
        '<div class="task-wrapper ' + noStrip + hidden + '" onmouseover="onMouseOverTask(this)" onmouseout="onMouseOutTask(this)">' +
            '<div class="task-subwrapper">' +
                strip +
                '<div class="task ' + done + '" id="' + id + '" onclick="onClickTask(this)">' +
                    taskText +
                '</div>' +
                '<div class="task-menu-wrapper">' +
                    '<img class="clickable task-menu hidden" onclick="' + taskMenuFunction + '(this, event)"' +
                        'height="25" width="25" src="' + MORE_ICON + '">' +
                '</div>' +
            '</div>' +
        '</div>';

    container.append(html);
}

function getCategoryHTML(cid, name, color, column, moveMode) {
    var textColor = bgColorToTextColor(color);
    if (textColor == 'ffffff') {
        var more = '/static/img/more_white.png';
    } else { // text color is black
        var pencil = '/static/img/pencil_black.png';
        var more = '/static/img/more_black.png';
    }

    var moveControlsHidden = moveMode ? '' : ' hidden';
    var settingsHidden = moveMode ? ' hidden' : '';
    var newItemHidden = moveMode ? ' hidden' : '';

    var html =
        '<div id="cat-wrapper' + cid + '" class="category" style="border-top: 5px solid #' + color + '">' +
            '<div class="category-header">' +
                '<span class="category-name-text">' + name + '</span>' +
                '<input class="rename-cat hidden" type="text" onblur="renameCatBlur(this, ' + cid + ')"' +
                    '" onkeypress="renameCatKeyPress(this, event, ' + cid + ')" value="' + name + '">' +
                '<div class="cat-move-wrapper' + moveControlsHidden + '">' +
                    '<img class="clickable cat-move-icon" onclick="onClickCatMove(this, \'left\', \'' + cid +
                        '\')" src="/static/img/arrow_left.png" height="20" width="20">' +
                    '<img class="clickable cat-move-icon" onclick="onClickCatMove(this, \'up\', \'' + cid +
                        '\')" src="/static/img/arrow_up.png" height="20" width="20">' +
                    '<img class="clickable cat-move-icon" onclick="onClickCatMove(this, \'down\', \'' + cid +
                        '\')" src="/static/img/arrow_down.png" height="20" width="20">' +
                    '<img class="clickable cat-move-icon" onclick="onClickCatMove(this, \'right\', \'' + cid +
                        '\')" src="/static/img/arrow_right.png" height="20" width="20">' +
                '</div>' +
                '<div class="cat-settings-wrapper' + settingsHidden + '">' +
                    '<img class="clickable cat-settings-icon" onclick="onClickCatSettings(this, ' + cid + ')"' +
                        'height="25" width="25" src="' + GEAR_ICON + '">' +
                '</div>' +
            '</div>' +
            '<div id="cat' + cid + '">' + '</div>' +
            '<input class="new-item' + newItemHidden + '" type="text" value="" placeholder="add task"' +
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
    if (popupType == 'cat-options-popup') {
        document.getElementById('jscolorValueElem').jscolor.fromString(getCatColor(sourceId));
        document.getElementById('jscolorButtonElem').jscolor.fromString(getCatColor(sourceId));
    }

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
    popup.focus();
}

function getCatColor(cid) {
    var style = $('#cat' + cid).parent().attr('style');
    return style.substring(style.indexOf('#') + 1);
}

function createLineGraph(data, containerId, title) {
    for (i in data) {
        data[i][0] *= 1000;
    }
    Highcharts.chart(containerId, {
        chart: {
            type: 'line',
            zoomType: 'xy'
        },
        title: {
            text: title
        },
        xAxis: {
            type: 'datetime',
            labels: {
                format: '{value:%Y-%m-%d}',
                rotation: 45,
                align: 'left',
                style: {
                    fontSize: '12px'
                }
            },
            gridLineWidth: 1,
        },
        yAxis: {
            title: {
                text: ''
            },
        },
        series: [{
            name: 'tasks',
            data: data
        }],
        credits: {
            enabled: false
        }
    });
}
// ~~~~~~~~~~~~~
