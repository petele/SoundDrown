'use strict';

class Noise {
  constructor(buttonSelector, context) {
    this.audioContext = context;
    this.button = document.querySelector(buttonSelector);
    this.connectNoise(this.addGenerator());
  }
  connectNoise(noise) {
    this.noise = noise;
    this.gain = this.audioContext.createGain();
    this.gain.gain.value = 0;
    this.noise.connect(this.gain);
    this.gain.connect(this.audioContext.destination);
    this.button.removeAttribute('disabled');
    this.button.addEventListener('click', () => {
      this.toggleNoise();
    });
  }
  toggleNoise() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.gain.gain.value === 0) {
      this.gain.gain.value = 1;
      this.button.classList.toggle('on', true);
      return;
    }
    this.gain.gain.value = 0;
    this.button.classList.toggle('on', false);
  }
}

class WhiteNoise extends Noise {
  constructor(buttonSelector, AudioContext, context) {
    super(buttonSelector, context);
  }
  addGenerator() {
    AudioContext.prototype.createWhiteNoise = function() {
      const bufferSize = 4096;
      const node = this.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      };
      return node;
    };
    return this.audioContext.createWhiteNoise();
  }
}

class PinkNoise extends Noise {
  constructor(buttonSelector, AudioContext, context) {
    super(buttonSelector, context);
  }
  addGenerator() {
    AudioContext.prototype.createPinkNoise = function() {
      const bufferSize = 4096;
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      const node = this.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // (roughly) compensate for gain
          b6 = white * 0.115926;
        }
      };
      return node;
    };
    return this.audioContext.createPinkNoise();
  }
}

class BrownNoise extends Noise {
  constructor(buttonSelector, AudioContext, context) {
    super(buttonSelector, context);
  }
  addGenerator() {
    AudioContext.prototype.createBrownNoise = function() {
      const bufferSize = 4096;
      let lastOut = 0.0;
      const node = this.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // (roughly) compensate for gain
        }
      };
      return node;
    };
    return this.audioContext.createBrownNoise();
  }
}

class BinauralNoise extends Noise {
  constructor(buttonSelector, context, opts) {
    super(buttonSelector, context);
    this.opts = opts;
  }
  addGenerator() {
    return new BinauralBeatJS(this.audioContext, this.opts);
  }
}

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

function initSounds() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.error('No Audio Context');
    return;
  }
  const audioContext = new AudioContext();
  new WhiteNoise('#butWhite', AudioContext, audioContext);
  new PinkNoise('#butPink', AudioContext, audioContext);
  new BrownNoise('#butBrown', AudioContext, audioContext);
  new BinauralNoise('#butBinaural', audioContext);
}

function registerServiceWorker() {
  // Load and register pre-caching Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js', {
        scope: '/',
      });
    });
  }
}

class PWAInstaller {
  constructor(buttonSelector) {
    this.deferredEvent;
    this.installButton = document.querySelector(buttonSelector);
    window.addEventListener('beforeinstallprompt', (e) => {
      this.deferredEvent = e;
      this.installButton.classList.toggle('hidden', false);
    });
    window.addEventListener('appinstalled', (e) => {
      // eslint-disable-next-line no-console
      console.log('App Installed', e);
      this.hideButton();
    });
    this.installButton.addEventListener('click', (e) => {
      this.hideButton();
      if (!this.deferredEvent) {
        return;
      }
      this.deferredEvent.prompt();
      this.deferredEvent.userChoice.then((result) => {
        // eslint-disable-next-line no-console
        console.log('userChoice', result);
        this.deferredEvent = null;
      });
    });
  }
  hideButton() {
    this.installButton.classList.toggle('hidden', true);
  }
}

initSounds();
registerServiceWorker();
new PWAInstaller('#butInstall');
