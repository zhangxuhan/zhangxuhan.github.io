/* Visitor Tracker — 访客记录脚本 */
(function(){
  var WORKER_URL = 'https://visitor-logger.zhangxuhan.workers.dev/log';
  try {
    var data = {
      url: location.href,
      referer: document.referrer || '',
      language: navigator.language || '',
      userAgent: navigator.userAgent || '',
      screen: screen.width + 'x' + screen.height,
      title: document.title || ''
    };
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WORKER_URL, JSON.stringify(data));
    } else {
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function(){});
    }
  } catch(e){}
})();
