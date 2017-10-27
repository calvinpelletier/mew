function _showUsage(hourDivId, minDivId, mins) {
    if (mins) {
        $(hourDivId).text(Math.round(mins / 60).pad(2));
        $(minDivId).text(Math.round(mins % 60).pad(2));
    } else {
        $(hourDivId).text('00');
        $(minDivId).text('00');
    }
}

function showTotalAndUnprodUsage(totalUsage, unprodUsage) {
    _showUsage('#total-hours', '#total-minutes', totalUsage);
    _showUsage('#unprod-hours', '#unprod-minutes', unprodUsage);
}

function showQuotaPercent(percent) {
	if (percent > 100) {
		$('#quota-percent').text('>100%');
		percent = 100;
	} else {
		$('#quota-percent').text(percent.toString() + '%');
	}
	var deg = 360. * percent / 100.;
	var activeBorder = $('#quota-percent-border');
	if (deg <= 180){
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (90 + deg) + 'deg, transparent 50%, #344754 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
    else{
        activeBorder.css(
			'background-image',
			'linear-gradient(' + (deg - 90) + 'deg, transparent 50%, #31c4e9 50%),linear-gradient(90deg, #344754 50%, transparent 50%)'
		);
    }
}

function showStreak(streakDays) {
    $('#streak-val').text(streakDays.toString());
}