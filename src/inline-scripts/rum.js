/* exported gaEvent, gaTiming */
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
 * Logs an timing event to Google Analytics.
 * @param {string} category - Category of timer.
 * @param {string} variable - The variable being timed.
 * @param {integer} value - A numeric value associated with the event.
 * @param {string} [label] - Useful for categorizing events.
 */
function gaTiming(category, variable, value, label) {
  value = parseInt(value, 10);
  console.log('⏱️', category, variable, value, label);
  if (location.hostname === 'localhost') {
    return;
  }
  // eslint-disable-next-line no-undef
  ga('send', 'timing', category, variable, value, label);
}

/**
 * Analytics for window type: browser, standalone, standalone-ios
 */
window.addEventListener('load', () => {
  setTimeout(() => {
    let windowStyle = 'browser';
    if (window.navigator.standalone === true) {
      windowStyle = 'standalone-ios';
    } else if (matchMedia('(display-mode: standalone)').matches === true) {
      windowStyle = 'standalone';
    }
    gaEvent('Window Style', windowStyle, null, null, true);
  }, 3100);
});

/**
 * Performance analytics: load & paint
 */
window.addEventListener('load', () => {
  if ('performance' in window) {
    // eslint-disable-next-line compat/compat
    const pNow = Math.round(performance.now());
    gaTiming('Start', 'window-load', pNow);
    setTimeout(() => {
      const paintMetrics = performance.getEntriesByType('paint');
      if (paintMetrics && paintMetrics.length > 0) {
        paintMetrics.forEach((entry) => {
          const name = entry.name;
          const time = Math.round(entry.startTime + entry.duration);
          gaTiming('Start', name, time);
        });
      }
    }, 3000);
  }
});

/**
 * Performance analytics: GA PageView, DOMContentLoaded
 */
window.addEventListener('DOMContentLoaded', () => {
  if ('performance' in window) {
    // eslint-disable-next-line compat/compat
    const pNow = Math.round(performance.now());
    gaTiming('Start', 'dom-content-loaded', pNow);
  }
  const gaScript = document.createElement('script');
  gaScript.src = 'https://www.google-analytics.com/analytics.js';
  document.head.appendChild(gaScript);
  window.ga('send', 'pageview', '/');
});

document.addEventListener('visibilitychange', (e) => {
  const state = document.hidden === true ? 'hidden' : 'visible';
  gaEvent('Page Visibility', state, null, null, true);
});
