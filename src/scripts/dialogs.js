'use strict';

/** Class to handle the dialog elements. */
class Dialog {
  /**
   * Create a Dialog element.
   * @param {string} selector - The selector to the dialog element.
   */
  constructor(selector) {
    this.elem = document.querySelector(selector);
    this.container = document.querySelector('#dialogContainer');
    this.show(false);
    const closeButton = this.elem.querySelector('button');
    closeButton.addEventListener('click', () => {
      this.show(false);
    });
  }
  /**
   * Shows or hides the dialog.
   * @param {boolean} [visible] - Show or hides the dialog.
   */
  show(visible) {
    gaEvent('Dialog', this.elem.id);
    this.container.classList.toggle('hidden', !visible);
    this.elem.classList.toggle('hidden', !visible);
  }
}

window.addEventListener('load', () => {
  const aboutDialog = new Dialog('#dialogAbout');
  document.querySelector('#butAbout').addEventListener('click', () => {
    aboutDialog.show(true);
  });
});
