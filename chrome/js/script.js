SERVER_BASE_URL = "http://127.0.0.1:5000"

console.log("Started background script for Mew.");

var currentPage = null;

// TODO: Generate a token and tell the server who we are. (use crypto.js)

function processNew(url) {
  var newHostname = url ? new URL(url).hostname : null;
  currentTime = new Date().getTime();
  if (currentPage == null || newHostname != currentPage.hostname) {
    newPage = {
      time: currentTime,
      hostname: newHostname
    };

    // This is just logging to test on the front-end, it won't be needed once
    // the backend is in place.
    if (currentPage != null) {
        var timeElapsed = currentTime - currentPage.time;
        var timeSec = timeElapsed / 1000;
        console.log("Spent " + timeSec + " seconds on " + currentPage.hostname);
    }

    currentPage = newPage;

    var postData = {
      token: "TODO",
      hostname: newHostname,
      time: currentTime
    }

    $.post
    ({
        url: SERVER_BASE_URL + "/addevent",
        contentType: "application/json;",
        dataType: 'text',
        data: JSON.stringify(postData),
        success: function () {
          // POST succeeded!
        },
        fail: function () {
          // POST failed!
          // TODO: is `fail` correct? And we need to queue this.
        }
    });
  }
}

// Changing tabs (+ opening/closing tabs)
chrome.tabs.onActivated.addListener(function(details) {
  chrome.tabs.get(details.tabId, function(tabInfo) {
    processNew(tabInfo.url);
  });
});

// Loading a new page
chrome.webNavigation.onCompleted.addListener(function(details) {
  chrome.tabs.get(details.tabId, function(tabInfo) {
    processNew(tabInfo.url);
  });
});

// Focusing/unfocusing a Chrome window
// There's no Chrome event that does this flawlessy, so we have to
// continuously poll the status :(
var isFocused = false;
window.setInterval(checkBrowserFocus, 500);
function checkBrowserFocus(){
    chrome.windows.getCurrent(function(browser){
      if (browser.focused != isFocused)
      {
        if (browser.focused) {
          chrome.tabs.query(
            {currentWindow: true, active : true},
            function(tabs) {
                processNew(tabs[0].url)
              }
            );
        } else {
          processNew(null);
        }
        isFocused = browser.focused;
      }
    })
}
