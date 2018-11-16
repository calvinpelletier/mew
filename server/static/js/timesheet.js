var CARD1_DATA_ELEMENT = new DataElement('#card1', ['#canvas']);
var DAY_START_HOUR = 5;
var TAG_TO_COLOR = {
    'none': '#000000',
    'sleep': '#0000ff',
}

var W = $(window).width() - 35;
var H = $(window).height() - 130;
var OFFSET_X = 65;
var OFFSET_Y = 20;
var HOUR_H = Math.floor((H - OFFSET_Y) / 24);
var DAY_W = Math.floor((W - OFFSET_X) / 7);
var EXTERNAL_OFFSET_X = null;
var EXTERNAL_OFFSET_Y = null;

// adjust H and W after hour_w and day_w were rounded down
H = HOUR_H * 24 + OFFSET_Y;
W  = DAY_W * 7 + OFFSET_X;

var global_schedule;
var global_labels;
var global_candidate = {
    start: null,
    end: null,
    min_end: null, // start + 15 minutes, calculated when start is calculated
    day: null,
    tag: 'none',
}
var global_canvas;
var global_mouse_down = false;


window.onload = function() {
    $('#card1').append('<canvas id="canvas" class="hidden" width="'+W+
        '" height="'+H+'" style="margin: 18px 10px"></canvas>');
    global_canvas = document.getElementById('canvas');
    global_canvas.addEventListener('mousedown', onClick);
    global_canvas.addEventListener('mousemove', onMouseMove);
    global_canvas.addEventListener('mouseup', onMouseUp);
    CARD1_DATA_ELEMENT.showLoader();
    requestSchedule();
}


function requestSchedule() {
    $.post({
        url: '/api/timesheet/get',
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify({
			'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
		}),
		success: function(resp) {
            if (resp['success']) {
                CARD1_DATA_ELEMENT.hideLoader();
                // global_schedule = JSON.parse(resp['schedule']);
                global_labels = resp['labels'];
                console.log(global_labels);
                draw();
            }
		}
	});
}

function onClick(event) {
    if (EXTERNAL_OFFSET_X == null) {
        var rect = global_canvas.getBoundingClientRect();
        EXTERNAL_OFFSET_X = rect.left;
        EXTERNAL_OFFSET_Y = rect.top;
    }
    var x = event.pageX - EXTERNAL_OFFSET_X;
    var y = event.pageY - EXTERNAL_OFFSET_Y;

    // check within timesheet
    if (x < OFFSET_X || y < OFFSET_Y || x > W || y > H) {
        return;
    }

    var day = dayFromX(x);
    var idx = labelIdxFromY(day, y);
    if (idx == null) {
        var start = yToTimeint(y, 'down');
        var end = start + 15;
        if (end % 100 == 60) {
            // add one hour and zero the minutes
            end = (Math.floor(end / 100) + 1) * 100;
        }
        global_candidate.start = start;
        global_candidate.end = end;
        global_candidate.min_end = end;
        global_candidate.day = day;
        console.log(global_candidate);
    } else {
        // TODO: select label and show options
    }

    draw();
    global_mouse_down = true;
}


function onMouseMove(event) {
    if (!global_mouse_down) {
        return;
    }
    var x = event.pageX - EXTERNAL_OFFSET_X;
    var y = event.pageY - EXTERNAL_OFFSET_Y;
    var end = yToTimeint(y, 'up');
    if (end < global_candidate.min_end) {
        global_candidate.end = global_candidate.min_end;
    } else {
        global_candidate.end = end;
    }
    draw();
}


function onMouseUp(event) {
    global_mouse_down = false;

    global_labels[global_candidate.day].push({
        'start': global_candidate.start,
        'end': global_candidate.end,
        'tag': 'none',
    });
}


