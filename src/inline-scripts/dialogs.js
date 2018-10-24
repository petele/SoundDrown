'use strict';

/** Class to handle the dialog elements. */
class Dialog {
  /**
   * Create a Dialog element.
   * @param {string} divID - The ID of the div element for the dialog.
   * @param {Object} [opts] - Options used when creating dialog.
   * @param {Function} [opts.gaEvent] - For tracking Google Analytics events.
   */
  constructor(divID, opts = {}) {
    this.elem = document.getElementById(divID);
    this.container = document.getElementById('dialogContainer');
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
   * @param {boolean} [visible=false] - Show or hides the dialog.
   */
  show(visible) {
    this.container.classList.toggle('hidden', !visible);
    this.elem.classList.toggle('hidden', !visible);
    if (visible && this._gaEvent) {
      this._gaEvent('Dialog', this.elem.id);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-undef
  const aboutDialog = new Dialog('dialogAbout', {gaEvent});
  document.getElementById('butAbout').addEventListener('click', () => {
    aboutDialog.show(true);
  });
});
