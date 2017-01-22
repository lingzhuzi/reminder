$(function() {

  var VERSION = 0;
  showVersion();
  checkUpdate();

  showReminders();
  bindEvents();

  function showReminders() {
    chrome.extension.sendMessage({
      message: "getReminderList"
    }, function(response) {
      for (var i = 0; i < response.length; i++) {
        appendToReminderTable(response[i]);
      }
    });
  }

  function bindEvents() {
    $('#save_btn').click(function() {
      saveReminder();
    });

    $('.new').click(function() {
      resetForm();
    });

    $(document).on('click', '.reminders-table .edit', function() {
      var reminderId = $(this).attr('reminder_id');
      editReminder(reminderId);
    });

    $(document).on('click', '.reminders-table tr', function() {
      var reminderId = $(this).find('.edit').attr('reminder_id');
      editReminder(reminderId);
    });

    $(document).on('click', '.reminders-table .delete', function() {
      var $this = $(this);
      var reminderId = $this.attr('reminder_id');
      deleteReminder(reminderId);
    });
  }

  function checkUpdate() {
    $.get("https://raw.githubusercontent.com/lingzhuzi/reminder/master/release/version.json", function(json) {
      var data = JSON.parse(json);
      var version = data.version;
      var log = data.log;
      if (version > VERSION) {
        $('#update_ctn').show();
        $('#update_ctn .version').html("版本：" + version);
        $('#update_ctn .log').html($(log));
      } else {
        $('#update_ctn').remove();
      }
    });
  }

  function showVersion() {
    $.get(chrome.extension.getURL('manifest.json'), function(info) {
      VERSION = parseFloat(info.version);
      $('#version_no').text(info.version);
    }, 'json');
  }

  function editReminder(reminderId) {
    chrome.extension.sendMessage({
      message: "getReminder",
      reminder_id: reminderId
    }, function(reminder) {
      setForm(reminder);
    });
  }

  function deleteReminder(reminderId, callback) {
    if (confirm('确定删除？')) {
      chrome.extension.sendMessage({
        message: "deleteReminder",
        reminder_id: reminderId
      }, function(reminder) {
        resetForm();
        $('.reminders-table .delete[reminder_id=' + reminderId + ']').parents('tr').remove();
      });
    }
  }

  function saveReminder() {
    var reminder = getFormData();
    var isNewRecord = (reminder.id == '');

    chrome.extension.sendMessage({
      message: "saveReminder",
      reminder: reminder
    }, function(reminder) {
      if (isNewRecord) {
        $('#id').val(reminder.id);
        appendToReminderTable(reminder);
      }

      $('#notice_wrap').slideDown('fast');
      window.setTimeout(function() {
        $('#notice_wrap').slideUp('fase');
      }, 3000);
    });
  }

  function resetForm() {
    var $inputs = $('.content :input');
    for (var i = 0; i < $inputs.length; i++) {
      var $input = $($inputs[i]);

      if ($input.is('select')) {
        $input.val(0);
      } else if ($input.is(':checkbox')) {
        $input.prop("checked", true);
      } else {
        $input.val('');
      }
    }
  }

  function setForm(reminder) {
    for (var name in reminder) {
      if (name == 'enabled') {
        $('#enabled').prop('checked', reminder['enabled']);
      } else {
        $('#' + name).val(reminder[name]);
      }
    }
  }

  function getFormData() {
    var reminder = {};
    var $inputs = $('.content :input');
    for (var i = 0; i < $inputs.length; i++) {
      var $input = $($inputs[i]);
      var name = $input.attr('name');
      var value = $input.val();
      if ($input.is(':checkbox')) {
        value = $input.is(":checked");
      }
      reminder[name] = value;
    }
    return reminder;
  }

  function appendToReminderTable(reminder) {
    var $tr = $('<tr></tr>');
    var $td1 = $('<td></td>').append(reminder.name);
    var $td2 = $('<td></td>');
    var $edit = $('<a class="edit" href="#">编辑</a>').attr('reminder_id', reminder.id);
    var $del = $('<a class="delete" href="#">删除</a>').attr('reminder_id', reminder.id);
    $td2.append($edit).append($del);
    $tr.append($td1).append($td2);
    $('.reminders-table').append($tr);
  }

  function saveData(list_name, data) {
    var strData = JSON.stringify(data);
    localStorage.setItem(list_name, strData);
  }

  function getData(name, defaultData) {
    var strData = localStorage.getItem(name);
    return strData ? JSON.parse(strData) : defaultData;
  }

});