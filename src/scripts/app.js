'use strict';

const BUFFER_SIZE = 4096;

class Noise {
  constructor(name, context, opts = {}) {
    if (!name) {
      throw new Error('Missing parameter: name');
    }
    this.name = name;
    if (!context) {
      throw new Error('audioContext not provided');
    }
    this.audioContext = context;
    if (opts.buttonSelector) {
      this.button = document.querySelector(opts.buttonSelector);
    }
    this.connectNoise(this.addGenerator());
    this.isPlaying = false;
    this.defaultGain = opts.defaultGain || 0.75;
    if (opts.gainSelector) {
      const elem = document.querySelector(opts.gainSelector);
      elem.addEventListener('change', () => {
        this.setGain(parseInt(elem.value, 10) / 100);
      });
    }
  }
  connectNoise(noise) {
    this.noise = noise;
    this.gain = this.audioContext.createGain();
    this.gain.gain.value = 0;
    this.noise.connect(this.gain);
    this.gain.connect(this.audioContext.destination);
    if (this.button) {
      this.button.removeAttribute('disabled');
      this.button.addEventListener('click', () => {
        this.toggleNoise();
      });
    }
  }
  setGain(newGain) {
    if (newGain < 0 || newGain > 1) {
      console.error(`setGain failed: ${newGain} out of range.`);
      return;
    }
    this.defaultGain = newGain;
    if (this.isPlaying) {
      this.gain.gain.value = newGain;
    }
    ga('send', 'event', 'Settings', this.name, 'defaultGain', newGain);
  }
  toggleNoise(startPlaying) {
    if (this.isPlaying === true && startPlaying === true) {
      // It's already playing, no need to start again
      return;
    }
    if (this.isPlaying === false && startPlaying === false) {
      // It's not currently playing, no need to stop
      return;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (this.isPlaying === false || startPlaying === true) {
      this.gain.gain.value = this.defaultGain;
      this.isPlaying = true;
      if (this.button) {
        this.button.classList.toggle('on', true);
      }
      this.startedPlayingAt = Date.now();
      ga('send', 'event', 'Noise', 'start', this.name, null, this.defaultGain);
      return;
    }
    this.gain.gain.value = 0;
    this.isPlaying = false;
    if (this.button) {
      this.button.classList.toggle('on', false);
    }
    const playTime = Math.round((Date.now() - this.startedPlayingAt) / 1000);
    this.startedPlayingAt = 0;
    ga('send', 'event', 'Noise', 'duration', this.name, playTime);
  }
}

class WhiteNoise extends Noise {
  constructor(context, opts = {}) {
    super('WhiteNoise', context, opts);
  }
  addGenerator() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    AudioContext.prototype.createWhiteNoise = function() {
      const node = this.createScriptProcessor(BUFFER_SIZE, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < BUFFER_SIZE; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      };
      return node;
    };
    return this.audioContext.createWhiteNoise();
  }
}

