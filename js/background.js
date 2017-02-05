(function() {

  var prevTime = 0;

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.message) {
      case 'getReminderList':
        var reminderList = getReminderList();
        sendResponse(reminderList);
        break;
      case 'getReminder':
        var reminder = getReminder(request.reminder_id);
        sendResponse(reminder);
        break;
      case 'saveReminder':
        var reminder = saveReminder(request.reminder);
        sendResponse(reminder);
        break;
      case 'deleteReminder':
        deleteReminder(request.reminder_id);
        sendResponse(true);
        break;
      case 'openOptions':
        chrome.extension.getBackgroundPage().open('options.html');
        break;
      case 'checkRelease':
        if (request.time - prevTime > 10 * 60 * 1000) {
          checkAll(request.time);
        }
        break;
      case 'checkReleaseOfReminder':
        checkRelease(request.reminder, false);
        var reminder = getReminder(request.reminder.id);
        sendResponse(reminder);
        break;
    }
  });

  function checkAll(requestTime) {
    prevTime = requestTime;
    var reminderList = getReminderList();
    for (var i = 0; i < reminderList.length; i++) {
      var reminder = reminderList[i];
      checkRelease(reminderList[i]);
    }
  }

  function checkRelease(reminder, async) {
    $.ajax({
      url: reminder.url,
      type: 'get',
      async: async,
      success: function(doc) {
        var $doc = $(doc);
        var $links = $doc.find('#entry a');
        var items = [];
        for (var i = 0; i < $links.length; i++) {
          var $link = $($links[i]);
          if ($link.text().match(/第\d+集/)) {
            items.push({title: $link.text(), url: $link.attr('href')});
          }
        }
        var oldItems = reminder.items ? reminder.items : [];
        if (async && oldItems.length != items.length) {
          showNotify(reminder.name + "更新啦！\n" + items[items.length-1].title);
        }
        reminder.items = items;
        saveReminder(reminder);
      }
    });
  }

  function showNotify(note) {
    var opt = {
      type: "basic",
      title: "Reminder",
      message: note,
      iconUrl: 'img/icon.png'
    }
    chrome.notifications.create('', opt, function(id) {});
  }

  function getReminderList() {
    var maxId = localStorage.getItem('maxId');
    if (!maxId) {
      return [];
    }
    maxId = parseInt(maxId);
    var list = [];
    for (var i = 1; i <= maxId; i++) {
      var reminder = getReminder(i);
      if (reminder) {
        list.push(reminder);
      }
    }
    return list;
  }

  function getReminder(id) {
    var json = localStorage.getItem('reminder-' + id);
    if (!json) {
      return null;
    }
    return JSON.parse(json);
  }

  function saveReminder(reminder) {
    reminder.id = reminder.id ? reminder.id : assignId();
    localStorage.setItem('reminder-' + reminder.id, JSON.stringify(reminder));
    return reminder;
  }

  function deleteReminder(reminderId) {
    localStorage.removeItem('reminder-' + reminderId);
  }

  function hasExist(url){
    var list = getReminderList();
    for(var i=0;i<list.length;i++){
      var item = list[i];
      if(item.url == url){
        return true;
      }
    }
    return false;
  }

  function assignId() {
    var name = 'maxId';
    var maxId = localStorage.getItem(name);
    if (!maxId) {
      localStorage.setItem(name, 1);
      return 1;
    } else {
      maxId = parseInt(maxId) + 1;
      localStorage.setItem(name, maxId);
      return maxId;
    }
  }

})();
