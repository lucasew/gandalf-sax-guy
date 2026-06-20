import { CONSTANTS } from '../sync/Constants.js';
import { reportError } from '../core/ErrorReporter.js';

export class FaviconAnimator {
  constructor(faviconEl, gifVideoEl) {
    this.favicon = faviconEl;
    this.gifVideo = gifVideoEl;

    this.favCanvas = document.createElement('canvas');
    this.favCanvas.width = 32;
    this.favCanvas.height = 32;
    this.favCtx = this.favCanvas.getContext('2d');

    this.lastFavUpdate = 0;

    this.faviconLoop = this.faviconLoop.bind(this);
  }

  updateFavicon() {
    const now = performance.now();
    if (now - this.lastFavUpdate < CONSTANTS.FAVICON_THROTTLE_MS) return; // throttle
    this.lastFavUpdate = now;

    if (!this.gifVideo || !this.favicon || this.gifVideo.readyState < 2) return;

    this.favCtx.clearRect(0, 0, 32, 32);

    const vw = this.gifVideo.videoWidth || 500;
    const vh = this.gifVideo.videoHeight || 250;

    // cover like the main player
    const scale = Math.max(32 / vw, 32 / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (32 - dw) / 2;
    const dy = (32 - dh) / 2;

    this.favCtx.drawImage(this.gifVideo, dx, dy, dw, dh);

    try {
      this.favicon.href = this.favCanvas.toDataURL('image/png');
    } catch (e) {
      reportError(e, { context: 'Favicon toDataURL' });
    }
  }

  faviconLoop() {
    this.updateFavicon();
    requestAnimationFrame(this.faviconLoop);
  }

  start() {
    this.faviconLoop();
  }
}
