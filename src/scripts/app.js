'use strict';

const soundDrownApp = {
  wn: null,
  pn: null,
  bn: null,
  bi: null,
  audioElement: null,
  mediaSessionPreviousState: {},
};

/** Class representing the base Noise Generator. */
class Noise {
  /**
   * Create a Noise object.
   * @param {string} name - Name of the sound generator.
   * @param {Object=} opts - Options used when creating generator.
   * @param {string=} opts.buttonSelector - The selector for the button.
   * @param {number=} opts.bufferSize - Size of WebAudio buffer (1024).
   * @param {Function=} opts.gaEvent - For tracking Google Analytics events.
   */
  constructor(name, opts = {}) {
    this.name = name;
    this.playing = false;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this._audioContext = new AudioContext();
    this._audioContext.suspend();
    this._opts = opts;
    this._bufferSize = opts.bufferSize || 1024;
    this._noiseGenerator = this.getGenerator();
    this._noiseGenerator.connect(this._audioContext.destination);
    this._startedAt = 0;
    if (opts.buttonSelector) {
      this._button = document.querySelector(opts.buttonSelector);
    }
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
  }
  /**
   * Add a gain filter to the current node.
   * @param {WebAudioNode} noise - The web audio node to apply the gain to.
   * @param {number} gainValue - Amount (float) of gain to add.
   * @return {WebAudioNode} - Node after the gain has been applied.
   */
  _addGain(noise, gainValue) {
    if (gainValue === 1.0) {
      return noise;
    }
    const gainNode = this._audioContext.createGain();
    gainNode.gain.value = gainValue;
    noise.connect(gainNode);
    return gainNode;
  }
  /**
   * Starts or stops the noise generator.
   * @param {boolean=} play - Start or stop the noise generator,
   * toggles if not provided.
   * @return {boolean} Playing status
   */
  toggle(play) {
    if (play === true && this.playing === true) {
      return play;
    }
    if (play === false && this.playing === false) {
      return play;
    }
    if (typeof play !== 'boolean') {
      play = !this.playing;
    }
    if (play) {
      this._audioContext.resume();
      this._startedAt = Date.now();
      if (this._gaEvent) {
        this._gaEvent('Noise', 'start', this.name);
      }
    } else {
      this._audioContext.suspend();
      if (this._gaEvent) {
        const duration = Math.round((Date.now() - this._startedAt) / 1000);
        this._gaEvent('Noise', 'duration', this.name, duration);
      }
    }
    this.playing = play;
    if (this._button) {
      updateNoiseButtonState(this._button, play);
    }
    return play;
  }
}

/**
 * Class representing a White Noise Generator.
 * @extends Noise
 */
