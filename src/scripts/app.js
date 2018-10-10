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
    return noise;
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
    });
    return noise;
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
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // (roughly) compensate for gain
      }
    });
    return noise;
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
  // updateMediaSession();
}

// function setupMediaSession() {
//   if ('mediaSession' in navigator) {
//     navigator.mediaSession.metadata = new MediaMetadata({
//       title: 'SoundDrown',
//       album: 'White Noise Generator',
//       artwork: [
//         {src: '/images/192.png', sizes: '192x192', type: 'image/png'},
//         {src: '/images/512.png', sizes: '512x412', type: 'image/png'},
//       ],
//     });
//     navigator.mediaSession.setActionHandler('play', () => {
//       mediaSessionPlay();
//     });
//     navigator.mediaSession.setActionHandler('pause', () => {
//       mediaSessionPause();
//     });
//     soundDrownApp.audioElement = document.querySelector('audio');
//     soundDrownApp.audioElement.src = '/sounds/silence.mp3';
//     gaEvent('MediaSession', 'enabled');
//   }
// }

// function mediaSessionPlay() {
//   if (soundDrownApp.mediaSessionPreviousState.wn) {
//     soundDrownApp.wn.toggle(true);
//   }
//   if (soundDrownApp.mediaSessionPreviousState.bn) {
//     soundDrownApp.bn.toggle(true);
//   }
//   if (soundDrownApp.mediaSessionPreviousState.pn) {
//     soundDrownApp.pn.toggle(true);
//   }
//   if (soundDrownApp.mediaSessionPreviousState.bi) {
//     soundDrownApp.bi.toggle(true);
//   }
// }

// function mediaSessionPause() {
//   soundDrownApp.mediaSessionPreviousState.wn = soundDrownApp.wn.playing;
//   soundDrownApp.mediaSessionPreviousState.bn = soundDrownApp.bn.playing;
//   soundDrownApp.mediaSessionPreviousState.pn = soundDrownApp.pn.playing;
//   soundDrownApp.mediaSessionPreviousState.bi = soundDrownApp.bi.playing;
//   stopAll();
// }

// function updateMediaSession() {
//   if (!soundDrownApp.audioElement) {
//     return;
//   }
//   if (soundDrownApp.wn.playing || soundDrownApp.pn.playing ||
//       soundDrownApp.bn.playing || soundDrownApp.bi.playing) {
//     if (soundDrownApp.audioElement.paused) {
//       soundDrownApp.audioElement.play();
//     }
//     return;
//   }
//   soundDrownApp.audioElement.pause();
// }

function stopAll() {
  soundDrownApp.wn.toggle(false);
  soundDrownApp.pn.toggle(false);
  soundDrownApp.bn.toggle(false);
  soundDrownApp.bi.toggle(false);
}

window.addEventListener('load', () => {
  soundDrownApp.wn = new WhiteNoise({buttonSelector: '#butWhite'});
  setupNoiseButton('#butWhite', soundDrownApp.wn);
  soundDrownApp.pn = new PinkNoise({buttonSelector: '#butPink'});
  setupNoiseButton('#butPink', soundDrownApp.pn);
  soundDrownApp.bn = new BrownNoise({buttonSelector: '#butBrown'});
  setupNoiseButton('#butBrown', soundDrownApp.bn);
  soundDrownApp.bi = new BinauralNoise({buttonSelector: '#butBinaural'});
  setupNoiseButton('#butBinaural', soundDrownApp.bi);
  // setupMediaSession();
});

window.addEventListener('unload', () => {
  stopAll();
});
