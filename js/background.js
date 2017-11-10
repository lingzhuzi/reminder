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
      checkRelease(reminderList[i], true);
    }
  }

  function checkRelease(reminder, async) {
    $.ajax({
      url: reminder.url,
      type: 'get',
      async: async,
      success: function(doc) {
        var $doc = $(doc);
        var items = [];
        $doc.find('.download-list ul li').each(function(_, li) {
          var text = $(li).text();
          var url = $(li).find('a').attr('href');
          if (text.match(/第\d+集/)) {
            items.push({title: text, url: url, time: formatDate(new Date()) });
          }
        })

        var oldItems = reminder.items ? reminder.items : [];
        if (async && oldItems.length != items.length) {
          showNotify(reminder.name + "更新啦！\n" + items[items.length-1].title);
        }

        var newItems = items.slice(0, items.length - oldItems.length);
        reminder.items = newItems.concat(oldItems);
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

  function formatDate(date) {
    var dateStr = date.getFullYear() + '-';
    dateStr += formatInteger(date.getMonth() + 1, 2) + '-';
    dateStr += formatInteger(date.getDate(), 2) + ' ';
    dateStr += formatInteger(date.getHours(), 2) + ':';
    dateStr += formatInteger(date.getMinutes(), 2) + ':';
    dateStr += formatInteger(date.getSeconds(), 2);
    return dateStr;
  }

  function formatInteger(value, length) {
    var zeroStr = '';
    var str = value.toString();
    if (str.length < length) {
      var zeroNum = length - str.length;
      for(var i=0;i<zeroNum;i++){
        zeroStr += '0';
      }
    }
    return zeroStr + str;
  }

})();
