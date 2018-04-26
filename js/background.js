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
          prevTime = request.time;
          checkAll();
        }
        break;
    }
  });

  chrome.runtime.onConnect.addListener(function(conn) {
    console.assert(conn.name == "reminder");
    conn.onMessage.addListener(function(request) {
      if (request.name == 'search') {
        search(conn, request);
      } else if (request.name == 'checkReleaseOfReminder') {
        checkRelease(request.reminder, function() {
          var reminder = getReminder(request.reminder.id);
          conn.postMessage({name: 'checkReleaseOfReminder', reminder: reminder});
        });
      }
    })
  })

  function checkAll() {
    var reminderList = getReminderList();
    for (var i = 0; i < reminderList.length; i++) {
      var reminder = reminderList[i];
      checkRelease(reminderList[i]);
    }
  }

  function checkRelease(reminder, callback) {
    var engine = matchEngine(reminder.name);
    engine.checkRelease(reminder, function(items) {
      var oldItems = reminder.items ? reminder.items : [];
      if (!callback && oldItems.length != items.length) {
        showNotify(reminder.name + "更新啦！\n" + items[0].text);
      }

      // 总是使用最新的链接，但检查更新的时间用原来的
      var offset = items.length - oldItems.length;
      $.each(items, function(i, item) {
        if (i - offset >= 0) {
          var oldItem = oldItems[i - offset];
          item.time = oldItem.time;
        }
      });
      reminder.items = items;
      saveReminder(reminder);
      if (callback) {
        callback.call(null);
      }
    });
  }

  function search(conn, request) {
    var keyWord = request.keyWord;
    var engines = ENABLED_ENGINES;
    var responseTimes = 0;
    $.each(engines, function(_, engine) {
      engine.search(keyWord, function(items) {
        responseTimes++;
        conn.postMessage({name: 'search', items: items, finished: responseTimes == engines.length});
      });
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
    if (!reminder.items && hasExist(reminder.url)) {
      return;
    }
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
      var reminder = list[i];
      if(reminder.url == url){
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