class WhiteNoise extends Noise {
  /**
   * Create a White Noise object.
   * @param {Object=} opts - @see {@link Noise}
   */
  constructor(opts = {}) {
    super('WhiteNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @return {WebAudioNode} The newly created node
   */
  getGenerator() {
    const context = this._audioContext;
    const noise = context.createScriptProcessor(this._bufferSize, 1, 1);
    noise.addEventListener('audioprocess', (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < this._bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    });
    return this._addGain(noise, 0.75);
  }
}

/**
 * Class representing a Pink Noise Generator.
 * @extends Noise
 */
class PinkNoise extends Noise {
  /**
   * Create a Pink Noise object.
   * @param {Object=} opts - @see {@link Noise}
   */
  constructor(opts = {}) {
    super('PinkNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @return {WebAudioNode} The newly created node.
   */
  getGenerator() {
    const context = this._audioContext;
    const noise = context.createScriptProcessor(this._bufferSize, 1, 1);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    noise.addEventListener('audioprocess', (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < this._bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.98975 * b0 + white * 0.0555178;
        b1 = 0.99342 * b1 + white * 0.0750757;
        b2 = 0.96901 * b2 + white * 0.1538521;
        b3 = 0.86640 * b3 + white * 0.3104855;
        b4 = 0.55010 * b4 + white * 0.5329521;
        b5 = -0.7616 * b5 - white * 0.0168981;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
      }
    });
    return this._addGain(noise, 0.15);
  }
}

/**
 * Class representing a Brown Noise Generator.
 * @extends Noise
 */
class BrownNoise extends Noise {
  /**
   * Create a Brown Noise object.
   * @param {Object=} opts - @see {@link Noise}
   */
  constructor(opts = {}) {
    super('BrownNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @return {WebAudioNode} The newly created node.
   */
  getGenerator() {
    const context = this._audioContext;
    const noise = context.createScriptProcessor(this._bufferSize, 1, 1);
    let lastOut = 0.0;
    noise.addEventListener('audioprocess', (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < this._bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.0207 * white)) / 1.018;
        lastOut = output[i];
      }
    });
    return this._addGain(noise, 3.5);
  }
}

/**
 * Class representing a Binaural Noise Generator.
 * @extends Noise
 */
class BinauralNoise extends Noise {
  /**
   * Create a Binaural Noise object.
   * @param {Object=} opts - @see {@link Noise} and @see {@link BinauralNoiseJS}
   */
  constructor(opts = {}) {
    super('BinauralNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @see {binaural-beat.js}
   * @return {WebAudioNode} The newly created node.
   */
  getGenerator() {
    // eslint-disable-next-line no-undef
    return new BinauralBeatJS(this._audioContext, this._opts);
  }
}

/**
 * Remove the disabled attribute from the button and adds an event
 * handler to toggle the specified noise.
 *
 * @param {string} selector - Button selector.
 * @param {WebAudioNode} noise - The noise class.
 */
function setupNoiseButton(selector, noise) {
  const button = document.querySelector(selector);
  button.removeAttribute('disabled');
  button.addEventListener('click', () => {
    noise.toggle();
  });
}

/**
 * Updates the styles on a button to indicate it's playing.
 *
 * @param {Button} button - The button element to update.
 * @param {boolean} isPlaying - If the noise is playing or not.
 */
function updateNoiseButtonState(button, isPlaying) {
  button.classList.toggle('on', isPlaying);
  updateMediaSession();
}

/**
 * Setup the Media Session API.
 * @param {Object=} opts - Options param.
 * @param {Function=} opts.gaEvent - For tracking Google Analytics events.
 */
function setupMediaSession(opts = {}) {
  if ('mediaSession' in navigator) {
    // eslint-disable-next-line no-undef
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'SoundDrown',
      album: 'White Noise Generator',
      artwork: [
        {src: '/images/48.png', sizes: '48x48', type: 'image/png'},
        {src: '/images/192.png', sizes: '192x192', type: 'image/png'},
        {src: '/images/256.png', sizes: '256x256', type: 'image/png'},
        {src: '/images/512.png', sizes: '512x412', type: 'image/png'},
      ],
    });
    navigator.mediaSession.setActionHandler('play', () => {
      mediaSessionPlay();
      if (opts.gaEvent) {
        opts.gaEvent('MediaSessionAPI', 'play');
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      mediaSessionPause();
      if (opts.gaEvent) {
        opts.gaEvent('MediaSessionAPI', 'pause');
      }
    });
    soundDrownApp.audioElement = document.querySelector('audio');
    soundDrownApp.audioElement.src = '/sounds/silence.mp3';
    if (opts.gaEvent) {
      opts.gaEvent('MediaSession', 'enabled');
    }
  }
}

/**
 * Handler for the Media Session API play button.
 */
function mediaSessionPlay() {
  if (!soundDrownApp.audioElement || !soundDrownApp.audioElement.paused) {
    return;
  }
  let somethingStarted = false;
  if (soundDrownApp.mediaSessionPreviousState.wn) {
    soundDrownApp.wn.toggle(true);
    somethingStarted = true;
  }
  if (soundDrownApp.mediaSessionPreviousState.bn) {
    soundDrownApp.bn.toggle(true);
    somethingStarted = true;
  }
  if (soundDrownApp.mediaSessionPreviousState.pn) {
    soundDrownApp.pn.toggle(true);
    somethingStarted = true;
  }
  if (soundDrownApp.mediaSessionPreviousState.bi) {
    soundDrownApp.bi.toggle(true);
    somethingStarted = true;
  }
  if (!somethingStarted) {
    soundDrownApp.wn.toggle(true);
  }
}

/**
 * Handler for the Media Session API pause button.
 */
function mediaSessionPause() {
  if (!soundDrownApp.audioElement || soundDrownApp.audioElement.paused) {
    return;
  }
  soundDrownApp.mediaSessionPreviousState.wn = soundDrownApp.wn.playing;
  soundDrownApp.mediaSessionPreviousState.bn = soundDrownApp.bn.playing;
  soundDrownApp.mediaSessionPreviousState.pn = soundDrownApp.pn.playing;
  soundDrownApp.mediaSessionPreviousState.bi = soundDrownApp.bi.playing;
  stopAll();
}

/**
 * Updates the play state of the <audio> element used by the
 * Media Session API.
 */
function updateMediaSession() {
  if (!soundDrownApp.audioElement) {
    return;
  }
  if (soundDrownApp.wn.playing || soundDrownApp.pn.playing ||
      soundDrownApp.bn.playing || soundDrownApp.bi.playing) {
    if (soundDrownApp.audioElement.paused) {
      soundDrownApp.audioElement.play();
    }
    return;
  }
  soundDrownApp.audioElement.pause();
}

/**
 * Stop all noise generators.
 */
function stopAll() {
  soundDrownApp.wn.toggle(false);
  soundDrownApp.pn.toggle(false);
  soundDrownApp.bn.toggle(false);
  soundDrownApp.bi.toggle(false);
}

window.addEventListener('load', () => {
  const promises = [];
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butWhite',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownApp.wn = new WhiteNoise(opts);
    setupNoiseButton('#butWhite', soundDrownApp.wn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butPink',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownApp.pn = new PinkNoise(opts);
    setupNoiseButton('#butPink', soundDrownApp.pn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butBrown',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownApp.bn = new BrownNoise(opts);
    setupNoiseButton('#butBrown', soundDrownApp.bn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butBinaural',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownApp.bi = new BinauralNoise(opts);
    setupNoiseButton('#butBinaural', soundDrownApp.bi);
    resolve(true);
  }));
  Promise.all(promises).then(() => {
    if ('performance' in window) {
      const pNow = Math.round(performance.now());
      // eslint-disable-next-line no-undef
      gaEvent('Performance Metrics', 'sounds-ready', null, pNow, true);
    }
  });
  new Promise((resolve) => {
    // eslint-disable-next-line no-undef
    setupMediaSession({gaEvent});
  });
});

window.addEventListener('unload', () => {
  stopAll();
});
