// capacitor-bridge.js
// Bridges the existing ShadiKhana web app to native mobile capabilities
// (push notifications, status bar, offline detection, session handoff) when
// running inside the Capacitor-wrapped iOS/Android app.
//
// SAFE ON THE REGULAR WEBSITE: every function below checks
// window.Capacitor?.isNativePlatform() first and does nothing on desktop/
// mobile browsers. This file can stay included on every page permanently.

(function () {
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  function plugin(name) {
    return isNative() && window.Capacitor.Plugins ? window.Capacitor.Plugins[name] : null;
  }

  // ── Session flag mirroring ──────────────────────────────────────
  // The local app shell (mobile/www/index.html) lives on a different
  // origin than this live site and can't read this page's localStorage.
  // Capacitor's Preferences plugin is native-backed and readable from
  // both origins, so we mirror "is someone logged in" here — used only
  // to decide whether a cold app launch opens on dashboard.html or the
  // public landing page. No token or personal data is mirrored, just a
  // boolean flag.
  window.skMirrorSession = function (loggedIn) {
    var Preferences = plugin('Preferences');
    if (!Preferences) return;
    if (loggedIn) {
      Preferences.set({ key: 'sk_has_session', value: 'true' });
    } else {
      Preferences.remove({ key: 'sk_has_session' });
    }
  };

  // ── Push notifications ──────────────────────────────────────────
  async function registerPush() {
    var Push = plugin('PushNotifications');
    if (!Push || typeof isLoggedIn !== 'function' || !isLoggedIn()) return;

    try {
      var permStatus = await Push.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await Push.requestPermissions();
      }
      if (permStatus.receive !== 'granted') return; // member declined — respect it, don't ask again this session

      await Push.register();
    } catch (err) {
      console.log('Push registration error (non-fatal):', err);
    }
  }

  function bindPushListeners() {
    var Push = plugin('PushNotifications');
    if (!Push) return;

    Push.addListener('registration', function (token) {
      var platform = window.Capacitor.getPlatform(); // 'ios' | 'android'
      if (typeof apiCall === 'function') {
        apiCall('/member/device-token', 'POST', { token: token.value, platform: platform });
      }
      // Remember locally so we can unregister the right token on logout
      window.localStorage.setItem('sk_device_token', token.value);
    });

    Push.addListener('registrationError', function (err) {
      console.log('Push registration error:', err);
    });

    // Member tapped a push notification — deep-link into the right panel
    // rather than just opening the app to whatever was last on screen
    Push.addListener('pushNotificationActionPerformed', function (action) {
      var data = action.notification && action.notification.data;
      if (data && data.panel && typeof showPanel === 'function') {
        showPanel(data.panel);
      }
    });
  }

  window.skUnregisterPush = async function () {
    var token = window.localStorage.getItem('sk_device_token');
    if (!token || typeof apiCall !== 'function') return;
    try {
      await apiCall('/member/device-token', 'DELETE', { token: token });
    } catch (err) { /* non-fatal */ }
    window.localStorage.removeItem('sk_device_token');
  };

  // ── Native chrome (status bar / splash) ────────────────────────
  function initNativeChrome() {
    var StatusBar = plugin('StatusBar');
    if (StatusBar) {
      StatusBar.setBackgroundColor({ color: '#A81851' }).catch(function () {});
      StatusBar.setStyle({ style: 'DARK' }).catch(function () {}); // light text/icons on the burgundy bar
    }
    var Splash = plugin('SplashScreen');
    if (Splash) {
      Splash.hide().catch(function () {});
    }
  }

  // ── Offline banner (mid-session connection drops) ─────────────
  // The cold-launch offline state is handled by the local shell
  // (mobile/www/index.html) before this page ever loads. This handles
  // the case where a member is already using the app and loses signal.
  function initNetworkBanner() {
    var Network = plugin('Network');
    if (!Network) return;

    var banner = document.createElement('div');
    banner.id = 'sk-offline-banner';
    banner.textContent = 'No internet connection';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#3a2000;color:#F0A830;text-align:center;font-size:.8rem;font-weight:600;padding:.5rem;display:none;';
    document.body.appendChild(banner);

    Network.addListener('networkStatusChange', function (status) {
      banner.style.display = status.connected ? 'none' : 'block';
    });
  }

  // ── Boot ─────────────────────────────────────────────────────
  function boot() {
    if (!isNative()) return;
    initNativeChrome();
    initNetworkBanner();
    bindPushListeners();
    registerPush();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
