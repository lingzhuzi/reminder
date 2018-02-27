(function() {

  setInterval(function() {
    checkAll();
  }, 60 * 1000);

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
    var engines = [PaoFanEngine, Msj1Engine];
    var engine = null;
    $.each(engines, function(_, en) {
      if (en.match(reminder.name)) {
        engine = en;
      }
    });
    engine.checkRelease(reminder, function(items) {
      var oldItems = reminder.items ? reminder.items : [];
      if (!callback && oldItems.length != items.length) {
        showNotify(reminder.name + "更新啦！\n" + items[items.length-1].title);
      }

      var newItems = items.slice(0, items.length - oldItems.length);
      reminder.items = newItems.concat(oldItems);
      saveReminder(reminder);
      if (callback) {
        callback.call(null);
      }
    });
  }

  function search(conn, request) {
    var keyWord = request.keyWord;
    var engines = [PaoFanEngine, Msj1Engine];
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
