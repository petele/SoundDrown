'use strict';

window.addEventListener('load', () => {
  const RE_SAFARI = /safari/i;
  const RE_APPLE_DEVICE = /iphone|ipod|ipad/i;
  const ua = window.navigator.userAgent;
  const supportsStandAlone = 'standalone' in window.navigator;

  if (!supportsStandAlone) {
    return;
  }
  if (navigator.standalone) {
    return;
  }
  if (!RE_SAFARI.test(ua)) {
    return;
  }
  if (!RE_APPLE_DEVICE.test(ua)) {
    return;
  }
  gaEvent('IOSInstallAvailable', 'true');

  const scriptElem = document.createElement('script');
  scriptElem.src = '/scripts/sd-install-ios.js';
  document.head.append(scriptElem);

  const button = document.createElement('sd-install-ios');
  button.innerText = 'SoundDrown';
  document.querySelector('.bottom-bar-container').prepend(button);
  button.addEventListener('click-install', (e) => {
    gaEvent('InstallEvent', 'ios-banner');
  });
});
