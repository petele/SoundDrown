'use strict';

const soundDrownApp = {
  wn: null,
  pn: null,
  bn: null,
  bi: null,
  audioElement: null,
  mediaSessionPreviousState: {},
};
const BUFFER_SIZE = 1024 * 1;

class Noise {
  constructor(name, opts = {}) {
    this.name = name;
    this.playing = false;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.noiseGenerator = this.getGenerator();
    this.noiseGenerator.connect(this.audioContext.destination);
    this.startedAt = 0;
    if (opts.buttonSelector) {
      this.button = document.querySelector(opts.buttonSelector);
    }
  }
  applyGain(noise, gainValue) {
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = gainValue;
    noise.connect(gainNode);
    return gainNode;
  }
  toggle(play) {
    if (play === true && this.playing === true) {
      return;
    }
    if (play === false && this.playing === false) {
      return;
    }
    if (typeof play !== 'boolean') {
      play = !this.playing;
    }
    if (play) {
      this.audioContext.resume();
      this.startedAt = Date.now();
      gaEvent('Noise', 'start', this.name);
    } else {
      this.audioContext.suspend();
      const duration = Math.round((Date.now() - this.startedAt) / 1000);
      gaEvent('Noise', 'duration', this.name, duration);
    }
    this.playing = play;
    if (this.button) {
      updateNoiseButtonState(this.button, play);
    }
    return play;
  }
}

class WhiteNoise extends Noise {
  constructor(opts = {}) {
    super('WhiteNoise', opts);
  }
  getGenerator() {
    const noise = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
    noise.addEventListener('audioprocess', (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < BUFFER_SIZE; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    });
    return this.applyGain(noise, 0.75);
  }
}

class PinkNoise extends Noise {
  constructor(opts = {}) {
    super('PinkNoise', opts);
  }
  getGenerator() {
    const noise = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    noise.addEventListener('audioprocess', (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < BUFFER_SIZE; i++) {
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
    return this.applyGain(noise, 0.15);
  }
}

class BrownNoise extends Noise {
  constructor(opts = {}) {
    super('BrownNoise', opts);
  }
  getGenerator() {
    const noise = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
    let lastOut = 0.0;
    noise.addEventListener('audioprocess', (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < BUFFER_SIZE; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.0207 * white)) / 1.018;
        lastOut = output[i];
      }
    });
    return this.applyGain(noise, 3.5);
  }
}

class BinauralNoise extends Noise {
  constructor(opts = {}) {
    super('BinauralNoise', opts);
  }
  getGenerator() {
    return new BinauralBeatJS(this.audioContext, this.opts);
  }
}

function setupNoiseButton(selector, noise) {
  const button = document.querySelector(selector);
  button.removeAttribute('disabled');
  button.addEventListener('click', () => {
    noise.toggle();
  });
}

function updateNoiseButtonState(button, isPlaying) {
  button.classList.toggle('on', isPlaying);
  updateMediaSession();
}

function setupMediaSession() {
  if ('mediaSession' in navigator) {
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
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      mediaSessionPause();
    });
    soundDrownApp.audioElement = document.querySelector('audio');
    soundDrownApp.audioElement.src = '/sounds/silence.mp3';
    gaEvent('MediaSession', 'enabled');
  }
}

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

function stopAll() {
  soundDrownApp.wn.toggle(false);
  soundDrownApp.pn.toggle(false);
  soundDrownApp.bn.toggle(false);
  soundDrownApp.bi.toggle(false);
}

window.addEventListener('load', () => {
  const promises = [];
  promises.push(new Promise((resolve) => {
    soundDrownApp.wn = new WhiteNoise({buttonSelector: '#butWhite'});
    setupNoiseButton('#butWhite', soundDrownApp.wn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    soundDrownApp.pn = new PinkNoise({buttonSelector: '#butPink'});
    setupNoiseButton('#butPink', soundDrownApp.pn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    soundDrownApp.bn = new BrownNoise({buttonSelector: '#butBrown'});
    setupNoiseButton('#butBrown', soundDrownApp.bn);
    resolve(true);
  }));
  promises.push(new Promise((resolve) => {
    soundDrownApp.bi = new BinauralNoise({buttonSelector: '#butBinaural'});
    setupNoiseButton('#butBinaural', soundDrownApp.bi);
    resolve(true);
  }));
  Promise.all(promises).then(() => {
    if ('performance' in window) {
      const pNow = Math.round(performance.now());
      gaEvent('Performance Metrics', 'sounds-ready', null, pNow, true);
    }
  });
  new Promise((resolve) => {
    setupMediaSession();
  });
});

window.addEventListener('unload', () => {
  stopAll();
});
