var _ENTER = 13;

var globalUnprodSites = [];

function getQuotaMinutes() {
    var quota = parseFloat($('#quota-val').val());
    var quotaUnit = $('#quota-unit').val();
    if (quotaUnit == 'hours') {
        quota *= 60;
    }
    return quota;
}

function readUnprodSites() {
    for (var i = 0; i < globalUnprodSites.length; i++) {
        globalUnprodSites[i] = $('#site' + i).val();
    }
}

function removeUnprodSite(i) {
    readUnprodSites();
    globalUnprodSites.splice(i, 1);
    drawUnprodSites();
}

function drawUnprodSites() {
    var html_all = '';
    for (var i = 0; i < globalUnprodSites.length; i++) {
        var html = `
            <div class="unprod-site">
                <input id="site`+ i +`" class="site" type="text" value="`+ globalUnprodSites[i] +`" placeholder="e.g. facebook.com" onkeypress="unprodSiteKeyPress(this, event,`+ i +`)">
                <div class="remove-site" onclick="removeUnprodSite(`+ i +`);">
                    <img height=15 width=15 src="/static/img/x.png"/>
                </div>
            </div>
            `;
        html_all += html
    }
    $('#unprod-sites').html(html_all);
    $('#unprod-sites input').last().focus();
}

function unprodSiteKeyPress(o, e, i) {
    if (e.keyCode == _ENTER) {
        if (i == globalUnprodSites.length - 1) {
            addUnprodSite();
        } else {
            $('#unprod-sites input').eq(i + 1).focus();
        }
    }
}

function addUnprodSite() {
    readUnprodSites();
    globalUnprodSites.push('');
    drawUnprodSites();
}

function initSettings() {
    SETTINGS_DATA_ELEMENT.showLoader();
    $.get({
		url: '/api/settings',
		contentType: 'application/json',
		success: function(response) {
            if (response['success']) {
                // unprod
                for (i in response['unprod_sites']) {
                    globalUnprodSites.push(response['unprod_sites'][i]);
                }
                drawUnprodSites();

                // quota
                if (response['quota_type'] == 'none') {
                    $('#quota-val').attr('disabled', true);
                    $('#quota-type').attr('disabled', true);
                    $('#quota-unit').attr('disabled', true);
                    $('#quota-label').addClass('disabled');
                } else {
                    $('#quota-toggle').attr('checked', true);
                    $('#quota-type').val(response['quota_type']);
                    $('#quota-unit').val(response['quota_unit']);

                    var quota = response['quota'];
                    if (response['quota_unit'] == 'hours') {
                        quota = quota / 60.
                    }
                    $('#quota-val').val(quota);
                }

                // TODO remove loading icon from settings
                SETTINGS_DATA_ELEMENT.hideLoader();
            } else {
                // TODO
            }
        },
		fail: function() {
            // TODO
		}
	});

    $('#settings-icon').on('click', function(e) {
        if (!$('#quota-error').hasClass('hidden')) {
            $('#quota-error').addClass('hidden');
        }
        if (!$('#quota-enable-msg').hasClass('hidden')) {
            $('#quota-enable-msg').addClass('hidden');
        }
        $('#settings-container').removeClass('hidden');
        $('#body-container').addClass('blur');
        $('#body-container').addClass('no-scrolling');
    });

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == document.getElementById('settings-container')) {
            $('#settings-container').addClass('hidden');
            $('#body-container').removeClass('blur');
            $('#body-container').removeClass('no-scrolling');
        } else if (event.target == document.getElementById('quota-val')
                || event.target == document.getElementById('quota-unit')
                || event.target == document.getElementById('quota-type')) {
            // hint the user about the toggle
            if (!$('#quota-toggle').is(':checked')) {
                $('#quota-enable-msg').removeClass('hidden');
            }
        }
    }

    $('#settings-cancel').on('click', function(e) {
        $('#settings-container').addClass('hidden');
        $('#body-container').removeClass('blur');
        $('#body-container').removeClass('no-scrolling');
    });

    $('#settings-save').on('click', function(e) {
        // get unprod sites
        readUnprodSites();
        var sites = [];
        for (i in globalUnprodSites) {
            var site = globalUnprodSites[i];

            // strip http:// and https://
            if (site.startsWith('http://')) {
                site = site.replace('http://', '');
            } else if (site.startsWith('https://')) {
                site = site.replace('https://', '');
            }

            // strip url path
            let loc = site.indexOf('/');
            if (loc != -1) {
                site = site.substring(0, loc);
            }

            if (site.length > 0) {
                sites.push(site);
            }
        }
        // TODO: reshow loading icon for line graph

        // get quota
        if ($('#quota-toggle').is(':checked')) {
            var quotaType = $('#quota-type').val();
            var quotaUnit = $('#quota-unit').val();

            // validate quota
            var quota = getQuotaMinutes();
            if (!quota || isNaN(quota)) {
                console.log('check');
                $('#quota-error').removeClass('hidden');
                return;
            } else {
                if (quota > 24 * 60) {
                    $('#quota-error').removeClass('hidden');
                    return;
                }
            }
        } else {
            var quota = 0;
            var quotaType = 'none';
            var quotaUnit = 'minutes'; // Just a default value, shouldn't really matter.
        }

        // send data
        postSettings(sites, quota, quotaType, quotaUnit);

        // close settings modal
        $('#settings-container').addClass('hidden');
        $('#body-container').removeClass('blur');
        $('#body-container').removeClass('no-scrolling');
    });

    $('#quota-toggle').on('change', function(e) {
        if ($('#quota-toggle').is(':checked')) {
            $('#quota-val').removeAttr('disabled');
            $('#quota-type').removeAttr('disabled');
            $('#quota-unit').removeAttr('disabled');
            $('#quota-label').removeClass('disabled');
            if (!$('#quota-enable-msg').hasClass('hidden')) {
                $('#quota-enable-msg').addClass('hidden');
            }
        } else {
            $('#quota-val').attr('disabled', true);
            $('#quota-type').attr('disabled', true);
            $('#quota-unit').attr('disabled', true);
            $('#quota-label').addClass('disabled');
        }
    });

    $('#add-unprod-site').on('click', addUnprodSite);
}
