/* eslint no-unused-vars: "off" */

'use strict';

class BinauralBeatJS {
  constructor(audioContext, options = {}) {
    this.SINE = 'sine';
    this.SQUARE = 'square';
    this.SAWTOOTH = 'sawtooth';
    this.TRIANGLE = 'triangle';

    this.input = audioContext.createGain();
    this.output = audioContext.createGain();

    this.pitch = options.pitch || 440;
    this.beatRate = options.beatRate || 5;
    this.waveType = options.waveType || this.SINE;
    this.compressNodes = options.compressNodes || false;
    this.oscillatorsStarted = false;
    this.running = false;
    this._createInternalNodes(audioContext);
    this._routeNodes();
    this.setPitch(this.pitch);
    this.setWaveType(this.waveType);
    this.start();
  }

  _createInternalNodes(ctx) {
    this.leftChannel = ctx.createOscillator();
    this.rightChannel = ctx.createOscillator();
    this.channelMerger = ctx.createChannelMerger();
    this.compressor = ctx.createDynamicsCompressor();
  }

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

  _startOscillators() {
    this.leftChannel.start(0);
    this.rightChannel.start(0);
    this.oscillatorsStarted = true;
  }

  _connectOscillators() {
    this.leftChannel.connect(this.channelMerger, 0, 0);
    this.rightChannel.connect(this.channelMerger, 0, 1);
  }

  _disconnectOscillators() {
    this.leftChannel.disconnect();
    this.rightChannel.disconnect();
  }

  _getChannelFrequency(channelNum) {
    const frequencyOffset = this.beatRate / 2;
    if (channelNum === 0) {
      return this.pitch - frequencyOffset;
    }
    return this.pitch + frequencyOffset;
  }

  getChannel(channel) {
    if (channel === 0) {
      return this.leftChannel;
    }
    return this.rightChannel;
  }

  setPitch(pitchFreq) {
    this.pitch = pitchFreq;
    this.leftChannel.frequency.value = this._getChannelFrequency(0);
    this.rightChannel.frequency.value = this._getChannelFrequency(1);
  }

  setBeatRate(beatRate) {
    this.beatRate = beatRate;
    this.setPitch(this.pitch);
  }

  setWaveType(waveType) {
    this.waveType = waveType;
    this.leftChannel.type = this.waveType;
    this.rightChannel.type = this.waveType;
  }

  setPeriodicWave(periodicWave) {
    this.leftChannel.setPeriodicWave(periodicWave);
    this.rightChannel.setPeriodicWave(periodicWave);
  }

  start() {
    if (!this.oscillatorsStarted) {
      this._startOscillators();
    }
    this.running = true;
    this._connectOscillators();
  }

  stop() {
    this.running = false;
    this._disconnectOscillators();
  }

  connect(dest) {
    return this.output.connect(dest.input ? dest.input : dest);
  }

  disconnect() {
    return this.output.disconnect();
  }
}
