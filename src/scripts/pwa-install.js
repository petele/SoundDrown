'use strict';

class PWAInstaller {
  constructor(buttonSelector) {
    this.deferredEvent;
    this.installButton = document.querySelector(buttonSelector);
    window.addEventListener('beforeinstallprompt', (e) => {
      this.deferredEvent = e;
      this.installButton.classList.toggle('hidden', false);
      gaEvent('InstallButton', 'shown');
    });
    window.addEventListener('appinstalled', (e) => {
      gaEvent('InstallEvent', 'installed');
      this.hideButton();
    });
    this.installButton.addEventListener('click', (e) => {
      this.hideButton();
      if (!this.deferredEvent) {
        return;
      }
      this.deferredEvent.prompt();
      this.deferredEvent.userChoice.then((result) => {
        gaEvent('InstallPromptResponse', result.outcome);
        this.deferredEvent = null;
      });
      gaEvent('InstallButton', 'clicked');
    });
  }
  hideButton() {
    this.installButton.classList.toggle('hidden', true);
  }
}

window.addEventListener('load', () => {
  new PWAInstaller('#butInstall');
});
