'use strict';

class Dialog {
  constructor(selector) {
    this.elem = document.querySelector(selector);
    this.container = document.querySelector('#dialogContainer');
    this.show(false);
    const closeButton = this.elem.querySelector('button');
    closeButton.addEventListener('click', () => {
      this.show(false);
    });
  }
  show(visible) {
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
