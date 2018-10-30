'use strict';

/** Media Session API Controller Class. */
class MediaSessionController { // eslint-disable-line no-unused-vars
  /**
   * Create a MediaSession controller.
   * @param {string} audioSelector - Selector for the Audio HTML element.
   */
  constructor(audioSelector='audio') {
    this._enabled = ('mediaSession' in navigator);
    if (!this.enabled) {
      console.log('🔈', 'Media Session not available.');
      return;
    }
    this._audioElement = document.querySelector(audioSelector);
    if (!this._audioElement) {
      console.error('🔈', 'No audio element.');
      return;
    }
    this._audioElement.src = '/sounds/silence.mp3';
    this._initMediaSession();
    this._audioElement.dispatchEvent(new Event('media-session-ready'));
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
    const elems = document.querySelectorAll('.sound-container button');
    elems.forEach((elem) => {
      if (elem.getAttribute('aria-checked') === 'true') {
        playing = true;
      }
    });
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
