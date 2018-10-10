function gaEvent(category, action, label, value, nonInteraction) {
  console.log('🦄', category, action, label, value);
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
  ga('send', 'event', obj);
}

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

  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const attribution = JSON.stringify(entry.attribution);
      const time = Math.round(entry.startTime + entry.duration);
      gaEvent('Long Task', attribution, null, time, true);
    }
  });
  longTaskObserver.observe({entryTypes: ['longtask']});
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
  ga('send', 'pageview', '/');
});
