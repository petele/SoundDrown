'use strict';

const butPWAInstall = document.querySelector('pwa-install-button');
butPWAInstall.addEventListener('pwa-install', (e) => {
  const detail = e.detail;
  gaEvent('PWAInstall', detail.action, detail.label, detail.value);
});
