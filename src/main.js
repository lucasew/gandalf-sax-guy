import { MediaSynchronizer } from './sync/MediaSynchronizer.js';
import { FaviconAnimator } from './ui/FaviconAnimator.js';
import { PlayerControls } from './ui/PlayerControls.js';
import { reportError } from './core/ErrorReporter.js';

(function () {
  const audio = document.getElementById('audio');
  const gifContainer = document.getElementById('gif-container');
  const gifVideo = document.getElementById('gif-video');
  const favicon = document.getElementById('favicon');
  const overlay = document.getElementById('start-overlay');

  const faviconAnimator = new FaviconAnimator(favicon, gifVideo);

  const mediaSynchronizer = new MediaSynchronizer(audio, gifVideo, () => {
    // Only used to explicitly drive favicon if desired during tightSync,
    // but the favicon loop runs continuously via requestAnimationFrame anyway.
  });

  const playerControls = new PlayerControls(mediaSynchronizer, overlay, audio, gifVideo, gifContainer);

  window.GANDALF = {
    getPhase: () => mediaSynchronizer.getPhase(),
    getPeriod: () => mediaSynchronizer.getPeriod()
  };

  // Auto play muted video as teaser (rate will be controlled after click)
  if (gifVideo) {
    gifVideo.play().catch((e) => {
        reportError(e, { context: 'main: teaser gifVideo auto play failed' });
    });
  }

  // Start the systems
  faviconAnimator.start();
  playerControls.init();
})();
