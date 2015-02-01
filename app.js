(function() {
  var originalTitle = document.title;
  var INTERVAL = 500;
  var SOUND_FILE = '/sound.mp3';
  var LS_KEY = 'pomodoroHistory';
  var notification;
  var sound;

  function loadLogsFromLocalStorage() {
    var _logs = localStorage.getItem(LS_KEY), val;
    if (_logs) {
      try {
        val = JSON.parse(_logs);
      } catch (e) { }
    }
    if (Array.isArray(val)) return val
    return [];
  };

  function saveLogsToLocalStorage(logs) {
    localStorage.setItem(LS_KEY, JSON.stringify(logs));
  }

  function createNotification(title, options) {
    notification = new Notification(title, options);
    notification.onclick = function() {
      window.focus();
    };
  }

  function hideNotification() {
    if (notification) {
      notification.close();
      notification = null;
    }
  }

  function playSound() {
    sound || (sound = new Audio(SOUND_FILE));
    sound.play();
  }

  if (Notification.permission !== 'granted') {
    Notification.requestPermission(function(status) {
      if (Notification.permission !== status) {
        Notification.permission = status;
      }
    });
  }

  window.addEventListener('focus', hideNotification);

  function zeroFill(str, n) {
    if (typeof str !== 'string') str = '' + str;
    while (str.length < n) str = '0' + str;
    return str;
  }

  function formatTime(time) {
    var m, s;
    m = zeroFill(time / 60 | 0, 2);
    s = zeroFill(time % 60 | 0, 2);
    return m + ':' + s;
  }
  Vue.filter('time', formatTime);

  function formatDateTime(date) {
    var z2 = function(s) { return zeroFill(s, 2); }

    if (!(date instanceof Date)) date = new Date(date);
    year =    date.getYear() + 1900;
    month =   z2(date.getMonth() + 1);
    day =     z2(date.getDate());
    hours =   z2(date.getHours());
    minutes = z2(date.getMinutes());
    seconds = z2(date.getSeconds());
    return [
      [year, month, day].join('/'),
      [hours, minutes, seconds].join(':'),
    ].join(' ');
  }
  Vue.filter('dateTime', formatDateTime);

  window.addEventListener('beforeunload', function(event) {
    if (app && app.status === 'started') {
      event.returnValue = 'Timer is running.';
    }
  });


  var app = new Vue({
    el: 'html',
    data: {
      status: 'stopped',
      remainingTime: 0,
      startedAt: null,
      time: null,
      intervalId: null,
      currentType: '',
      logs: loadLogsFromLocalStorage(),
    },
    methods: {
      setTitle: function() {
        if (this.status === 'stopped') {
          document.title = originalTitle;
        } else {
          document.title = formatTime(this.remainingTime) + ' - ' +
            originalTitle;
        }
      },
      startTimer: function(minutes) {
        if (this.intervalId) return;
        hideNotification();
        this.addLog('Started: ' + this.currentType);
        var time = minutes * 60;
        var that = this;
        this.status = 'started';
        this.startedAt = Date.now();
        this.time = time;
        this.remainingTime = time;
        this.intervalId = setInterval(function() {
          var diff = (Date.now() - that.startedAt) / 1000 | 0,
              rem = time - diff;
          if (rem > 0) {
            if (rem !== that.remainingTime) {
              that.remainingTime = rem;
              that.setTitle();
            }
          } else {
            that.finishTimer();
          }
        }, INTERVAL);
      },
      resetTimer: function() {
        if (!this.intervalId) return;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.status = 'stopped';
        this.remainingTime = 0;
        this.setTitle();
        this.currentType = '';
      },
      finishTimer: function() {
        this.addLog('Finished: ' + this.currentType);
        createNotification('Pomodoro', {
          body: 'Timer finished',
        });
        playSound();
        this.resetTimer();
      },
      stopTimer: function(notify) {
        this.addLog('Stopped: ' + this.currentType);
        this.resetTimer();
      },
      startPomodoro: function() {
        this.currentType = 'pomodoro';
        this.startTimer(25);
      },
      startBreak: function() {
        this.currentType = 'break';
        this.startTimer(5);
      },
      startLongBreak: function() {
        this.currentType = 'long break';
        this.startTimer(15);
      },
      startCustomTimer: function() {
        var m = parseInt(prompt('input minutes'));
        if (!isFinite(m)) {
          alert('Invalid number');
          return;
        }
        this.currentType = 'custom (' + m + 'm)';
        this.startTimer(m);
      },
      addLog: function(message) {
        this.logs.unshift({timestamp: Date.now(), message: message});
        saveLogsToLocalStorage(this.logs);
      },
      clearLogs: function() {
        this.logs = [];
        saveLogsToLocalStorage(this.logs);
      },
    },
  });
})();
