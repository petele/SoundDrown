'use strict';

/**
 * List of all of initialized sounds.
 * @type {Object}
 */
const soundDrownNoises = {};

/**
 * Instance of the media session controller.
 * @instance
 * @type {MediaSessionController}
 */
let mediaSessionController;

/**
 * Base class representing a Noise Generator.
 */
class Noise {
  /**
   * Create a Noise object.
   * @param {string} name - Name of the noise generator.
   * @param {Object} [opts] - Options used when creating generator.
   * @param {string} [opts.buttonSelector] - The selector for the button.
   * @param {number} [opts.bufferSize=1024] - Size of WebAudio buffer.
   * @param {Function} [opts.gaEvent] - For tracking Google Analytics events.
   */
  constructor(name, opts = {}) {
    this._name = name;
    this._playing = false;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this._audioContext = new AudioContext();
    this._audioContext.suspend();
    this._opts = opts;
    this._bufferSize = opts.bufferSize || 1024;
    this._noiseGenerator = this._getGenerator(opts);
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
   * Name of the noise generator.
   * @readonly
   * @member {string}
   */
  get name() {
    return this._name;
  }
  /**
   * Is it generating noise.
   * @readonly
   * @member {boolean}
   */
  get playing() {
    return !!this._playing;
  }
  /**
   * Create & return the noise generator.
   * @private
   * @abstract
   */
  _getGenerator() {
    throw new Error('not implemented');
  }
  /**
   * Add a gain filter to the current node.
   * @private
   * @param {AudioNode} noise - The web audio node to apply the gain to.
   * @param {number} gainValue - Amount (float) of gain to add.
   * @return {AudioNode} - Node after the gain has been applied.
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
   * Toggles the noise generator play status.
   * @return {boolean} Playing status.
   */
  toggle() {
    if (this.playing) {
      return this.pause();
    }
    return this.play();
  }
  /**
   * Starts the noise generator.
   * @return {boolean} Playing status.
   */
  play() {
    if (this.playing) {
      return true;
    }
    this._audioContext.resume();
    this._startedAt = Date.now();
    if (this._gaEvent) {
      this._gaEvent('Noise', 'start', this.name);
    }
    this._playing = true;
    if (this._button) {
      this._button.classList.toggle('on', true);
      // updateNoiseButtonState(this._button, true);
    }
    return true;
  }
  /**
   * Pauses the noise generator.
   * @return {boolean} Playing status.
   */
  pause() {
    if (!this.playing) {
      return false;
    }
    this._audioContext.suspend();
    if (this._gaEvent) {
      const duration = Math.round((Date.now() - this._startedAt) / 1000);
      this._gaEvent('Noise', 'duration', this.name, duration);
    }
    this._playing = false;
    if (this._button) {
      this._button.classList.toggle('on', false);
      // updateNoiseButtonState(this._button, false);
    }
    return false;
  }
}

/**
 * Class representing a White Noise Generator.
 * @extends Noise
 */
class WhiteNoise extends Noise {
  /**
   * Create a White Noise object.
   * @param {Object} [opts={}] - See {@link Noise}
   */
  constructor(opts = {}) {
    super('WhiteNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @override
   * @return {ScriptProcessorNode} The newly created node.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
   */
  _getGenerator() {
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
   * @param {Object} [opts={}] - See {@link Noise}
   */
  constructor(opts = {}) {
    super('PinkNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @override
   * @return {ScriptProcessorNode} The newly created node.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
   */
  _getGenerator() {
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
   * @param {Object} [opts={}] - See {@link Noise}
   */
  constructor(opts = {}) {
    super('BrownNoise', opts);
  }
  /**
   * Creates the web audio node.
   * @override
   * @return {AudioNode} The newly created node.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
   */
  _getGenerator() {
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
 * Class representing a Binaural Tone Generator.
 * @extends Noise
 */
class BinauralTone extends Noise {
  /**
   * Create a binaural tone object.
   * @param {Object} [opts={}] - See {@link Noise} for base options.
   * @param {number} [opts.frequency=440] - The primary frequency (Hz) to play.
   * @param {number} [opts.freqDiff=5] - The differential to apply to each
   * channel.
   * @param {string} [opts.waveType=sine] - The shape
   * ({@linkcode BinauralTone#WAVE_FORMS|WAVE_FORM}) of the oscillator wave.
   */
  constructor(opts = {}) {
    super('BinauralTone', opts);
  }
  /**
   * Enum for the different wave forms
   * @readonly
   * @enum {Object}
   */
  get WAVE_FORMS() {
    return {
      SINE: 'sine',
      SQUARE: 'square',
      SAWTOOTH: 'sawtooth',
      TRIANGLE: 'triangle',
    };
  }
  /**
   * Creates the web audio node.
   * @override
   * @param {Object} [opts]
   * @return {ChannelMergerNode} The newly created node.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ChannelMergerNode
   */
  _getGenerator(opts = {}) {
    // Set the initial defaults
    this._freqDiff = opts.freqDiff || 5;
    this._frequency = opts.frequency || 440;
    this._waveType = opts.waveType || this.WAVE_FORMS.SINE;

    // Hook up the nodes
    const context = this._audioContext;
    this._channelMerger = context.createChannelMerger(2);
    this._leftChannel = context.createOscillator();
    this._rightChannel = context.createOscillator();
    this._leftChannel.connect(this._channelMerger, 0, 0);
    this._rightChannel.connect(this._channelMerger, 0, 1);

    // Set up the initial options
    this.setWaveType(this._waveType);
    this.setFrequency(this._frequency, this._freqDiff);

    // Connect the channels & start the sound
    this._leftChannel.connect(this._channelMerger, 0, 0);
    this._rightChannel.connect(this._channelMerger, 0, 1);
    this._leftChannel.start(0);
    this._rightChannel.start(0);

    return this._channelMerger;
  }
  /**
   * Sets the tone frequency and applies the differential between each ear.
   * @param {number} frequency - The primary frequency (Hz) to play.
   * @param {number} [freqDiff] - The differential between the left/right ear.
   * @return {Object} The frequency for the left/right ear.
   */
  setFrequency(frequency, freqDiff) {
    if (!freqDiff) {
      freqDiff = this._freqDiff;
    }
    const offset = freqDiff / 2;
    const leftFreq = frequency - offset;
    const rightFreq = frequency + offset;
    this._leftChannel.frequency.value = leftFreq;
    this._rightChannel.frequency.value = rightFreq;
    this._freqDiff = freqDiff;
    this._frequency = frequency;
    const result = {left: leftFreq, right: rightFreq};
    console.log('🎛️', result);
    return result;
  }
  /**
   * Sets the shape of the oscillator wave form.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type}
   * @param {string} waveType - The shape of the oscillator wave.
   * @return {string} The wave form used by the left channel.
   */
  setWaveType(waveType) {
    if (waveType === this._leftChannel.type) {
      return waveType;
    }
    this._leftChannel.type = waveType;
    this._rightChannel.type = waveType;
    this._waveType = waveType;
    console.log('🎛️', 'Wave Type:', waveType);
    return this._leftChannel.type;
  }
}

/**
 * Remove the disabled attribute from the button and adds an event.
 * handler to toggle the specified noise.
 * @param {string} selector - Button selector.
 * @param {AudioNode} noise - The noise class.
 */
function setupNoiseButton(selector, noise) {
  const button = document.querySelector(selector);
  button.removeAttribute('disabled');
  button.addEventListener('click', () => {
    noise.toggle();
    mediaSessionController.updatePlayState();
  });
}

window.addEventListener('load', (e) => {
  const promises = [];
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butWhite',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownNoises.wn = new WhiteNoise(opts);
    setupNoiseButton('#butWhite', soundDrownNoises.wn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butPink',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownNoises.pn = new PinkNoise(opts);
    setupNoiseButton('#butPink', soundDrownNoises.pn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butBrown',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownNoises.bn = new BrownNoise(opts);
    setupNoiseButton('#butBrown', soundDrownNoises.bn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    const opts = {
      buttonSelector: '#butBinaural',
      gaEvent: gaEvent, // eslint-disable-line no-undef
    };
    soundDrownNoises.bi = new BinauralTone(opts);
    setupNoiseButton('#butBinaural', soundDrownNoises.bi);
    resolve(true);
  }));
  Promise.all(promises).then(() => {
    if ('performance' in window) {
      const pNow = Math.round(performance.now());
      // eslint-disable-next-line no-undef
      gaEvent('Performance Metrics', 'sounds-ready', null, pNow, true);
    }
  });
});

window.addEventListener('unload', () => {
  // eslint-disable-next-line guard-for-in
  for (const key in soundDrownNoises) {
    soundDrownNoises[key].pause();
  }
});
