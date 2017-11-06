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

function _setQuotaStreakSectionVisibility(shouldBeVisible) {
    var m_quota_wrapper = $('#m-quota-streak-wrapper'); // null if not on mobile site

    if (shouldBeVisible) {
        if (m_quota_wrapper.length && m_quota_wrapper.hasClass('hidden')) { // mobile
            m_quota_wrapper.removeClass('hidden');
        } else if (!$('#today').hasClass('today-w-quota')) { // desktop
            // during the initial page load, there was no quota set
            // so quota percent and streak are hidden but should be visible
            $('#today').removeClass('today-no-quota');
            $('#today').addClass('today-w-quota');
            $('#quota-percent-section').removeClass('hidden');
            $('#streak-section').removeClass('hidden');
        }
    } else {
        if (m_quota_wrapper.length && !m_quota_wrapper.hasClass('hidden')) { // mobile
            m_quota_wrapper.addClass('hidden');
        } else if (!$('#today').hasClass('today-no-quota')) { // desktop
            // #today can have either .today-w-quota or .today-no-quota indicating whether there's a quota
            $('#today').removeClass('today-w-quota');
            $('#today').addClass('today-no-quota');
            $('#quota-percent-section').addClass('hidden');
            $('#streak-section').addClass('hidden');
        }
    }
}

function showQuotaPercent(percent) {
    _setQuotaStreakSectionVisibility(percent != -1);

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
    _setQuotaStreakSectionVisibility(streakDays != -1);
    $('#streak-val').text(streakDays.toString());
}
