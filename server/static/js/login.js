

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
    // Useful data for your client-side scripts:
    var profile = googleUser.getBasicProfile();
    console.log("ID: " + profile.getId()); // Don't send this directly to your server!
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log('Family Name: ' + profile.getFamilyName());
    console.log("Image URL: " + profile.getImageUrl());
    console.log("Email: " + profile.getEmail());

    // The ID token you need to pass to your backend:
    var id_token = googleUser.getAuthResponse().id_token;
    console.log("ID Token: " + id_token);

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
