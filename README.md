# Gandalf Sax Guy — Synced

A pure static HTML site that plays video + audio synchronized to wall-clock time (Unix timestamp).

Any number of devices opening the page will be playing the **same moment** of the performance.

## How it works

- Uses `Date.now()` to compute phase in the audio loop: `position = (Date.now() / 1000) % duration`
- Audio starts at the computed phase; a rAF loop nudges `playbackRate` toward the ideal phase (no mid-play seeks).
- Video (`giphy.webm`) is rate-synced the same way against its own short loop duration.
- Favicon is a live canvas snapshot of the video frame (~15 fps).
- No WebSockets, no server, no coordination — just math + wall time.

## Deploy

Upload these files to any static host:

- `index.html`
- `giphy.webm`
- `epicsaxguy.mp3`
- `favicon.png` (fallback before the canvas favicon spins up)

Works on GitHub/GitLab Pages, Netlify/Vercel/Cloudflare static, S3+CDN, or opening `index.html` locally.

## Controls

- **Click** or **Space** — start (first tap unlocks audio per autoplay policy); after start, click/`R` boosts convergence
- **Tab focus** — auto-boosts convergence when you return

## Notes

- First click/tap is required for unmuted audio (browser autoplay policy). Video teaser plays muted before that.
- Audio duration is read at runtime; video loop length comes from the webm metadata.

Enjoy the sax.
