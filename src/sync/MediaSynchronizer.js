import { CONSTANTS } from './Constants.js';

export class MediaSynchronizer {
  constructor(audioEl, gifVideoEl, onUpdateFavicon) {
    this.audio = audioEl;
    this.gifVideo = gifVideoEl;
    this.onUpdateFavicon = onUpdateFavicon;

    this.period = CONSTANTS.DEFAULT_PERIOD;
    this.gifDuration = CONSTANTS.DEFAULT_GIF_DURATION;

    this.lastEpoch = -1;
    this.lastSync = 0;
    this.convergeUntil = 0;
    this.rafId = null;
    this.isPlaying = false;

    // Bind methods to preserve context for requestAnimationFrame
    this.tightSync = this.tightSync.bind(this);
  }

  updateDuration(d) {
    if (isFinite(d) && d > 1) {
      this.period = d;
    }
  }

  updateGifDuration(d) {
    if (isFinite(d) && d > 0) {
      this.gifDuration = d;
    }
  }

  getPhase() {
    const t = Date.now() / 1000;
    return ((t % this.period) + this.period) % this.period;
  }

  getPeriod() {
    return this.period;
  }

  boostConvergence(durationMs, reason) {
    const newUntil = Date.now() + durationMs;
    if (newUntil > this.convergeUntil) {
      this.convergeUntil = newUntil;
      console.log(`[CONVERGE] ${reason} boost, convergeUntil in ${(this.convergeUntil - Date.now()) / 1000}s`);
    }
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastEpoch = Math.floor(Date.now() / 1000 / this.period);

    this.boostConvergence(CONSTANTS.BOOST_INITIAL_PLAY_MS, 'initial play');

    setTimeout(() => {
      if (this.isPlaying) this.tightSync();
    }, 90);
  }

  stopSync() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isPlaying = false;
    this.audio.playbackRate = 1.0;
    if (this.gifVideo) this.gifVideo.playbackRate = 1.0;
  }

  tightSync() {
    if (!this.isPlaying) return;
    this.rafId = requestAnimationFrame(this.tightSync);

    const now = Date.now();

    const epoch = Math.floor(now / 1000 / this.period);
    if (epoch !== this.lastEpoch) {
      this.lastEpoch = epoch;
      this.boostConvergence(CONSTANTS.BOOST_EPOCH_MS, 'epoch');
    }

    if (now - this.lastSync >= CONSTANTS.SYNC_THROTTLE_MS) {
      this.lastSync = now;
    }

    // Audio
    const ideal = this.getPhase();
    const error = ideal - this.audio.currentTime;

    const aggressive = now < this.convergeUntil;
    const maxDev = aggressive ? CONSTANTS.AUDIO_DEV_AGGRESSIVE : CONSTANTS.AUDIO_DEV_NORMAL;
    const gain = aggressive ? CONSTANTS.AUDIO_GAIN_AGGRESSIVE : CONSTANTS.AUDIO_GAIN_NORMAL;

    let rate = 1.0;
    if (Math.abs(error) > CONSTANTS.AUDIO_ERR_THRESHOLD) {
      rate = 1 + Math.max(-maxDev, Math.min(maxDev, error * gain));
    }

    // console.log(`[AUDIO RATE] t=${(now/1000).toFixed(3)} ideal=${ideal.toFixed(3)} curr=${this.audio.currentTime.toFixed(3)} err=${error.toFixed(4)} agg=${aggressive} maxDev=${maxDev} gain=${gain} → rate=${rate.toFixed(4)}`);
    this.audio.playbackRate = rate;

    if (this.onUpdateFavicon) {
        this.onUpdateFavicon();
    }

    // GIF video rate
    if (this.gifVideo) {
      const gdur = this.gifDuration;
      const t = now / 1000;
      const gideal = (t % gdur);
      const gcurr = this.gifVideo.currentTime;
      let gerror = gideal - gcurr;

      if (gerror > gdur / 2) gerror -= gdur;
      if (gerror < -gdur / 2) gerror += gdur;

      const gmaxDev = aggressive ? CONSTANTS.GIF_DEV_AGGRESSIVE : CONSTANTS.GIF_DEV_NORMAL;
      const ggain = aggressive ? CONSTANTS.GIF_GAIN_AGGRESSIVE : CONSTANTS.GIF_GAIN_NORMAL;
      let grate = 1.0;
      if (Math.abs(gerror) > CONSTANTS.GIF_ERR_THRESHOLD) {
        grate = 1 + Math.max(-gmaxDev, Math.min(gmaxDev, gerror * ggain));
      }
      this.gifVideo.playbackRate = grate;
      // console.log(`[GIF RATE] t=${t.toFixed(3)} ideal=${gideal.toFixed(3)} curr=${gcurr.toFixed(3)} err=${gerror.toFixed(4)} agg=${aggressive} maxDev=${gmaxDev} gain=${ggain} → rate=${grate.toFixed(4)}`);
    }
  }
}
