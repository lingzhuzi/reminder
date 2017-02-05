$(function() {
  var SEARCHING = false;

  showVersion();
  showReminders();
  bindEvents();

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

    $(document).on('click', '.r-btn-pull', function() {
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
    var $ul;
    $('.r-item-id').each(function(_, idObj){
      if ($(idObj).val() == reminder.id){
        $ul = $(idObj).parents('.list-group-item').find('ul');
      }
    });

    $ul.append('<li>正在检查更新...</li>');

    chrome.extension.sendMessage({
      message: "checkReleaseOfReminder",
      reminder: reminder
    }, function(reminder){
      var items = reminder.items ? reminder.items : [];
      $ul.find('li').remove();
      $.each(items, function(_, item){
        var $a = $('<a></a>').text(item.title).attr('href', item.url);
        var $li = $('<li></li>').append($a);
        $ul.append($li);
      });
    });
  }

  function appendToReminderList(reminder){
    var template = $('#r_subscribed_item').html();
    var $item = $(template);
    $item.find('span').text(reminder.name);
    $item.find('.r-item-id').val(reminder.id);
    $item.find('.r-item-url').val(reminder.url);
    var $ul = $item.find('ul');
    var items = reminder.items ? reminder.items : [];
    $.each(items, function(_, item){
      var $a = $('<a></a>').text(item.title).attr('href', item.url);
      var $li = $('<li></li>').append($a);
      $ul.append($li);
    });
    $('.r-subscribe-group .list-group').append($item);
  }

  function doSearch(keyWord){
    if (SEARCHING) {
      return;
    }
    if (keyWord == '') {
      showNotice('请输入美剧名称');
      return;
    }
    setSearching(true)
    var url = 'http://cn163.net/?x=0&y=0&s=' + keyWord;
    $.ajax({
      url: url,
      type: 'get',
      timeout: 10*1000,
      success: function(html){
        var items = parseSearchResultHtml(html, keyWord);
        showSearchResult(items);
        setSearching(false);
      },
      error: function(error){
        showSearchResult([{title: '搜索过程中发生了错误，请稍后重新搜索'}]);
        setSearching(false);
      }
    });
  }

  function showSearchResult(items) {
    $('.r-search-result-items ul li').remove();
    var template = $('#r_search_result_item').html();
    if (items.length == 0){
      items.push({title: '没有搜索到相关内容'});
    }
    $.each(items, function(_, item){
      var $item = $(template);
      $item.find('.r-title').text(item.title);
      $item.find('.r-url').val(item.url);
      if (!item.url) {
        $item.find('.r-btn-subscribe').hide();
      }
      $('.r-search-result-items ul').append($item);
    });
  }

  function parseSearchResultHtml(html, keyWord) {
    var items = [];
    var $doc = $(html);
    $doc.find('.archive_title a').each(function(_i, link){
      var $link = $(link);
      var title = $link.text();
      var url = $link.attr('href');
      if (title.indexOf(keyWord) > -1){
        items.push({title: title, url: url});
      }
    });
    return items;
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
