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
  var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  window.addEventListener('scroll', function() {
    var scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    if (scrollPercent > maxScroll) maxScroll = scrollPercent;

    // Track scroll milestones
    [25, 50, 75, 100].forEach(function(milestone) {
      if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
        scrollMilestones[milestone] = true;
        send('event', { name: 'scroll_milestone', data: { percent: milestone } });
      }
    });
  });
  window.addEventListener('beforeunload', function() {
    send('scroll', { depth: maxScroll });
  });

  // Auto-track CTA / booking button clicks
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a, button');
    if (!el) return;

    var href = el.getAttribute('href') || '';
    var text = (el.textContent || '').trim().substring(0, 80);
    var classes = el.className || '';

    // Booking / CTA links
    if (href.indexOf('leadconnectorhq') !== -1 || href.indexOf('calendly') !== -1 || href.indexOf('booking') !== -1) {
      send('event', { name: 'cta_click', data: { text: text, href: href, location: getClickLocation(el) } });
    }
    // Any primary button or nav CTA
    else if (classes.indexOf('btn-primary') !== -1 || classes.indexOf('nav-cta') !== -1 || classes.indexOf('cta') !== -1) {
      send('event', { name: 'button_click', data: { text: text, classes: classes, location: getClickLocation(el) } });
    }
    // Video play buttons
    else if (classes.indexOf('play') !== -1 || el.closest('[onclick*="play"]')) {
      var videoId = (el.getAttribute('onclick') || '').match(/['"]([^'"]+)['"]\s*\)/);
      send('event', { name: 'video_play', data: { text: text, video: videoId ? videoId[1] : 'unknown' } });
    }
  });

  // Get section context of a click
  function getClickLocation(el) {
    var section = el.closest('section, [id], nav, header, footer');
    if (section) {
      return section.id || section.tagName.toLowerCase() || 'unknown';
    }
    return 'unknown';
  }

  // Track section visibility (which sections users actually see)
  var trackedSections = {};
  function trackSections() {
    var sections = document.querySelectorAll('section[id], [data-track]');
    if (!sections.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id || entry.target.getAttribute('data-track') || 'unknown';
          if (!trackedSections[id]) {
            trackedSections[id] = true;
            send('event', { name: 'section_view', data: { section: id } });
          }
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(function(s) { observer.observe(s); });
  }

  // Track UTM parameters
  var params = new URLSearchParams(location.search);
  var utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(key) {
    if (params.get(key)) utm[key] = params.get(key);
  });
  if (Object.keys(utm).length > 0) {
    send('event', { name: 'utm', data: utm });
  }

  // Init section tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackSections);
  } else {
    trackSections();
  }
})();