class PinkNoise extends Noise {
  constructor(context, opts = {}) {
    super('PinkNoise', context, opts);
  }
  addGenerator() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    AudioContext.prototype.createPinkNoise = function() {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      const node = this.createScriptProcessor(BUFFER_SIZE, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < BUFFER_SIZE; i++) {
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
  constructor(context, opts = {}) {
    super('BrownNoise', context, opts);
  }
  addGenerator() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    AudioContext.prototype.createBrownNoise = function() {
      let lastOut = 0.0;
      const node = this.createScriptProcessor(BUFFER_SIZE, 1, 1);
      node.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < BUFFER_SIZE; i++) {
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
  constructor(context, opts = {}) {
    super('BinauralNoise', context, opts);
    this.opts = opts;
    if (opts.pitchSelector) {
      const elem = document.querySelector(opts.pitchSelector);
      const min = parseInt(elem.min, 10) || 100;
      const max = parseInt(elem.max, 10) || 100;
      elem.addEventListener('change', (evt) => {
        const value = parseInt(elem.value, 10);
        if (value < min || value > max) {
          elem.value = this.noise.pitch;
          return;
        }
        ga('send', 'event', 'Settings', this.name, 'pitch', value);
        this.noise.setPitch(value);
      });
    }
    if (opts.beatSelector) {
      const elem = document.querySelector(opts.beatSelector);
      const min = parseInt(elem.min, 10) || 100;
      const max = parseInt(elem.max, 10) || 100;
      elem.addEventListener('change', (evt) => {
        const value = parseInt(elem.value);
        if (value < min || value > max) {
          elem.value = this.noise.beatRate;
          return;
        }
        ga('send', 'event', 'Settings', this.name, 'beatRate', value);
        this.noise.setBeatRate(value);
      });
    }
    if (opts.waveFormSelector) {
      const elem = document.querySelector(opts.waveFormSelector);
      const forms = ['sine', 'square', 'sawtooth', 'triangle'];
      elem.addEventListener('blur', (evt) => {
        const value = elem.value.toLowerCase();
        if (!forms.includes(value)) {
          elem.value = this.noise.waveType;
          return;
        }
        ga('send', 'event', 'Settings', this.name, value);
        this.noise.setWaveType(value);
      });
    }
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

const noises = {};

function initSounds() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.error('No Audio Context');
    ga('send', 'event', 'Error', 'no_audio_context', name);
    return;
  }
  const audioContext = new AudioContext();

  initWhiteNoise(audioContext);
  initPinkNoise(audioContext);
  initBrownNoise(audioContext);
  initBinauralNoise(audioContext);
}

function initFailed(name, err) {
  console.error(`Unable to initialize ${name} noise`, err);
  ga('send', 'event', 'Error', 'init_failed', name);
}

function initWhiteNoise(audioContext) {
  noises.white = 'starting';
  return new Promise((resolve) => {
    const wnOpts = {buttonSelector: '#butWhite', gainSelector: '#wnGain'};
    try {
      noises.white = new WhiteNoise(audioContext, wnOpts);
      resolve(true);
      return;
    } catch (ex) {
      initFailed('white', ex);
    }
  });
}

function initPinkNoise(audioContext) {
  noises.pink = 'starting';
  return new Promise((resolve) => {
    const pnOpts = {buttonSelector: '#butPink', gainSelector: '#pnGain'};
    try {
      noises.pink = new PinkNoise(audioContext, pnOpts);
      resolve(true);
      return;
    } catch (ex) {
      initFailed('pink', ex);
    }
  });
}

function initBrownNoise(audioContext) {
  noises.brown = 'starting';
  return new Promise((resolve) => {
    const bnOpts = {buttonSelector: '#butBrown', gainSelector: '#bnGain'};
    try {
      noises.brown = new BrownNoise(audioContext, bnOpts);
      resolve(true);
      return;
    } catch (ex) {
      initFailed('brown', ex);
    }
  });
}

function initBinauralNoise(audioContext) {
  noises.binaural = 'starting';
  return new Promise((resolve) => {
    const biOpts = {
      buttonSelector: '#butBinaural',
      pitchSelector: '#biPitch',
      beatSelector: '#biBeat',
      waveFormSelector: '#biWaveForm',
      gainSelector: '#biGain',
    };
    try {
      noises.binaural = new BinauralNoise(audioContext, biOpts);
      resolve(true);
      return;
    } catch (ex) {
      initFailed('binaural', ex);
    }
  });
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

function trackWindowMode() {
  window.addEventListener('load', () => {
    if (window.navigator.standalone === true) {
      ga('send', 'event', 'Started', 'windowType', 'standalone-ios');
    } else if (matchMedia('(display-mode: standalone)').matches === true) {
      ga('send', 'event', 'Started', 'windowType', 'standalone');
    } else {
      ga('send', 'event', 'Started', 'windowType', 'browser');
    }
  });
}

class PWAInstaller {
  constructor(buttonSelector) {
    this.deferredEvent;
    this.installButton = document.querySelector(buttonSelector);
    window.addEventListener('beforeinstallprompt', (e) => {
      this.deferredEvent = e;
      this.installButton.classList.toggle('hidden', false);
      ga('send', 'event', 'InstallButton', 'shown');
    });
    window.addEventListener('appinstalled', (e) => {
      ga('send', 'event', 'InstallEvent', 'installed');
      this.hideButton();
    });
    this.installButton.addEventListener('click', (e) => {
      this.hideButton();
      if (!this.deferredEvent) {
        return;
      }
      this.deferredEvent.prompt();
      this.deferredEvent.userChoice.then((result) => {
        ga('send', 'event', 'InstallPromptResponse', result.outcome);
        this.deferredEvent = null;
      });
      ga('send', 'event', 'InstallButton', 'clicked');
    });
  }
  hideButton() {
    this.installButton.classList.toggle('hidden', true);
  }
}

initSounds();
registerServiceWorker();
new PWAInstaller('#butInstall');
trackWindowMode();
