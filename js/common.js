(function() {
  window.Common = {
    formatDate: function(date) {
      var self = this;
      var dateStr = date.getFullYear() + '-';
      dateStr += self.formatInteger(date.getMonth() + 1, 2) + '-';
      dateStr += self.formatInteger(date.getDate(), 2) + ' ';
      dateStr += self.formatInteger(date.getHours(), 2) + ':';
      dateStr += self.formatInteger(date.getMinutes(), 2) + ':';
      dateStr += self.formatInteger(date.getSeconds(), 2);
      return dateStr;
    },
    formatInteger: function (value, length) {
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
  }
})();