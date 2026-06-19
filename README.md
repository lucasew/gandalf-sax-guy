# Gandalf Sax Guy — Synced

A pure static HTML site that plays the GIF and audio perfectly synchronized using the current wall-clock time (Unix timestamp).

Any number of devices opening the page will be playing the **exact same moment** of the performance.

## How it works

- Uses `Date.now()` (seconds since epoch) to compute the current position in the loop:  
  `position = (Date.now() / 1000) % duration`
- Audio is seeked to the computed position + periodically corrected.
- GIF is restarted precisely when a new global loop epoch begins, so every client restarts the animation at the identical real-world moment.
- No WebSockets, no server, no coordination — just math + wall time.

## Deploy

Just upload these three files to any static host:

- `index.html`
- `giphy.gif`
- `epicsaxguy.mp3`

Works on:
- GitHub Pages
- GitLab Pages
- Netlify / Vercel (static)
- Cloudflare Pages
- S3 + CloudFront / any CDN
- Even just opening `index.html` locally

## Controls

- **Play / Pause** button (or press **Space**)
- **Resync** button (or press **R**)
- Click the GIF area to resync
- Automatically recovers when you switch tabs

## Notes

- The first click is required due to browser autoplay policies.
- GIFs cannot be seeked frame-by-frame in a normal `<img>`, so we restart them on loop boundaries. This is the standard technique for global-sync memes.
- Duration is taken from the audio file at runtime (very accurate).

Enjoy the sax.
