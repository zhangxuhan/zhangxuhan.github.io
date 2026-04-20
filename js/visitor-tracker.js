/**
 * Visitor Tracker - Enhanced Fingerprinting
 * Collects comprehensive browser/device information
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
    if (!conn) return { connectionType: '', downlink: '', rtt: '' };
    return {
      connectionType: conn.effectiveType || conn.type || '',
      downlink: conn.downlink || '',
      rtt: conn.rtt || '',
    };
  }

  function canUse(feature) {
    try { return !!feature(); } catch (e) { return false; }
  }

  // Get WebGL info for GPU fingerprinting
  function getWebGLInfo() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { vendor: '', renderer: '' };
      var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' };
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '',
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '',
      };
    } catch (e) {
      return { vendor: '', renderer: '' };
    }
  }

  // Get canvas fingerprint
  function getCanvasFingerprint() {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Visitor Tracker \uD83C\uDF10 ' + navigator.userAgent.slice(0, 30), 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Fingerprint', 4, 35);
      return canvas.toDataURL().slice(-50);
    } catch (e) {
      return '';
    }
  }

  // Get installed fonts (basic check)
  function getFonts() {
    var fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
    var available = [];
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var testString = 'mmmmmmmmmmlli';
    var baseWidth = ctx.measureText(testString).width;
    
    fonts.forEach(function(font) {
      ctx.font = '72px "' + font + '", monospace';
      if (ctx.measureText(testString).width !== baseWidth) {
        available.push(font);
      }
    });
    return available.join(',');
  }

  // Get plugins
  function getPlugins() {
    var plugins = [];
    if (navigator.plugins) {
      for (var i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }
    return plugins.slice(0, 5).join(',');
  }

  // Get touch/pointer support
  function getInputInfo() {
    return {
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      pointer: 'onpointerdown' in window,
    };
  }

  // Get battery info (if available)
  function getBatteryInfo() {
    if (!navigator.getBattery) return { level: '', charging: '', chargingTime: '' };
    return new Promise(function(resolve) {
      navigator.getBattery().then(function(battery) {
        resolve({
          level: Math.round(battery.level * 100) + '%',
          charging: battery.charging,
          chargingTime: battery.chargingTime,
        });
      }).catch(function() {
        resolve({ level: '', charging: '', chargingTime: '' });
      });
    });
  }

  // Get WebRTC local IPs
  function getLocalIPs() {
    return new Promise(function(resolve) {
      var ips = [];
      try {
        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTCPeerConnection) return resolve('');
        var pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(function(offer) {
          pc.setLocalDescription(offer);
        }).catch(function() {});
        pc.onicecandidate = function(ice) {
          if (!ice || !ice.candidate || !ice.candidate.candidate) {
            pc.close();
            return resolve(ips.slice(0, 2).join(','));
          }
          var ipMatch = ice.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
          if (ipMatch && ips.indexOf(ipMatch[0]) === -1) {
            ips.push(ipMatch[0]);
          }
        };
        setTimeout(function() {
          pc.close();
          resolve(ips.slice(0, 2).join(','));
        }, 1000);
      } catch (e) {
        resolve('');
      }
    });
  }

  // Get permissions status
  async function getPermissions() {
    var perms = {};
    var permNames = ['notifications', 'camera', 'microphone', 'geolocation'];
    for (var name of permNames) {
      try {
        var result = await navigator.permissions.query({ name: name });
        perms[name] = result.state;
      } catch (e) {}
    }
    return perms;
  }

  // Main data collection
  async function collectData() {
    var connInfo = getConnectionInfo();
    var webgl = getWebGLInfo();
    var input = getInputInfo();
    var battery = await getBatteryInfo();
    var localIPs = await getLocalIPs();
    var permissions = await getPermissions();

    var data = {
      url: location.href,
      title: document.title || '',
      referer: document.referrer || '',
      language: navigator.language || '',
      languages: navigator.languages ? navigator.languages.join(',') : '',
      userAgent: navigator.userAgent || '',
      platform: navigator.platform || '',
      vendor: navigator.vendor || '',
      product: navigator.product || '',
      productSub: navigator.productSub || '',
      screen: screen.width + 'x' + screen.height,
      screenAvail: screen.availWidth + 'x' + screen.availHeight,
      colorDepth: screen.colorDepth ? screen.colorDepth + 'bit' : '',
      pixelRatio: window.devicePixelRatio || 1,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      device: getDeviceType(),
      os: getOS(),
      browser: getBrowser(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      timezoneOffset: new Date().getTimezoneOffset(),
      cookies: canUse(function () { document.cookie = '_t=1;path=/'; return document.cookie.indexOf('_t=1') !== -1; }),
      jsEnabled: true,
      localStorage: canUse(function () { var k = '__ls_test__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }),
      sessionStorage: canUse(function () { var k = '__ss_test__'; sessionStorage.setItem(k, '1'); sessionStorage.removeItem(k); return true; }),
      serviceWorker: canUse(function () { return 'serviceWorker' in navigator; }),
      indexedDB: canUse(function () { return 'indexedDB' in window; }),
      webGLVendor: webgl.vendor,
      webGLRenderer: webgl.renderer,
      canvasFingerprint: getCanvasFingerprint(),
      fonts: getFonts(),
      plugins: getPlugins(),
      touch: input.touch,
      maxTouchPoints: input.maxTouchPoints,
      pointer: input.pointer,
      connectionType: connInfo.connectionType,
      downlink: connInfo.downlink,
      rtt: connInfo.rtt,
      deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '',
      hardwareConcurrency: navigator.hardwareConcurrency || '',
      batteryLevel: battery.level,
      batteryCharging: battery.charging,
      localIPs: localIPs,
      pdfViewer: navigator.pdfViewerEnabled,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      serial: 'serial' in navigator,
      dnt: navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes',
      online: navigator.onLine,
      visibility: document.visibilityState || '',
      permissions: JSON.stringify(permissions),
    };

    return data;
  }

  // Send data
  collectData().then(function(data) {
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
  });
})();
