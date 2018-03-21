$(function() {
  var SEARCHING = false;

  showVersion();
  showReminders();
  bindEvents();

  var runtimeConnection = chrome.runtime.connect({name: 'reminder'});
  runtimeConnection.onMessage.addListener(function(msg) {
    if (msg.name == 'search') {
      showSearchResult(msg.items);
      if (msg.finished) {
        setSearching(false);
      }
    } else if (msg.name = "checkReleaseOfReminder") {
      var reminder = msg.reminder;
      var items = reminder.items ? reminder.items : [];
      var $ul = $('.list-group-item[data-reminder_id=' + reminder.id + '] ul');
      $ul.find('li').remove();
      setReminderArchives($ul, items);
    }
  })

  function showReminders() {
    chrome.extension.sendMessage({
      message: "getReminderList"
    }, function(response) {
      for (var i = 0; i < response.length; i++) {
        appendToReminderList(response[i]);
      }
    });
  }

  function bindEvents() {
    $('.r-key-word').keydown(function(e){
      if (e.keyCode == 13) {
        var keyWord = $(this).val();
        doSearch(keyWord);
      }
    });

    $('.r-btn-search').click(function(){
        var keyWord = $('.r-key-word').val();
        doSearch(keyWord);
    });

    $(document).on('click', '.r-btn-show', function() {
      var $ul = $(this).parents('.list-group-item').find('ul');
      if ($ul.is(':visible')) {
        $ul.slideUp();
        $(this).text('查看剧集');
      } else {
        $ul.slideDown();
        $(this).text('收起剧集');
      }
    });

    $(document).on('click', '.r-btn-subscribe', function() {
      var title = $(this).siblings('.r-title').text().split('/')[0];
      var url   = $(this).siblings('.r-url').val();
      saveReminder(title, url);
      $(this).text('已订阅').attr('disabled', 'disabled');
    });

    $(document).on('click', '.r-btn-unsubscribe', function() {
      var $this = $(this);
      var reminderId = $this.siblings('.r-item-id').val();
      deleteReminder(reminderId, function(){
        showNotice("退订成功");
        $this.parents('.list-group-item').remove();
      });
    })
  }

  function showVersion() {
    $.get(chrome.extension.getURL('manifest.json'), function(info) {
      var version = parseFloat(info.version);
      $('#version_no').text(info.version);
    }, 'json');
  }

  function deleteReminder(reminderId, callback) {
    if (confirm('取消订阅？')) {
      chrome.extension.sendMessage({
        message: "deleteReminder",
        reminder_id: reminderId
      }, function() {
        callback.call(null);
      });
    }
  }

  function saveReminder(title, url) {
    var reminder = {name: title, url: url};

    chrome.extension.sendMessage({
      message: "saveReminder",
      reminder: reminder
    }, function(reminder) {
      if (reminder) {
        appendToReminderList(reminder);
        checkAndShowTvItems(reminder);
        showNotice("订阅成功");
      } else {
        showNotice("已经订阅过该剧");
      }
    });
  }

  function checkAndShowTvItems(reminder) {
    var $ul = $('.list-group-item[data-reminder_id=' + reminder.id + '] ul');
    $ul.append('<li>正在检查更新...</li>');

    runtimeConnection.postMessage({name: 'checkReleaseOfReminder', reminder: reminder});
  }

  function appendToReminderList(reminder){
    var template = $('#r_subscribed_item').html();
    var $item = $(template);
    $item.attr('data-reminder_id', reminder.id);
    $item.find('span').text(reminder.name);
    $item.find('.r-item-id').val(reminder.id);
    $item.find('.r-item-url').val(reminder.url);
    $item.find('.r-btn-origin').attr('href', reminder.url);
    var $ul = $item.find('ul');
    var items = reminder.items ? reminder.items : [];
    setReminderArchives($ul, items);
    $('.r-subscribe-group .list-group').append($item);
  }

  function setReminderArchives($ul, archives) {
    var arr = [];
    $.each(archives, function(_, item){
      var $li = $('<li></li>');
      var $span = $('<span></span>').text(item.time + "检查更新");
      for(var i in item.links) {
        var link = item.links[i];
        var $a = $('<a></a>').text(link.title).attr('href', link.url);
        if (i > 0) {
          $li.append(' | ');
        }
        $li.append($a);
      }
      $li.append($span);
      arr.push($li);
    });
    $ul.append(arr);
  }

  function doSearch(keyWord){
    if (keyWord == '') {
      showNotice('请输入美剧名称');
      return;
    }
    if (SEARCHING) {
      return;
    }
    $('.r-search-result').show();
    setSearching(true);
    $('.r-search-result-items ul li').remove();
    runtimeConnection.postMessage({name: 'search', keyWord: keyWord});
  }

  function showSearchResult(items) {
    var template = $('#r_search_result_item').html();

    $.each(items, function(_, item){
      var $item = $(template);
      $item.find('.r-title').text('[' + item.name + '] ' + item.title);
      $item.find('.r-url').val(item.url);
      if (!item.url) {
        $item.find('.r-btn-subscribe').hide();
      }
      $('.r-search-result-items ul').append($item);
    });
  }

  function setSearching(searching) {
    SEARCHING = searching;
    var btnText = SEARCHING ? '搜索中...' : '搜索';
    $('.r-btn-search').text(btnText);
  }

  // 显示并定时隐藏提醒消息
   function showNotice (notice) {
    var $notice = $('#notice_wrap');
    if (notice && notice.length > 0) {
      $notice.text(notice);
    }
    if ($notice.text().length > 0) {
      $notice.css({
        left: ($(window).width() - $notice.width()) / 2,
        top: ($(window).height() - $notice.height()) / 2 * 0.62
      }).show();
      window.setTimeout(function() {
        $notice.hide();
      }, 3000);
    }
  }
});
