

function selectTab(e, which) {
    if (which == 'login') {
        $('#login').removeClass('hidden');
        $('#login-link').addClass('selected');
        $('#signup').addClass('hidden');
        $('#signup-link').removeClass('selected');
    } else if (which == 'signup') {
        $('#login').addClass('hidden');
        $('#login-link').removeClass('selected');
        $('#signup').removeClass('hidden');
        $('#signup-link').addClass('selected');
    }
}

function validateSignUp() {
    var form = document.forms['signup-form'];
    if (form['password'].value != form['password-re'].value) {
        $('#signup-error').removeClass('hidden');
        return false;
    } else {
        return true;
    }
}
