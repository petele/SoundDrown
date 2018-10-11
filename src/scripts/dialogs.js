'use strict';

/** Class to handle the dialog elements. */
class Dialog {
  /**
   * Create a Dialog element.
   * @param {string} selector - The selector to the dialog element.
   * @param {Object=} opts - Options used when creating dialog.
   * @param {Function=} opts.gaEvent - For tracking Google Analytics events.
   */
  constructor(selector, opts = {}) {
    this.elem = document.querySelector(selector);
    this.container = document.querySelector('#dialogContainer');
    this.show(false);
    const closeButton = this.elem.querySelector('button');
    closeButton.addEventListener('click', () => {
      this.show(false);
    });
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
  }
  /**
   * Shows or hides the dialog.
   * @param {boolean=} visible - Show or hides the dialog (false).
   */
  show(visible) {
    this.container.classList.toggle('hidden', !visible);
    this.elem.classList.toggle('hidden', !visible);
    if (visible && this._gaEvent) {
      this._gaEvent('Dialog', this.elem.id);
    }
  }
}

window.addEventListener('load', () => {
  // eslint-disable-next-line no-undef
  const aboutDialog = new Dialog('#dialogAbout', {gaEvent});
  document.querySelector('#butAbout').addEventListener('click', () => {
    aboutDialog.show(true);
  });
});
