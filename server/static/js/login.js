

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
    $('#signup-error').addClass('hidden');
    $('#email-error').addClass('hidden');
    return validateEmail() && validatePasswordMatch();
}

function validateEmail() {
    var email = document.forms['signup-form']['email'].value;
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(email)) {
        return true;
    } else {
        $('#email-error').removeClass('hidden');
        return false;
    }
}

function validatePasswordMatch() {
    var form = document.forms['signup-form'];
    if (form['password'].value != form['password-re'].value) {
        $('#signup-error').removeClass('hidden');
        return false;
    } else {
        return true;
    }
}

function login() {
    $('#login-submit').prop('disabled', true);
    var form = document.forms['login-form'];
    var postData = {
        'email': form['email'].value,
        'password': form['password'].value
    };
    $.post({
        url: '/api/login',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(postData),
        success: function(response) {
            $('#login-submit').prop('disabled', false);
            if (response.success == false) {
                $('#login-error').removeClass('hidden');
                $('#login-password').val('');
                $('#login-password').focus();
            } else {
                window.location.href = '/graph';
            }
        },
        fail: function() {
            // TODO: what happens here?
            console.log('fail');
        }
    });
}

function onGoogleSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    var id_token = googleUser.getAuthResponse().id_token;

    var postData = {
        'email': profile.getEmail(),
        'google_token': id_token
    };
    $.post({
        url: '/api/logout',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(postData),
        success: function(response) {
            $('#login-submit').prop('disabled', false);
            if (response.success == false) {
                $('#login-error').removeClass('hidden');
                $('#login-password').val('');
                $('#login-password').focus();
            } else {
                window.location.href = '/graph';
            }
        },
        fail: function() {
            // TODO: what happens here?
            console.log('fail');
        }
    });
};
