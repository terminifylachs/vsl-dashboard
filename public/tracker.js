(function() {
  'use strict';

  var endpoint = window.VSL_TRACKER_URL || '';
  if (!endpoint) return;

  // Session & visitor IDs
  var sessionId = sessionStorage.getItem('vsl_sid');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('vsl_sid', sessionId);
  }
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

  // Page view
  send('pageview');

  // Time on page
  var startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    send('duration', { seconds: Math.round((Date.now() - startTime) / 1000) });
  });

  // Custom event API
  window.vslTrack = function(eventName, eventData) {
    send('event', { name: eventName, data: eventData });
  };

  // Scroll depth + milestones
  var maxScroll = 0;
  var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  window.addEventListener('scroll', function() {
    var scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    if (scrollPercent > maxScroll) maxScroll = scrollPercent;
    [25, 50, 75, 100].forEach(function(m) {
      if (scrollPercent >= m && !scrollMilestones[m]) {
        scrollMilestones[m] = true;
        send('event', { name: 'scroll_milestone', data: { percent: m } });
      }
    });
  });
  window.addEventListener('beforeunload', function() {
    send('scroll', { depth: maxScroll });
  });

  // YouTube video name mapping
  var videoNames = {
    'XUR2S8R0aTE': 'Flo – Testimonial',
    '5fC_ynHeUws': 'Jendrik – Testimonial',
    'O2XYOqmrN2g': 'Marco – Testimonial',
    'ivwDbcX4Aas': 'Maurice – Testimonial',
    'n7mN9L4Z_Io': 'Lukas – Testimonial'
  };

  // Click tracking
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
    // Primary buttons / nav CTA
    else if (classes.indexOf('btn-primary') !== -1 || classes.indexOf('nav-cta') !== -1 || classes.indexOf('cta') !== -1) {
      send('event', { name: 'button_click', data: { text: text, classes: classes, location: getClickLocation(el) } });
    }
    // Video play buttons (YouTube testimonials)
    else if (classes.indexOf('play') !== -1 || el.closest('[onclick*="play"]')) {
      var onclickAttr = el.getAttribute('onclick') || (el.closest('[onclick*="play"]') || {}).getAttribute('onclick') || '';
      var match = onclickAttr.match(/['"]([a-zA-Z0-9_-]{11})['"]/);
      var ytId = match ? match[1] : 'unknown';
      var name = videoNames[ytId] || ytId;
      send('event', { name: 'video_play', data: { video: name, video_id: ytId } });
    }
  });

  function getClickLocation(el) {
    var section = el.closest('section, [id], nav, header, footer');
    return section ? (section.id || section.tagName.toLowerCase()) : 'unknown';
  }

  // Section visibility tracking
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

  // UTM tracking
  var params = new URLSearchParams(location.search);
  var utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(key) {
    if (params.get(key)) utm[key] = params.get(key);
  });
  if (Object.keys(utm).length > 0) {
    send('event', { name: 'utm', data: utm });
  }

  // ─── Wistia VSL Watchtime Tracking ───
  // Tracks every 10% milestone of the main strategy video
  function trackWistia() {
    if (!window.Wistia) return;

    window._wq = window._wq || [];
    window._wq.push({
      id: '_all',
      onReady: function(video) {
        var duration = video.duration();
        var milestones = {};
        var lastPercent = 0;

        // Track play start
        video.bind('play', function() {
          send('event', { name: 'vsl_play', data: { duration: Math.round(duration) } });
        });

        // Track every 10% watched
        video.bind('secondchange', function(s) {
          var pct = Math.floor((s / duration) * 100);
          // Round down to nearest 10
          var milestone = Math.floor(pct / 10) * 10;
          if (milestone > 0 && milestone <= 100 && !milestones[milestone] && milestone > lastPercent) {
            milestones[milestone] = true;
            lastPercent = milestone;
            send('event', {
              name: 'vsl_watchtime',
              data: { percent: milestone, seconds: Math.round(s), total_duration: Math.round(duration) }
            });
          }
        });

        // Track when video ends
        video.bind('end', function() {
          send('event', { name: 'vsl_complete', data: { duration: Math.round(duration) } });
        });

        // Track pause (with current position)
        video.bind('pause', function() {
          var currentTime = video.time();
          var pct = Math.round((currentTime / duration) * 100);
          send('event', {
            name: 'vsl_pause',
            data: { percent: pct, seconds: Math.round(currentTime) }
          });
        });
      }
    });
  }

  // Init
  function init() {
    trackSections();
    // Wait for Wistia to load (can take a moment)
    var wistiaCheck = setInterval(function() {
      if (window.Wistia) {
        clearInterval(wistiaCheck);
        trackWistia();
      }
    }, 500);
    // Stop checking after 15s
    setTimeout(function() { clearInterval(wistiaCheck); }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
