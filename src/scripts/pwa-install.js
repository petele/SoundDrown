'use strict';

/** Class to handle the PWA add to home screen dialog. */
class PWAInstaller {
  /**
   * Set up the add to home screen elements.
   * @param {string} selector - The selector to the dialog element.
   */
  constructor(selector) {
    this.deferredEvent;
    this.installButton = document.querySelector(selector);
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
  /**
   * Hides the install button.
   */
  hideButton() {
    this.installButton.classList.toggle('hidden', true);
  }
}

window.addEventListener('load', () => {
  new PWAInstaller('#butInstall');
});
