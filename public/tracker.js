(function() {
  'use strict';

  var endpoint = window.VSL_TRACKER_URL || '';
  if (!endpoint) return;

  // Generate or retrieve session ID
  var sessionId = sessionStorage.getItem('vsl_sid');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('vsl_sid', sessionId);
  }

  // Get visitor ID (persists across sessions)
  var visitorId = localStorage.getItem('vsl_vid');
  if (!visitorId) {
    visitorId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('vsl_vid', visitorId);
  }

  function send(type, data) {
    var payload = {
      type: type,
      session_id: sessionId,
      visitor_id: visitorId,
      page: location.pathname,
      url: location.href,
      referrer: document.referrer || null,
      screen_width: screen.width,
      screen_height: screen.height,
      user_agent: navigator.userAgent,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      data: data || null
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // Track page view
  send('pageview');

  // Track time on page
  var startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    send('duration', { seconds: Math.round((Date.now() - startTime) / 1000) });
  });

  // Expose custom event tracking
  window.vslTrack = function(eventName, eventData) {
    send('event', { name: eventName, data: eventData });
  };

  // Track scroll depth
  var maxScroll = 0;
  window.addEventListener('scroll', function() {
    var scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    if (scrollPercent > maxScroll) maxScroll = scrollPercent;
  });
  window.addEventListener('beforeunload', function() {
    send('scroll', { depth: maxScroll });
  });
})();
