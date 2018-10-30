/* global gaEvent */
'use strict';

if ('BeforeInstallPromptEvent' in window) {
  const button = document.getElementById('butPWAInstall');
  button.addEventListener('pwa-install', (e) => {
    const detail = e.detail;
    gaEvent('PWAInstall', detail.action, detail.label, detail.value);
  });
}
