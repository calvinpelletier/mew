var globalUnprodSites = [];

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
                <input id="site`+ i +`" class="site" type="text" value="`+ globalUnprodSites[i] +`" placeholder="e.g. facebook.com">
                <div class="remove-site" onclick="removeUnprodSite(`+ i +`);">
                    <img height=15 width=15 src="/static/img/x.png"/>
                </div>
            </div>
            `;
        html_all += html
    }
    $('#unprod-sites').html(html_all);
}

function initSettings() {
    $.get({
		url: '/api/quota',
		contentType: 'application/json',
		success: function(response) {
            if (response['success']) {
                if (response['quota_type'] == 'none') {
                    $('#quota-val').attr('disabled', true);
                    $('#quota-type').attr('disabled', true);
                    $('#quota-label').addClass('disabled');
                } else {
                    $('#quota-toggle').attr('checked', true);
                    $('#quota-type').val(response['quota_type']);
                    $('#quota-val').val(response['quota']);
                }
            } else {
                // TODO
            }
        },
		fail: function() {
            // TODO
		}
	});

    $.get({
        url: '/api/unprodsites',
        contentType: 'application/json',
        success: function(response) {
            if (response['success']) {
                for (i in response['sites']) {
                    globalUnprodSites.push(response['sites'][i]);
                }
                drawUnprodSites();
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
        // send unprod sites
        // TODO: validate sites
        readUnprodSites();
        $.post({
    		url: '/api/unprodsites',
    		contentType: 'application/json',
    		dataType: 'json',
    		data: JSON.stringify({
    			'sites': globalUnprodSites
    		}),
    		success: function(response) {
                if (!response['success']) {
                    // TODO
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

        // send quota
        if ($('#quota-toggle').is(':checked')) {
            var quotaType = $('#quota-type').val();
            var quotaUnit = $('#quota-unit').val();

            // validate quota
            var quota = $('#quota-val').val();
            console.log(quota);
            if (!quota || isNaN(quota)) {
                console.log('check');
                $('#quota-error').removeClass('hidden');
                return;
            }

            // TODO: we need to store the unit choice on the backend instead of just doing this.
            //  We'll need to show the appropriate hours/minutes to the user depending on their last choice.
            //  Additionally, we should validate that quoteUnit < 24 hours, AS they type it in.
            // convert hours to minutes.
            if (quotaUnit == 'hours') {
                quota *= 60;
            }
        } else {
            var quota = 0;
            var quotaType = 'none';
        }
        $.post({
    		url: '/api/quota',
    		contentType: 'application/json',
    		dataType: 'json',
    		data: JSON.stringify({
    			'quota': quota,
                'quota_type': quotaType
    		}),
    		success: function(response) {
                if (!response['success']) {
                    // TODO
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

    	// Update quota/streak data
        requestMainData(false);

        // close settings modal
        $('#settings-container').addClass('hidden');
        $('#body-container').removeClass('blur');
        $('#body-container').removeClass('no-scrolling');
    });

    $('#quota-toggle').on('change', function(e) {
        if ($('#quota-toggle').is(':checked')) {
            $('#quota-val').removeAttr('disabled');
            $('#quota-type').removeAttr('disabled');
            $('#quota-label').removeClass('disabled');
            if (!$('#quota-enable-msg').hasClass('hidden')) {
                $('#quota-enable-msg').addClass('hidden');
            }
        } else {
            $('#quota-val').attr('disabled', true);
            $('#quota-type').attr('disabled', true);
            $('#quota-label').addClass('disabled');
        }
    });

    $('#add-unprod-site').on('click', function(e) {
        readUnprodSites();
        globalUnprodSites.push('');
        drawUnprodSites();
    });
}