function draw() {
    var ctx = global_canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // hour lines
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 3;

    for (var i = 1; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET_X, OFFSET_Y + i * HOUR_H);
        ctx.lineTo(W - 4, OFFSET_Y + i * HOUR_H);
        ctx.stroke();
    }

    // half hour lines
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1;
    for (var i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo(OFFSET_X, OFFSET_Y + i * HOUR_H + Math.floor(HOUR_H / 2));
        ctx.lineTo(W - 4, OFFSET_Y + i * HOUR_H + Math.floor(HOUR_H / 2));
        ctx.stroke();
    }

    // hour labels
    ctx.fillStyle = '#2d333c';
    ctx.font = '15px "Courier New"';
    for (var i = 0; i < 24; i++) {
        ctx.fillText(hourToText(i + DAY_START_HOUR), 0, OFFSET_Y + i * HOUR_H + 5);
    }

    // day boxes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 5;
    var x = OFFSET_X;
    for (var i = 0; i < 7; i++) {
        ctx.strokeRect(x+i*DAY_W, OFFSET_Y, DAY_W, H - OFFSET_Y);
    }

    // day labels
    ctx.fillStyle = '#2d333c';
    ctx.font = '20px "Courier New"';
    var daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = 0; i < 7; i++) {
        ctx.fillText(daysOfWeek[i], OFFSET_X + Math.round((i + 0.5) * DAY_W), 15);
    }

    drawTimesheet(ctx, 'labels');

    // candidate
    if (global_candidate.start != null) {
        ctx.fillStyle = TAG_TO_COLOR[global_candidate.tag];
        drawLabel(ctx, global_candidate.start, global_candidate.end, global_candidate.day);
    }
}


function drawTimesheet(ctx, which) {
    if (which == 'labels') {
        var data = global_labels;
    } else { // schedule
        var data = global_schedule;
    }

    for (var day = 0; day < 7; day++) {
        for (var i in data[day]) {
            ctx.fillStyle = TAG_TO_COLOR[data[day][i].tag];
            drawLabel(ctx, data[day][i].start, data[day][i].end, i);
        }
    }
}


function drawLabel(ctx, start_timeint, end_timeint, day) {
    y_start = timeintToYCoord(start_timeint);
    y_end = timeintToYCoord(end_timeint);
    roundRect(ctx,
        OFFSET_X + DAY_W * day + 2,
        y_start,
        DAY_W - 4,
        y_end - y_start - 1
    );
}


function labelIdxFromY(day, y) {
    for (var i in global_labels[day]) {
        if (y > timeintToYCoord(global_labels[day][i].start) &&
            y < timeintToYCoord(global_labels[day][i].end))
        {
            return i;
        }
    }
    return null;
}


function dayFromX(x) {
    return Math.floor((x - OFFSET_X) / DAY_W);
}


function timeintToYCoord(timeint) {
    var minute = timeint % 100;

    // sanity
    if (minute != 0 && minute != 15 && minute != 30 && minute != 45) {
        alert('shits fucked yo');
        return;
    }

    var hour = Math.floor(timeint / 100) - DAY_START_HOUR;
    if (hour < 0) {
        hour += 24;
    }
    return OFFSET_Y + HOUR_H * hour + Math.floor(HOUR_H * (timeint % 100) / 60);
}


function yToTimeint(y, round) {
    var hour = Math.floor((y - OFFSET_Y) / HOUR_H);
    var yRemainder = y - (hour * HOUR_H + OFFSET_Y);
    hour = (hour + DAY_START_HOUR) % 24;
    if (round == 'up') {
        var minute = Math.ceil(yRemainder / (HOUR_H / 4)) * 15;
    } else { // round == 'down'
        var minute = Math.floor(yRemainder / (HOUR_H / 4)) * 15;
    }
    if (minute == 60) {
        minute = 0;
        hour += 1;
    }
    return hour * 100 + minute;
}


function roundRect(ctx, x, y, width, height) {
    var r = 5;
    var radius = {tl: r, tr: r, br: r, bl: r};
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    ctx.fill();
}


function hourToText(hour) {
    hour = hour % 24;
    if (hour >= 12) {
        var ampm = 'pm';
        if (hour != 12) {
            hour -= 12;
        }
    } else {
        var ampm = 'am';
        if (hour == 0) {
            hour = 12;
        }
    }
    hour = hour.toString();
    return hour + ':00' + ampm;
}
