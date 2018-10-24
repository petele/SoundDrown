'use strict';

/**
 * Class representing a Low Hum Generator.
 * @extends Noise
 */
class LowHum extends Noise { // eslint-disable-line no-unused-vars, no-undef
  /**
   * Create a low hum tone object.
   * @param {Object} [opts={}] - See {@link Noise} for base options.
   * @param {number} [opts.frequency=440] - The primary frequency (Hz) to play.
   * @param {string} [opts.waveType=sine] - The shape
   * ({@linkcode LowHum#WAVE_FORMS|WAVE_FORM}) of the oscillator wave.
   */
  constructor(opts = {}) {
    super('LowHum', opts);
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
    this._frequency = opts.frequency || 60;
    this._waveType = opts.waveType || this.WAVE_FORMS.SINE;

    // Hook up the nodes
    const context = this._audioContext;
    this._oscillator = context.createOscillator();

    // Set up the initial options
    this.setWaveType(this._waveType);
    this.setFrequency(this._frequency);

    // Connect the channels & start the sound
    this._oscillator.start(0);

    return this._addGain(this._oscillator, 0.7);
  }
  /**
   * Sets the tone frequency.
   * @param {number} frequency - The primary frequency (Hz) to play.
   * @return {Object} The frequency that was set.
   */
  setFrequency(frequency) {
    if (frequency === this._oscillator.frequency.value) {
      return;
    }
    this._oscillator.frequency.value = frequency;
    this._frequency = frequency;
    console.log('🎛️', frequency);
    return frequency;
  }
  /**
   * Sets the shape of the oscillator wave form.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/type}
   * @param {string} waveType - The shape of the oscillator wave.
   * @return {string} The wave form used by the channel.
   */
  setWaveType(waveType) {
    if (waveType === this._oscillator.type) {
      return waveType;
    }
    this._oscillator.type = waveType;
    this._waveType = waveType;
    console.log('🎛️', 'Wave Type:', waveType);
    return waveType;
  }
}
