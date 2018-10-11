'use strict';

/** Media Session API Controller Class. */
class MediaSessionController {
  /**
   * Create a MediaSession controller.
   * @param {Object} noises - A object of noise objects.
   * @param {Object} [opts] - Options used when creating the controller.
   * @param {string} [opts.selector=audio] - The selector find the
   * &lt;audio> element.
   * @param {Function} [opts.gaEvent] - For tracking Google Analytics events.
   */
  constructor(noises, opts={}) {
    this._enabled = ('mediaSession' in navigator);
    if (!this._enabled) {
      console.log('🔈', 'Media Session not available.');
      return;
    }
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
    this._noises = noises;
    this._initMediaSession();
    this._initAudioElement(opts.selector);
    if (this._gaEvent) {
      this._gaEvent('MediaSession', 'enabled');
    }
  }
  /**
   * Is the media session available?
   * @readonly
   * @member {boolean}
   */
  get enabled() {
    return this._enabled;
  }
  /**
   * Get the &lt;audio> player play status
   * @readonly
   * @member {boolean}
   */
  get playing() {
    if (this._audioElement) {
      return !this._audioElement.paused;
    }
    return false;
  }
  /**
   * Update the Media Session Play state.
   * @return {boolean} True if any sounds are currently playing.
   */
  updatePlayState() {
    if (!this.enabled) {
      return;
    }
    let playing = false;
    // eslint-disable-next-line guard-for-in
    for (const key in this._noises) {
      const noise = this._noises[key];
      if (noise.playing) {
        playing = true;
      }
    }
    this._toggleAudioElem(playing);
    this._previousState = null;
    return playing;
  }
  /**
   * Initializes the media session API.
   * @private
   */
  _initMediaSession() {
    const defaultMetadata = {
      title: 'SoundDrown',
      album: 'White Noise Generator',
      artwork: [
        {src: '/images/48.png', sizes: '48x48', type: 'image/png'},
        {src: '/images/192.png', sizes: '192x192', type: 'image/png'},
        {src: '/images/256.png', sizes: '256x256', type: 'image/png'},
        {src: '/images/512.png', sizes: '512x412', type: 'image/png'},
      ],
    };
    // eslint-disable-next-line no-undef
    navigator.mediaSession.metadata = new MediaMetadata(defaultMetadata);
    navigator.mediaSession.setActionHandler('play', (evt) => {
      this._handlePlay(evt);
    });
    navigator.mediaSession.setActionHandler('pause', (evt) => {
      this._handlePause(evt);
    });
  }
  /**
   * Initializes the audio element.
   * @private
   * @param {string} selector - The selector for the audio element.
   */
  _initAudioElement(selector='audio') {
    const audioElem = document.querySelector(selector);
    if (audioElem) {
      audioElem.src = '/sounds/silence.mp3';
      this._audioElement = audioElem;
      return;
    }
    console.error('🔈', 'No audio element.');
  }
  /**
   * Play or Pause the &lt;audio> player.
   * @private
   * @param {boolean} start - True starts, false pauses the &lt;audio> element.
   * @return {boolean} The current media session play state.
   */
  _toggleAudioElem(start) {
    if (!this._audioElement) {
      console.error('🔈', 'No audio element.');
      return;
    }
    start = !!start;
    if ((start && this.playing) || (!start && !this.playing)) {
      return this.playing;
    }
    if (start) {
      this._audioElement.play();
      return true;
    }
    this._audioElement.pause();
    return false;
  }
  /**
   * Handle the play event.
   * @private
   * @param {Event} evt - the event that triggered the play.
   * @return {boolean} The current media session play state.
   */
  _handlePlay(evt) {
    if (this.playing) {
      console.log('🔈', 'Already playing, ignore.');
      return true;
    }
    if (this._previousState) {
      for (const key in this._previousState) {
        if (this._previousState[key]) {
          this._noises[key].play();
        }
      }
      this._previousState = null;
    } else {
      const keys = Object.keys(this._noises);
      const firstKey = keys[0];
      const firstNoise = this._noises[firstKey];
      firstNoise.toggle(true);
    }
    this._toggleAudioElem(true);
    if (this._gaEvent) {
      this._gaEvent('MediaSession', 'play');
    }
    return true;
  }
  /**
   * Handle the pause event.
   * @private
   * @param {Event} evt - the event that triggered the pause.
   * @return {boolean} The current media session play state.
   */
  _handlePause(evt) {
    if (!this.playing) {
      console.log('🔈', 'Already paused, ignore.');
      return false;
    }
    this._previousState = {};
    // eslint-disable-next-line guard-for-in
    for (const key in this._noises) {
      const noise = this._noises[key];
      this._previousState[key] = noise.playing;
      noise.pause();
    }
    this._audioElement.pause();
    this._toggleAudioElem(false);
    if (this._gaEvent) {
      this._gaEvent('MediaSession', 'pause');
    }
    return false;
  }
}


window.addEventListener('load', () => {
  // eslint-disable-next-line no-undef
  const opts = {gaEvent: gaEvent};
  // eslint-disable-next-line no-unused-vars, no-undef
  mediaSessionController = new MediaSessionController(soundDrownNoises, opts);
});
