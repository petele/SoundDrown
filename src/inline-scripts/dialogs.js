/* global gaEvent */
'use strict';

/** Class to handle the dialog elements. */
class Dialog {
  /**
   * Create a Dialog element.
   * @param {string} divID - The ID of the div element for the dialog.
   */
  constructor(divID) {
    this._elem = document.getElementById(divID);
    this._container = document.getElementById('dialogContainer');
    this.show(false);
    const closeButton = this._elem.querySelector('button');
    closeButton.addEventListener('click', () => {
      this.show(false);
    });
  }
  /**
   * Shows or hides the dialog.
   * @param {boolean} [visible=false] - Show or hides the dialog.
   */
  show(visible) {
    this._container.classList.toggle('hidden', !visible);
    this._elem.classList.toggle('hidden', !visible);
  }
}

window.addEventListener('load', () => {
  const aboutDialog = new Dialog('dialogAbout');
  document.getElementById('butAbout').addEventListener('click', () => {
    aboutDialog.show(true);
    gaEvent('Dialog', 'dialogAbout');
  });
});
