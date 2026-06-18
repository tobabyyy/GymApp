(function () {
  'use strict';
  window.GBStore = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem(key);
        return v !== null ? JSON.parse(v) : (fallback !== undefined ? fallback : null);
      } catch (e) { return fallback !== undefined ? fallback : null; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },
    remove: function (key) {
      try { localStorage.removeItem(key); } catch (e) {}
    },
    keys: function () {
      var result = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k) result.push(k);
        }
      } catch (e) {}
      return result;
    }
  };
}());
