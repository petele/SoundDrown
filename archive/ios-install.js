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
      return;
    }
    if (this.isInstalled) {
      return;
    }
    if (!buttonID) {
      return;
    }
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
    this._installButton = document.getElementById(buttonID);
    this._installBanner = document.getElementById('iosInstallBanner');
    if (!this._installBanner) {
      return;
    }
    this._closeBannerButton = this._installBanner.querySelector('button');
    this._closeBannerButton.addEventListener('click', () => {
      this._showPrompt(false);
    });
    this._installButton.addEventListener('click', () => {
      this._showPrompt(true);
      if (this._gaEvent) {
        this._gaEvent('InstallEvent', 'ios-prompt-shown');
      }
    });
    this._showButton(true);
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
   * @param {boolean} visible - Visibility of the prompt.
   * @return {boolean} If the prompt was shown or not.
   */
  _showPrompt(visible) {
    if (!this._installBanner) {
      return false;
    }
    this._installBanner.classList.toggle('iosInstallVisible', visible);
    this._showButton(false);
    return !visible;
  }
  /**
   * Toggle visibility of the install button.
   * @param {boolean} visible - Visibility of the button
   * @return {boolean} If the install button was made visible.
   */
  _showButton(visible) {
    if (!this._installButton) {
      return false;
    }
    const timeout = visible === true ? 0 : 1000;
    setTimeout(() => {
      this._installButton.classList.toggle('hidden', !visible);
    }, timeout);
    return !visible;
  }
}

window.addEventListener('load', () => {
  // eslint-disable-next-line no-undef
  new IOSInstaller('butInstall', {gaEvent});
});
