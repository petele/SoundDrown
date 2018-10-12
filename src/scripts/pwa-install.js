'use strict';

/** Class to handle the PWA add to home screen dialog. */
class PWAInstaller {
  /**
   * Set up the add to home screen elements.
   * @param {string} [buttonID] - The element ID to the button element. If no
   * selector is provided, no visual indication will be made that the PWA is
   * installable.
   * @param {Object} [opts] - Options used when creating generator.
   * @param {Function} [opts.gaEvent] - For tracking Google Analytics events.
   */
  constructor(buttonID, opts = {}) {
    this._deferredEvent;
    if (buttonID) {
      this._installButton = document.getElementById(buttonID);
    }
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      this._deferredEvent = e;
      this.showButton();
      if (this._gaEvent) {
        this._gaEvent('InstallAvailable', 'true');
      }
    });
    window.addEventListener('appinstalled', (e) => {
      this.hideButton();
      if (this._gaEvent) {
        this._gaEvent('InstallEvent', 'installed');
      }
    });
    this._installButton.addEventListener('click', (e) => {
      this.showPrompt(e);
    });
  }
  /**
   * Can the PWA be installed?
   * @readonly
   * @member {boolean}
   */
  get canInstall() {
    return !!this._deferredEvent;
  }
  /**
   * Shows the add to home screen prompt (if possible).
   * @param {Event} evt - The event that initiated the prompt.
   * @return {boolean} If the prompt was shown or not.
   */
  showPrompt(evt) {
    if (!this.canInstall) {
      return false;
    }
    this._deferredEvent.prompt();
    this._deferredEvent.userChoice.then((result) => {
      this._deferredEvent = null;
      this.hideButton();
      if (this._gaEvent) {
        this._gaEvent('InstallPromptResponse', result.outcome);
      }
    });
    if (this._gaEvent) {
      this._gaEvent('InstallButton', evt.type || 'click');
    }
    return true;
  }
  /**
   * Makes the install button visible by removing the hidden class.
   * @return {boolean} If the install button was made visible.
   */
  showButton() {
    if (!this._deferredEvent || !this._installButton) {
      return false;
    }
    this._installButton.classList.toggle('hidden', false);
    return true;
  }
  /**
   * Hides the install button.
   */
  hideButton() {
    if (this._installButton) {
      this._installButton.classList.toggle('hidden', true);
    }
  }
}

window.addEventListener('load', () => {
  // eslint-disable-next-line no-undef
  new PWAInstaller('butInstall', {gaEvent});
});
