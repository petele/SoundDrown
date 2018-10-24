'use strict';

/** Custom Element to install a PWA. */
class PWAInstallButton extends HTMLButtonElement {
  /**
   * Base constructor.
   */
  constructor() {
    super();
    this._deferredEvent = null;
    // this.classList.toggle('hidden', true);
    this.setAttribute('disabled', '');

    window.addEventListener('beforeinstallprompt', (evt) => {
      this._deferredEvent = evt;
      this._showButton(true);
      this._fireEvent('available');
    });
    window.addEventListener('appinstalled', () => {
      this._deferredEvent = null;
      this._showButton(false);
      this._fireEvent('installed');
    });
    this.addEventListener('click', (evt) => {
      this._showButton(false);
      this._showPrompt(evt);
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
   * Helper class to fire events.
   * @param {Object} detail - Details information for the event.
   */
  _fireEvent(action, label, value) {
    const opts = {
      bubbles: true,
      composed: true,
      detail: {action, label, value},
    };
    this.dispatchEvent(new CustomEvent('pwa-install', opts));
  }
  /**
   * Shows the add to home screen prompt (if possible).
   * @return {boolean} If the prompt was shown or not.
   */
  _showPrompt() {
    if (!this.canInstall) {
      return false;
    }
    this._fireEvent('promptShown');
    this._deferredEvent.prompt();
    this._deferredEvent.userChoice.then((result) => {
      const value = result.outcome === 'dismissed' ? 0 : 1;
      this._fireEvent('promptResponse', null, value);
    });
    return true;
  }
  /**
   * Shows or hide the button.
   * @param {boolean} visible - True to show the button.
   * @return {boolean} If the prompt was shown or not.
   */
  _showButton(visible) {
    if (!!visible && this._deferredEvent) {
      this.removeAttribute('disabled');
      return;
    }
    this.setAttribute('disabled', '');
  }
}

window.customElements.define('pwa-install-button', PWAInstallButton, {extends: 'button'});
