'use strict';

class SDInstallIOS extends HTMLElement {

  // Can define constructor arguments if you wish.
  constructor() {
    super();

    if (!this.canInstall || this.isInstalled) {
      this.setAttribute('disabled', '');
      return;
    }

    const innerHTML = `
      <style>
        #sdInstallIOSButton {
          background-color: var(--button-bg-color, blue);
          border: var(--button-border, 1px solid red);
          color: var(--button-color, white);
          font-size: var(--button-font-size, 1em);
          padding: var(--button-padding, 0.75em);
        }
        #sdInstallIOSBanner {
          background-color: var(--banner-bg-color, white);
          bottom: 0;
          box-sizing: border-box;
          color: var(--banner-color, black);
          left: 0;
          padding: 1.5em 1em;
          position: fixed;
          width: 100%;
          transform: translateY(250px);
          transition-property: transform;
          transition-duration: 0.4s;
        }
        #sdInstallIOSBanner.sdInstallIOSBannerVisible {
          transform: translateY(0);
        }
        #sdInstallIOSBanner button {
          background-color: transparent;
          border: none;
          color: var(--banner-color, black);
          cursor: pointer;
          font-size: 2em;
          padding: 0 0 16px 16px;
          position: absolute;
          right: 0;
          text-align: center;
          top: -6px;
        }
      </style>
      <button id="sdInstallIOSButton" type="button">Install</button>
      <div id="sdInstallIOSBanner">
        To add <slot>this app</slot> to your home screen, press the Share
        button (below), then choose <em>Add to Home Screen</em>.
        <button type="button">&times;</button>
      </div>
    `;

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = innerHTML;

    const installButton = shadowRoot.querySelector('#sdInstallIOSButton');
    installButton.addEventListener('click', () => {
      this._showBanner(true);
      setTimeout(() => {
        installButton.style.display = 'none';
        this.setAttribute('disabled', '');
      }, 1000);
      const e = new Event('click-install', {bubbles: true, composed: true});
      this.dispatchEvent(e);
    });
    const closeBannerButton = shadowRoot.querySelector('#sdInstallIOSBanner button');
    closeBannerButton.addEventListener('click', (e) => {
      e.preventDefault(true);
      this._showBanner(false);
    });
  }

  _showBanner(visible) {
    const banner = this.shadowRoot.querySelector('#sdInstallIOSBanner');
    banner.classList.toggle('sdInstallIOSBannerVisible', visible);
  }

  /**
   * Is the PWA already installed?
   * @readonly
   * @member {boolean}
   */
  get isInstalled() {
    if (this.canInstall && window.navigator.standalone) {
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

}

window.customElements.define('sd-install-ios', SDInstallIOS);
