function gaEvent(category, action, label, value, nonInteraction) {
  console.log('event', category, action, label, value);
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
