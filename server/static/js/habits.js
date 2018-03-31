window.onload = function() {
};

// generic onclick function for capturing clicks that should close a modal
window.onclick = function(event) {
	var attach_acc = document.getElementById('attach-acc-container');
	if (attach_acc != null && event.target == attach_acc) {
		closeAttachAcc();
	}
}

window.onresize = function() {
	var attach_acc = $('#attach-acc-container');
	if (attach_acc != null && !attach_acc.hasClass('hidden')) {
		renderGoogleButton();
	}
};

function onOAuthLoad() {
    // init google auth
	gapi.load('auth2', function() {
		gapi.auth2.init();
	});
}
