'use strict';

if ('BeforeInstallPromptEvent' in window) {
  const button = document.createElement('button', {is: 'pwa-install-button'});
  button.id = 'butPWAInstall';
  button.textContent = 'Install';
  document.querySelector('.bottom-bar-container').prepend(button);
  button.addEventListener('pwa-install', (e) => {
    const detail = e.detail;
    gaEvent('PWAInstall', detail.action, detail.label, detail.value);
  });
}