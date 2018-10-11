/* eslint no-unused-vars: "off" */

'use strict';

/**
 * Class representing a Binaural Noise Generator.
 * @see {@link https://github.com/ichabodcole/BinauralBeatJS}
 */
class BinauralBeatJS {
  /**
   * Create a Binaural Noise object.
   * @param {AudioContext} audioContext - A initialized audio context.
   * @param {Object} [opts] - The options object.
   * @param {number} [opts.pitch] - The frequency (Hz) of the pitch.
   * @param {number} [opts.beatRate] - How many beats to show.
   * @param {string} [opts.waveType] - *sine*|square|sawtooth|triangle.
   * @param {boolean} [opts.compressNodes] - Unknown.
   */
  constructor(audioContext, opts = {}) {
    this.SINE = 'sine';
    this.SQUARE = 'square';
    this.SAWTOOTH = 'sawtooth';
    this.TRIANGLE = 'triangle';

    this.input = audioContext.createGain();
    this.output = audioContext.createGain();

    this.pitch = opts.pitch || 440;
    this.beatRate = opts.beatRate || 5;
    this.waveType = opts.waveType || this.SINE;
    this.compressNodes = opts.compressNodes || false;
    this.oscillatorsStarted = false;
    this.running = false;
    this._createInternalNodes(audioContext);
    this._routeNodes();
    this.setPitch(this.pitch);
    this.setWaveType(this.waveType);
    this.start();
  }

  /**
   * Creates the internal nodes.
   * @param {AudioContext} ctx - The audio context.
   */
  _createInternalNodes(ctx) {
    this.leftChannel = ctx.createOscillator();
    this.rightChannel = ctx.createOscillator();
    this.channelMerger = ctx.createChannelMerger();
    this.compressor = ctx.createDynamicsCompressor();
  }

  /** Routes the internal nodes. */
  _routeNodes() {
    if (this.compressNodes) {
      this.input.connect(this.compressor);
      this.channelMerger.connect(this.compressor);
      this.compressor.connect(this.output);
      return;
    }
    this.input.connect(this.output);
    this.channelMerger.connect(this.output);
  }

  /** Start the oscillators. */
  _startOscillators() {
    this.leftChannel.start(0);
    this.rightChannel.start(0);
    this.oscillatorsStarted = true;
  }

  /** Connect the oscillators. */
  _connectOscillators() {
    this.leftChannel.connect(this.channelMerger, 0, 0);
    this.rightChannel.connect(this.channelMerger, 0, 1);
  }

  /** Disconect the oscillators. */
  _disconnectOscillators() {
    this.leftChannel.disconnect();
    this.rightChannel.disconnect();
  }

  /**
   * Gets the frequency for a channel.
   * @param {number} channelNum - Left 0 | Right 1.
   * @return {number} pitch + frequency offset.
   */
  _getChannelFrequency(channelNum) {
    const frequencyOffset = this.beatRate / 2;
    if (channelNum === 0) {
      return this.pitch - frequencyOffset;
    }
    return this.pitch + frequencyOffset;
  }

  /**
   * Get the left or right channel.
   * @param {number} channelNum - Left 0 | Right 1.
   * @return {WebAudioNode}
   */
  getChannel(channelNum) {
    if (channelNum === 0) {
      return this.leftChannel;
    }
    return this.rightChannel;
  }

  /**
   * Set the pitch (Hz).
   * @param {number} pitchFreq - The pitch/frequency.
   */
  setPitch(pitchFreq) {
    this.pitch = pitchFreq;
    this.leftChannel.frequency.value = this._getChannelFrequency(0);
    this.rightChannel.frequency.value = this._getChannelFrequency(1);
  }

  /**
   * Set the beat rate.
   * @param {number} beatRate - The beat rate.
   */
  setBeatRate(beatRate) {
    this.beatRate = beatRate;
    this.setPitch(this.pitch);
  }

  /**
   * Set the wave type.
   * @param {string} waveType - sine|square|sawtooth|triangle.
   */
  setWaveType(waveType) {
    this.waveType = waveType;
    this.leftChannel.type = this.waveType;
    this.rightChannel.type = this.waveType;
  }

  /**
   * Set the periodic wave.
   * @param {string} periodicWave - ?not sure?.
   */
  setPeriodicWave(periodicWave) {
    this.leftChannel.setPeriodicWave(periodicWave);
    this.rightChannel.setPeriodicWave(periodicWave);
  }

  /** Starts the noise generator. */
  start() {
    if (!this.oscillatorsStarted) {
      this._startOscillators();
    }
    this.running = true;
    this._connectOscillators();
  }

  /** Stops the noise generator. */
  stop() {
    this.running = false;
    this._disconnectOscillators();
  }

  /**
   * Connects the noise generator.
   * @param {WebAudioNode} dest - The destination node.
   * @return {WebAudioNode}
   */
  connect(dest) {
    return this.output.connect(dest.input ? dest.input : dest);
  }

  /**
   * Disconnects the noise generator.
   * @return {WebAudioNode}
   */
  disconnect() {
    return this.output.disconnect();
  }
}
