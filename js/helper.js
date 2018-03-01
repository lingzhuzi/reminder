(function() {
  setInterval(function() {
    chrome.extension.sendMessage({
      message: "checkRelease",
      time: new Date().getTime(),
    });
  }, 10 * 60 * 1000);
})();
