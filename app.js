(function() {
  var originalTitle = document.title;
  var INTERVAL = 500;
  var SOUND_FILE = '/sound.mp3';
  var notification;
  var sound;

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

  function formatTime(time) {
    var m, s;
    m = time / 60 | 0;
    s = time % 60 | 0;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return m + ':' + s;
  }
  Vue.filter('time', formatTime);


  new Vue({
    el: 'html',
    data: {
      status: 'stopped',
      remainingTime: 0,
      startedAt: null,
      time: null,
      intervalId: null,
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
        hideNotification();
        if (this.intervalId) return;
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
            that.stopTimer(true);
          }
        }, INTERVAL);
      },
      stopTimer: function(notify) {
        if (!this.intervalId) return;
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.status = 'stopped';
        this.remainingTime = 0;
        this.setTitle();
        if (notify) {
          createNotification('Pomodoro', {
            body: 'Timer finished',
          });
          playSound();
        }
      },
      startPomodoro: function() {
        this.startTimer(25);
      },
      startBreak: function() {
        this.startTimer(5);
      },
      startLongBreak: function() {
        this.startTimer(15);
      },
    },
  });
})();
