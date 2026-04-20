/**
 * Visitor Tracker — 全字段访客追踪脚本
 * 自动采集浏览器端一切可获取的信息，POST 到 Worker /log
 */
(function () {
  var WORKER_URL = 'https://visitor-logger.zhangxuhan.workers.dev/log';

  function getDeviceType() {
    var ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/.test(ua) && !/mobile/.test(ua)) return 'Tablet';
    if (/mobile|android|iphone|ipod/.test(ua)) return 'Mobile';
    if (/playstation|xbox|nintendo|ps[34]|wii/.test(ua)) return 'Gaming Console';
    return 'Desktop';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (/windows nt 10/.test(ua)) return 'Windows 10/11';
    if (/windows nt 6.3/.test(ua)) return 'Windows 8.1';
    if (/windows/.test(ua)) return 'Windows';
    if (/mac os x/.test(ua)) {
      var m = ua.match(/mac os x ([\d_]+)/);
      return m ? 'macOS ' + m[1].replace(/_/g, '.') : 'macOS';
    }
    if (/android/.test(ua)) {
      var m = ua.match(/android ([\d.]+)/);
      return m ? 'Android ' + m[1] : 'Android';
    }
    if (/iphone|ipad|ipod/.test(ua)) {
      var m = ua.match(/os ([\d_]+)/);
      return m ? 'iOS ' + m[1].replace(/_/g, '.') : 'iOS';
    }
    if (/linux/.test(ua) && !/android/.test(ua)) return 'Linux';
    return 'Unknown OS';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    var m;
    if ((m = ua.match(/edge?\/([\d.]+)/))) return 'Edge ' + m[1];
    if (/edg/.test(ua)) return 'Edge (Chromium)';
    if ((m = ua.match(/opr\/([\d.]+)/))) return 'Opera ' + m[1];
    if (/chrome/.test(ua) && !/chromium/.test(ua) && (m = ua.match(/chrome\/([\d.]+)/))) return 'Chrome ' + m[1];
    if (/safari/.test(ua) && !/chrome/.test(ua) && (m = ua.match(/version\/([\d.]+)/))) return 'Safari ' + m[1];
    if ((m = ua.match(/firefox\/([\d.]+)/))) return 'Firefox ' + m[1];
    if (/duckduckgo/.test(ua)) return 'DuckDuckGo';
    if (/samsungbrowser/.test(ua)) return 'Samsung Browser';
    return navigator.vendor || 'Unknown Browser';
  }

  function getConnectionInfo() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return { connectionType: '', deviceMemory: '', hardwareConcurrency: '' };
    return {
      connectionType: conn.effectiveType || '',
      deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '',
      hardwareConcurrency: navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '',
    };
  }

  function canUse(feature) {
    try { return !!feature(); } catch (e) { return false; }
  }

  var connInfo = getConnectionInfo();
  var data = {
    url: location.href,
    title: document.title || '',
    referer: document.referrer || '',
    language: navigator.language || '',
    userAgent: navigator.userAgent || '',
    screen: screen.width + 'x' + screen.height,
    colorDepth: screen.colorDepth ? screen.colorDepth + 'bit' : '',
    viewport: window.innerWidth + 'x' + window.innerHeight,
    device: getDeviceType(),
    os: getOS(),
    browser: getBrowser(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    cookies: canUse(function () { document.cookie = '_t=1;path=/'; return document.cookie.indexOf('_t=1') !== -1; }),
    jsEnabled: true,
    localStorage: canUse(function () { var k = '__ls_test__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }),
    serviceWorker: canUse(function () { return 'serviceWorker' in navigator; }),
    connectionType: connInfo.connectionType,
    deviceMemory: connInfo.deviceMemory,
    hardwareConcurrency: connInfo.hardwareConcurrency,
    dnt: navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes',
    online: navigator.onLine,
  };

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(WORKER_URL, JSON.stringify(data));
    } else {
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(function () { });
    }
  } catch (e) {
    // silent fail
  }
})();
