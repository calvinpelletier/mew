if (DEV) {
  SERVER_BASE_URL = "http://127.0.0.1:5000";
} else {
  SERVER_BASE_URL = "https://mew.pelletier.io";
}

PING_FREQ = 5000; // ms

console.log("Started background script for Mew.");

var token = null;
var currentPage = null;

function setup() {
  chrome.storage.sync.get('token', function(result) {

    if (result.token) {
      // The token has already been set in our local storage.
      token = result.token;
      _  = setInterval(ping, PING_FREQ);
      setup_chrome_events();
      setup_browser_action();
    } else {
      // There (hopefully...) isn't a token, so we need to generate one.
      $.post({
        url: SERVER_BASE_URL + "/api/gentoken",
        dataType: 'json',
        success: function(response) {
          console.log("check2");
          chrome.storage.sync.set({'token': response.token}, function() {
            console.log("Saved new token: " + response.token)
          });
          token = response.token;
          _ = setInterval(ping, PING_FREQ);
          setup_chrome_events();
          setup_browser_action();
        },
        fail: function() {
          // TODO: what happens here?
          // keep retrying and queueing new event until it works
          // maybe email one of us too?
          console.log("gentoken failed.")
        }
      });
    }
  });
}

function processNew(url) {
  var newHostname = url ? new URL(url).hostname : null;
  currentTime = new Date().getTime(); // UTC
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

  // Chrome window focus change
  chrome.windows.onFocusChanged.addListener(function(windowId) {

    // Funky behavior from some Linux WMs (i3), documented at
    // https://developer.chrome.com/extensions/windows
    if (windowId == chrome.windows.WINDOW_ID_NONE) {
        return;
    }
    chrome.tabs.query({ active: true, windowId: windowId }, function (tabs) {
        if (tabs.length == 0) {
            console.log("WARNING: onFocusChanged() had an empty tab list. Something is wrong.")
            return;
        }
        if (tabs.length > 1) {
            console.log("WARNING: onFocusChanged() had a tab list with length " + tabs.length);
        }
        processNew(tabs[0].url);
    });
  });
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

function ping() {
    currentTime = new Date().getTime();

    var postData = {
      token: token,
      time: currentTime
    }

    $.post({
      url: SERVER_BASE_URL + "/api/ping",
      contentType: "application/json;",
      dataType: 'text',
      data: JSON.stringify(postData),
      success: null,
      fail: null
    });
}

setup();
