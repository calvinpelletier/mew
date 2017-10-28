function onOAuthLoad() {
    // init google auth
	gapi.load('auth2', function() {
		gapi.auth2.init();
	});
}

function logout() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
    $.post({
        url: '/api/logout',
        success: function(response) {
            window.location.href = '/';
        },
        fail: function() {
            // TODO: what happens here?
            console.log('fail');
        }
    });
}
