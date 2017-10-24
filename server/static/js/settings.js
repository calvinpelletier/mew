function initSettings() {
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
        // TODO: post
        $('#settings-container').addClass('hidden');
        $('#body-container').removeClass('blur');
        $('#body-container').removeClass('no-scrolling');
    });
}
