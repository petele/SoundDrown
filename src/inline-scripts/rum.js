'use strict';

/**
 * Logs an event to Google Analytics.
 * @param {string} category - The object that was interacted with.
 * @param {string} action - The type of interaction.
 * @param {string} [label] - Useful for categorizing events.
 * @param {number} [value] - A numeric value associated with the event.
 * @param {boolean} [nonInteraction=false] - Indicates a non-interaction event.
 */
function gaEvent(category, action, label, value, nonInteraction) {
  console.log('🔔', category, action, label, value);
  if (location.hostname === 'localhost') {
    return;
  }
  const obj = {
    eventCategory: category,
    eventAction: action,
  };
  if (label) {
    obj.eventLabel = label;
  }
  if (value) {
    obj.eventValue = value;
  }
  if (nonInteraction) {
    obj.nonInteraction = true;
  }
  // eslint-disable-next-line no-undef
  ga('send', 'event', obj);
}

/**
 * Analytics for window type: browser, standalone, standalone-ios
 */
window.addEventListener('load', () => {
  setTimeout(() => {
    if (window.navigator.standalone === true) {
      gaEvent('Window Style', 'standalone-ios');
      return;
    }
    if (matchMedia('(display-mode: standalone)').matches === true) {
      gaEvent('Window Style', 'standalone');
      return;
    }
    gaEvent('Window Style', 'browser');
  }, 3100);
});

/**
 * Performance analytics: load & paint
 */
window.addEventListener('load', () => {
  if ('performance' in window) {
    const pNow = Math.round(performance.now());
    gaEvent('Performance Metrics', 'window-load', null, pNow);
    setTimeout(() => {
      const paintMetrics = performance.getEntriesByType('paint');
      if (paintMetrics && paintMetrics.length > 0) {
        paintMetrics.forEach((entry) => {
          const name = entry.name;
          const time = Math.round(entry.startTime + entry.duration);
          gaEvent('Performance Metrics', name, null, time, true);
        });
      }
    }, 3000);
  }
});

/**
 * Performance analytics: GA PageView, DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', () => {
  window.ga('send', 'pageview', '/');
  if ('performance' in window) {
    const pNow = Math.round(performance.now());
    gaEvent('Performance Metrics', 'dom-content-loaded', null, pNow);
  }
});
