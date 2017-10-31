function _showUsage(hourDivId, minDivId, mins) {
    if (mins) {
        $(hourDivId).text(Math.round(mins / 60).pad(2));
        $(minDivId).text(Math.round(mins % 60).pad(2));
    } else {
        $(hourDivId).text('00');
        $(minDivId).text('00');
    }
}

function showTotalAndUnprodUsage() {
    if (window.raw_line_graph_data) {
        let _data = window.raw_line_graph_data.data;
        var today = _data[_data.length - 1]['summary'];
        var total = today['_total'];
        var unprod = today['_unprod'];
    } else {
        var total = 0;
        var unprod = 0;
    }
    _showUsage('#total-hours', '#total-minutes', total);
    _showUsage('#unprod-hours', '#unprod-minutes', unprod);
}

function showQuotaPercent(percent) {
    if (percent == -1) {
        // there's no quota
        if ($('#today').attr('class') != 'today-no-quota') {
            // #today can have either .today or .today-no-quota indicating whether there's a quota
            $('#today').attr('class', 'today-no-quota');
            $('#quota-percent-section').addClass('hidden');
            $('#streak-section').addClass('hidden');
        }
        return;
    }

    if ($('#today').attr('class') != 'today') {
        // during the initial page load, there was no quota set
        // so quota percent and streak are hidden but should be visible
        $('#today').attr('class', 'today');
        $('#quota-percent-section').removeClass('hidden');
        $('#streak-section').removeClass('hidden');
    }

    if (percent > 100) {
		$('#quota-percent').text('>100%');
		percent = 100;
	} else {
		$('#quota-percent').text(percent.toString() + '%');
	}
	var deg = 360. * percent / 100.;
	var activeBorder = $('#quota-percent-border');
	if (deg <= 180) {
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, #344754 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    } else {
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, #31c4e9 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
}

function showStreak(streakDays) {
    if (streakDays == -1) {
        // there's no quota
        if ($('#today').attr('class') != 'today-no-quota') {
            // #today can have either .today or .today-no-quota indicating whether there's a quota
            $('#today').attr('class', 'today-no-quota');
            $('#quota-percent-section').addClass('hidden');
            $('#streak-section').addClass('hidden');
        }
        return;
    }

    if ($('#today').attr('class') != 'today') {
        // during the initial page load, there was no quota set
        // so quota percent and streak are hidden but should be visible
        $('#today').attr('class', 'today');
        $('#quota-percent-section').removeClass('hidden');
        $('#streak-section').removeClass('hidden');
    }

    $('#streak-val').text(streakDays.toString());
}
