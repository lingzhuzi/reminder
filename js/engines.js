(function() {
  var Engine = {
    name: '',
    searchUrl: '',
    searchItemSelector: '',
    archiveItemSelector: '',
    match: function(name) {
      return name.startsWith('[' + this.name + ']');
    },
    search: function(keyWord, callback) {
      var self = this;
      var url = self.searchUrl + keyWord;
      $.ajax({
        url: url,
        type: 'get',
        timeout: 10*1000,
        success: function(html){
          var items = self.parseSearchResultHtml(html, keyWord);
          if (items.length == 0) {
            items.push({name: self.name, title: '没有搜索到相关内容'});
          }
          callback.call(null, items);
        },
        error: function(error){
          callback.call(null, [{title: '搜索 [' + self.name + '] 过程中发生了错误'}]);
        }
      });
    },
    parseSearchResultHtml: function(html, keyWord) {
      var self = this, items = [], $doc = $(html);
      $doc.find(this.searchItemSelector).each(function(_i, item){
        var $link = $(item).find('a:first');
        var title = $link.text();
        var url = $link.attr('href');
        if (title.includes(keyWord)) {
          items.push({title: title, url: url, name: self.name});
        }
      });
      return items;
    },
    checkRelease: function(reminder, callback) {
      var self = this;
      $.ajax({
        url: reminder.url,
        type: 'get',
        success: function(doc) {
          var items = self.parseArchiveHtml(doc);
          if (callback) {
            callback.call(null, items);
          }
        }
      });
    },
    parseArchiveHtml: function(html) {
      var self = this, $doc = $(html), items = [];

      $doc.find(self.archiveItemSelector).each(function(_, li) {
        var item = self.parseArchiveItem(li);
        if (item) {
          items.push(item);
        }
      });
      return self.sortArchives(items);
    },
    parseArchiveItem: function(li) {},
    sortArchives: function(items) {
      return items;
    }
  }

  window.PaoFanEngine = $.extend(true, {}, Engine, {
    name: '泡饭影视',
    searchUrl: 'http://www.chapaofan.com/search/',
    searchItemSelector: '.content-list .list .item',
    archiveItemSelector: '.download-list ul li',
    parseArchiveItem: function(li) {
      var item = null;
      var text = $(li).text().trim();
      var url = $(li).find('a').attr('href');
      if (text.match(/第\d+集/)) {
        item = {text: text, links: [{title: text, url: url}], time: Common.formatDate(new Date()) };
      }
      return item;
    }
  })

  window.Msj1Engine = $.extend(true, {}, Engine, {
    name: "天天看美剧",
    searchUrl: 'http://www.msj1.com/?s=',
    searchItemSelector: '.cat_list .box_content h2',
    archiveItemSelector: '#content .table td',
    parseArchiveItem: function(li) {
      var text = $(li).find('a:first').text().trim();
      if (text.match(/S\d+E\d+/) && text.match(/字幕/)) {
        var item = {text: text, time: Common.formatDate(new Date()), links: []};
        $(li).find('a').each(function(_, link) {
          var $link = $(link);
          item.links.push({title: $link.text(), url: $link.attr('href')});
        });
      }

      return item;
    },
    sortArchives: function(items) {
      return items.reverse();
    }
  })

  window.ENABLED_ENGINES = [PaoFanEngine, Msj1Engine];

  window.matchEngine = function(name) {
    var engine = null;
    $.each(ENABLED_ENGINES, function(_, en) {
      if (en.match(name)) {
        engine = en;
      }
    });
    return engine;
  }

})();
