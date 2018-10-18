'use strict';

/** Class to handle the prompt iOS users to install. */
class IOSInstaller {
  /**
   * Set up the add to home screen elements.
   * @param {string} [buttonID] - The element ID to the button element. If no
   * selector is provided, no visual indication will be made that the PWA is
   * installable.
   * @param {Object} [opts] - Options used when creating generator.
   * @param {Function} [opts.gaEvent] - For tracking Google Analytics events.
   */
  constructor(buttonID, opts = {}) {
    if (!this.canInstall) {
      console.log('not supported');
      return;
    }
    if (this.isInstalled) {
      console.log('already installed');
      return;
    }
    if (buttonID) {
      this._installButton = document.getElementById(buttonID);
    }
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
    this._installButton.addEventListener('click', (e) => {
      this.showPrompt(e);
    });
    this.showButton();
  }
  /**
   * Is the PWA already installed?
   * @readonly
   * @member {boolean}
   */
  get isInstalled() {
    if (window.navigator.standalone === true) {
      return true;
    }
    return false;
  }
  /**
   * Can the PWA be installed?
   * @readonly
   * @member {boolean}
   */
  get canInstall() {
    const ua = window.navigator.userAgent;
    const reAppleDevice = /iphone|ipod|ipad/i;
    const isAppleDevice = reAppleDevice.test(ua);
    const reSafari = /safari/i;
    const isSafari = reSafari.test(ua);
    const supportsStandAlone = 'standalone' in window.navigator;
    return isAppleDevice && isSafari && supportsStandAlone;
  }
  /**
   * Shows the add to home screen prompt (if possible).
   * @param {Event} evt - The event that initiated the prompt.
   * @return {boolean} If the prompt was shown or not.
   */
  showPrompt(evt) {
    // TODO
    return false;
  }
  /**
   * Makes the install button visible by removing the hidden class.
   * @return {boolean} If the install button was made visible.
   */
  showButton() {
    if (!this.canInstall || !this._installButton) {
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
  new IOSInstaller('butInstall', {gaEvent});
});
