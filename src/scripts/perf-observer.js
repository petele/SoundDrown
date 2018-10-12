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
 * Fires the Google Analytics page view
 */
window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-undef
  ga('send', 'pageview', '/');
});

/**
 * Analytics for window type: browser, standalone, standalone-ios
 * DELAYED - fires after 5 seconds.
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
  }, 5000);
});

/**
 * Performance analytics
 * DELAYED - fires after 3 seconds.
 */
window.addEventListener('load', () => {
  if ('performance' in window) {
    const pNow = Math.round(performance.now());
    setTimeout(() => {
      gaEvent('Performance Metrics', 'window-load', null, pNow);
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
