import { CONSTANTS } from '../sync/Constants.js';
import { reportError } from '../core/ErrorReporter.js';

export class PlayerControls {
  constructor(mediaSynchronizer, overlayEl, audioEl, gifVideoEl, gifContainerEl) {
    this.mediaSynchronizer = mediaSynchronizer;
    this.overlay = overlayEl;
    this.audio = audioEl;
    this.gifVideo = gifVideoEl;
    this.gifContainer = gifContainerEl;

    this.started = false;

    this.onInteract = this.onInteract.bind(this);
    this.startPlayback = this.startPlayback.bind(this);
    this.prime = this.prime.bind(this);
  }

  prime() {
    try {
      this.audio.currentTime = this.mediaSynchronizer.getPhase();
    } catch (e) {
      reportError(e, { context: 'PlayerControls: prime audio' });
    }

    if (this.gifVideo) {
      try {
        this.gifVideo.currentTime = (Date.now() / 1000 % this.mediaSynchronizer.gifDuration);
      } catch (e) {
        reportError(e, { context: 'PlayerControls: prime gifVideo' });
      }
    }
  }

  startPlayback() {
    if (this.mediaSynchronizer.isPlaying) return;

    const phase = this.mediaSynchronizer.getPhase();
    this.audio.currentTime = phase;
    this.audio.playbackRate = 1.0;

    console.log(`[INIT] audio initial phase=${phase.toFixed(3)} (wall t=${(Date.now()/1000).toFixed(3)})`);

    this.audio.play().then(() => {
      this.started = true;
      if (this.overlay) this.overlay.style.display = 'none';

      if (this.gifVideo) {
        this.gifVideo.play().catch((e) => {
          reportError(e, { context: 'PlayerControls: gifVideo initial play failed' });
        });
      }

      this.mediaSynchronizer.start();
    }).catch((e) => {
      this.started = false;
      reportError(e, { context: 'PlayerControls: audio initial play failed' });
    });
  }

  onInteract(e) {
    if (!this.started) {
      if (this.overlay) this.overlay.style.display = 'none';
      this.startPlayback();
    } else if (this.mediaSynchronizer.isPlaying) {
      this.mediaSynchronizer.boostConvergence(CONSTANTS.BOOST_MANUAL_RESYNC_MS, 'manual resync');
    }
  }

  bindEvents() {
    if (this.gifContainer) {
      this.gifContainer.addEventListener('click', this.onInteract);
      this.gifContainer.addEventListener('touchstart', this.onInteract, { passive: true });
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', this.onInteract);
      this.overlay.addEventListener('touchstart', this.onInteract, { passive: true });

      const repoLink = this.overlay.querySelector('a');
      if (repoLink) {
        repoLink.addEventListener('click', (e) => e.stopPropagation());
        repoLink.addEventListener('touchstart', (e) => e.stopPropagation());
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        this.onInteract(e);
      }
      if (e.key.toLowerCase() === 'r' && this.mediaSynchronizer.isPlaying) {
        this.mediaSynchronizer.boostConvergence(CONSTANTS.BOOST_MANUAL_R_KEY_MS, 'manual r resync');
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.mediaSynchronizer.isPlaying) this.prime();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.mediaSynchronizer.isPlaying) {
        this.mediaSynchronizer.boostConvergence(CONSTANTS.BOOST_VISIBILITY_MS, 'visibilitychange');
        this.mediaSynchronizer.lastEpoch = Math.floor(Date.now() / 1000 / this.mediaSynchronizer.period);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.mediaSynchronizer.isPlaying) {
        this.mediaSynchronizer.boostConvergence(CONSTANTS.BOOST_ENDED_MS, 'ended natural loop point');
      }
    });

    if (this.gifVideo) {
      this.gifVideo.addEventListener('loadedmetadata', () => {
        this.mediaSynchronizer.updateGifDuration(this.gifVideo.duration);
      });
    }

    this.audio.addEventListener('loadedmetadata', () => {
      this.mediaSynchronizer.updateDuration(this.audio.duration);
    });
    this.audio.addEventListener('durationchange', () => {
      this.mediaSynchronizer.updateDuration(this.audio.duration);
    });
  }

  init() {
    this.bindEvents();
    this.prime();

    if (this.audio.readyState >= 1 && isFinite(this.audio.duration)) {
      this.mediaSynchronizer.updateDuration(this.audio.duration);
    }
  }
}
