(function() {
  setInterval(function() {
    chrome.extension.sendMessage({
      message: "checkRelease",
      time: new Date().getTime(),
    });
  }, 6 * 1000)
})();
