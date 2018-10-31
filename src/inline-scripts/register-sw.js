'use strict';

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    // eslint-disable-next-line compat/compat
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
  }
});
