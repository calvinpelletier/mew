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
                    $('#quota-type').value = response['quota_type'];
                    $('#quota-val').value = response['quota'];
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
                for (site in response['sites']) {
                    globalUnprodSites.push(site);
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

    // $('#settings-container').removeClass('hidden');
    // $('#body-container').addClass('blur');
    // $('#body-container').addClass('no-scrolling');

    $('#settings-icon').on('click', function(e) {
        console.log('check');
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
        }
    }

    $('#settings-cancel').on('click', function(e) {
        $('#settings-container').addClass('hidden');
        $('#body-container').removeClass('blur');
        $('#body-container').removeClass('no-scrolling');
    });

    $('#settings-save').on('click', function(e) {
        // TODO: validate
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

        if ($('#quota-toggle').is(':checked')) {
            var quotaType = $('#quota-type').val();
        } else {
            var quotaType = 'none';
        }
        $.post({
    		url: '/api/quota',
    		contentType: 'application/json',
    		dataType: 'json',
    		data: JSON.stringify({
    			'quota': $('#quota-val').val(),
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

        $('#settings-container').addClass('hidden');
        $('#body-container').removeClass('blur');
        $('#body-container').removeClass('no-scrolling');
    });

    $('#quota-toggle').on('change', function(e) {
        if ($('#quota-toggle').is(':checked')) {
            $('#quota-val').removeAttr('disabled');
            $('#quota-type').removeAttr('disabled');
            $('#quota-label').removeClass('disabled');
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
