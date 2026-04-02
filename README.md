# VSL Dashboard - TERMINIFY.AI Analytics

Tracking-Dashboard für die TERMINIFY.AI Website.

## Setup

### 1. Auf Vercel deployen
- Repo mit Vercel verbinden: [vercel.com/new](https://vercel.com/new)
- Vercel Postgres Storage hinzufügen (Dashboard → Storage → Create → Postgres)

### 2. Datenbank einrichten
Nach dem Deploy einmalig aufrufen:
```
https://DEINE-URL/api/setup
```

### 3. Tracking-Code auf der Website einfügen
```html
<script>
  window.VSL_TRACKER_URL = 'https://DEINE-URL/api/track';
</script>
<script src="https://DEINE-URL/tracker.js" async></script>
```

## Features
- Seitenaufrufe & Unique Visitors
- Verweildauer & Scroll-Tiefe
- Top Seiten & Referrer
- Geräte-Aufteilung (Mobile/Tablet/Desktop)
- Echtzeit-Updates (alle 30 Sekunden)
- Zeitraum-Filter (Heute, 7T, 30T, 90T)

## Custom Events tracken
```javascript
vslTrack('button_click', { button: 'cta_hero' });
vslTrack('video_play', { video_id: 'intro' });
```
