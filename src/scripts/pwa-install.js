'use strict';

/** Class to handle the PWA add to home screen dialog. */
class PWAInstaller {
  /**
   * Set up the add to home screen elements.
   * @param {string} selector - The selector to the dialog element.
   * @param {Object=} opts - Options used when creating generator.
   * @param {Function=} opts.gaEvent - For tracking Google Analytics events.
   */
  constructor(selector, opts = {}) {
    this._deferredEvent;
    this._installButton = document.querySelector(selector);
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      this._deferredEvent = e;
      this._installButton.classList.toggle('hidden', false);
      if (this._gaEvent) {
        this._gaEvent('InstallButton', 'shown');
      }
    });
    window.addEventListener('appinstalled', (e) => {
      this.hideButton();
      if (this._gaEvent) {
        this._gaEvent('InstallEvent', 'installed');
      }
    });
    this._installButton.addEventListener('click', (e) => {
      this.hideButton();
      if (!this.deferredEvent) {
        return;
      }
      this._deferredEvent.prompt();
      this._deferredEvent.userChoice.then((result) => {
        this._deferredEvent = null;
        if (this._gaEvent) {
          this._gaEvent('InstallPromptResponse', result.outcome);
        }
      });
      if (this._gaEvent) {
        this._gaEvent('InstallButton', 'clicked');
      }
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
  // eslint-disable-next-line no-undef
  new PWAInstaller('#butInstall', {gaEvent});
});
