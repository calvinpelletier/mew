console.log("Started background script for Mew.");

var currentPage = null;

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
        console.log("\tSpent " + timeSec + " seconds on " + currentPage.hostname);
    }

    currentPage = newPage;

    // TODO: send POST request to server.
    var postData = {
      token: "TODO",
      hostname: newHostname,
      time: currentTime
    }
    /*
    jQuery.post(
      "0.0.0.0", // TODO url
      postData,
      function(data, textStatus, jqXHR)
      {
        console.log("POST response status: " + textStatus);
      }
    );
    */
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
