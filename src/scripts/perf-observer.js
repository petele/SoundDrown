'use strict';

/**
 * Logs an event to Google Analytics.
 * @param {string} category - The object that was interacted with.
 * @param {string} action - The type of interaction.
 * @param {string=} label - Useful for categorizing events.
 * @param {number=} value - A numeric value associated with the event.
 * @param {boolean=} nonInteraction - Indicates a non-interaction event.
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
 * Logs the window style to Google Analytics.
 */
function trackWindowMode() {
  if (window.navigator.standalone === true) {
    gaEvent('Window Style', 'standalone-ios');
    return;
  }
  if (matchMedia('(display-mode: standalone)').matches === true) {
    gaEvent('Window Style', 'standalone');
    return;
  }
  gaEvent('Window Style', 'browser');
}

if ('PerformanceObserver' in window) {
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const metricName = entry.name;
      const time = Math.round(entry.startTime + entry.duration);
      gaEvent('Performance Metrics', metricName, null, time, true);
    }
  });
  paintObserver.observe({entryTypes: ['paint']});

  // const resourceObserver = new PerformanceObserver((list) => {
  //   for (const entry of list.getEntries()) {
  //     // console.log('re', entry)
  //     const name = entry.name;
  //     const time = Math.round(entry.startTime + entry.duration);
  //     gaEvent('Performance Metrics', 'Resource Loading', name, time, true);
  //   }
  // });
  // resourceObserver.observe({entryTypes: ['resource']});

  // const longTaskObserver = new PerformanceObserver((list) => {
  //   for (const entry of list.getEntries()) {
  //     const attribution = JSON.stringify(entry.attribution);
  //     const time = Math.round(entry.startTime + entry.duration);
  //     gaEvent('Long Task', attribution, null, time, true);
  //   }
  // });
  // longTaskObserver.observe({entryTypes: ['longtask']});
}

window.addEventListener('load', () => {
  setTimeout(() => {
    trackWindowMode();
  }, 5000);
  if ('performance' in window) {
    const pNow = Math.round(performance.now());
    gaEvent('Performance Metrics', 'window-load', null, pNow);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-undef
  ga('send', 'pageview', '/');
});
