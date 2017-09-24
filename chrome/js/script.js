DEV = True
if (DEV) {
  SERVER_BASE_URL = "127.0.0.1:5000/";
} else {
  SERVER_BASE_URL = "http://ec2-54-212-225-107.us-west-2.compute.amazonaws.com/";
}

console.log("Started background script for Mew.");


var token = null;
var currentPage = null;

function setup() {
  chrome.storage.sync.get('token', function(result) {

    if (result.token) {
      // The token has already been set in our local storage.
      console.log("Found existing token: " + result.token);
      token = result.token;
      setup_chrome_events();
      setup_browser_action();
    } else {
      // There (hopefully...) isn't a token, so we need to generate one.
      $.post({
        url: SERVER_BASE_URL + "/api/gentoken",
        dataType: 'json',
        success: function(response) {
          chrome.storage.sync.set({'token': response.token}, function() {
            console.log("Saved new token: " + response.token)
          });
          token = response.token;
          setup_chrome_events();
          setup_browser_action();
        },
        fail: function() {
          // TODO: what happens here?
        }
      });
    }
  });
}

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
      token: token,
      hostname: newHostname,
      time: currentTime
    }

    $.post({
      url: SERVER_BASE_URL + "/api/addevent",
      contentType: "application/json;",
      dataType: 'text',
      data: JSON.stringify(postData),
      success: function() {
        // POST succeeded!
      },
      fail: function() {
        // POST failed!
        // TODO: is `fail` correct? And we need to queue this.
      }
    });
  }
}

function setup_chrome_events() {
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

  function checkBrowserFocus() {
    chrome.windows.getCurrent(function(browser) {
      if (browser.focused != isFocused) {
        if (browser.focused) {
          chrome.tabs.query({
              currentWindow: true,
              active: true
            },
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
}

function setup_browser_action() {
  // When a user clicks the browser action icon in the upper right, it will open
  // the graph UI.
  chrome.browserAction.onClicked.addListener(function(activeTab)
  {
    console.log("Opening Graph UI.");

      var newURL = SERVER_BASE_URL + "/guest/" + token;
      chrome.tabs.create({ url: newURL });
  });
}

setup();
