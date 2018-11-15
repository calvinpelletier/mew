var CARD1_DATA_ELEMENT = new DataElement('#card1', ['#canvas']);
var DAY_START_HOUR = 5;
var TAG_TO_COLOR = {
    'sleep': '#0000ff',
}

var global_schedule;
var global_labels;
var w = $(window).width() - 35;
var h = $(window).height() - 140;
var offset_x = 55;
var offset_y = 0;
var hour_h = Math.floor((h - offset_y) / 24);
var day_w = Math.floor((w - offset_x) / 7);
var candidate = {
    'start': null,
    'end': null,
    'day': null
}


window.onload = function() {
    $('#card1').append('<canvas id="canvas" class="hidden" width="'+w+
        '" height="'+h+'" style="margin: 18px 10px"></canvas>');
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
                global_labels = JSON.parse(resp['labels']);
                draw();
            }
		}
	});
}


function draw() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    // hour lines
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 3;

    for (var i = 1; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo(offset_x, offset_y + i * hour_h);
        ctx.lineTo(w - 4, offset_y + i * hour_h);
        ctx.stroke();
    }

    // half hour lines
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 1;
    for (var i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo(offset_x, offset_y + i * hour_h + Math.floor(hour_h / 2));
        ctx.lineTo(w - 4, offset_y + i * hour_h + Math.floor(hour_h / 2));
        ctx.stroke();
    }

    // hour labels
    for (var i = 0; i < 24; i++) {
        ctx.fillStyle = '#2d333c';
        ctx.font = '15px serif';
        ctx.fillText(hourToText(i + DAY_START_HOUR), 0, offset_y + i * hour_h + 15);
    }

    // day boxes
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 5;
    offset = w - day_w * 7;
    var x = offset_x;
    for (var i = 0; i < 7; i++) {
        ctx.strokeRect(x+i*day_w, 0, day_w, h);
    }

    drawTimesheet(ctx, 'labels');
}


function drawTimesheet(ctx, which) {
    if (which == 'labels') {
        var data = global_labels;
    } else { // schedule
        var data = global_schedule;
    }

    for (var day = 0; day < 7; day++) {
        for (var i in data[day]) {
            ctx.fillStyle = TAG_TO_COLOR[data[day][i]['tag']];
            drawLabel(ctx, data[day][i]['start'], data[day][i]['end'], i);
        }
    }
}


function drawLabel(ctx, start_timeint, end_timeint, day) {
    y_start = timeintToYCoord(start_timeint);
    y_end = timeintToYCoord(end_timeint);
    roundRect(ctx,
        offset_x + day_w * day + 2,
        y_start,
        day_w - 4,
        y_end - y_start - 1
    );
}


function timeintToYCoord(timeint) {
    var hour = Math.floor(timeint / 100) - DAY_START_HOUR;
    if (hour < 0) {
        alert('shits fucked. make sure DAY_START_HOUR is the same in both backend and frontend');
        return;
    }
    return offset_y + hour_h * hour + Math.floor(hour_h * (timeint % 100) / 60);
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
