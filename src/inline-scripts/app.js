/*
  global WhiteNoise, PinkNoise, BrownNoise, BinauralTone, MediaSessionController
*/
'use strict';


/**
 * SoundDrown App Base Class
 */
class SoundDrownApp {
  /**
   * Create the SoundDrown app
   * @param {Object} [opts] - Options used when creating generator.
   * @param {Function} [opts.gaEvent] - For tracking Google Analytics events.
   */
  constructor(opts = {}) {
    this._noises = {};
    if (opts.gaEvent) {
      this._gaEvent = opts.gaEvent;
    }
    this._setupNoise('wn', 'butWhite', WhiteNoise);
    this._setupNoise('pn', 'butPink', PinkNoise);
    this._setupNoise('bn', 'butBrown', BrownNoise);
    this._setupNoise('bi', 'butBinaural', BinauralTone);
    this._mediaSessionCtlr = new MediaSessionController(this._noises, opts);
    if ('performance' in window && this._gaEvent) {
      const pNow = Math.round(performance.now());
      this._gaEvent('Performance Metrics', 'sounds-ready', null, pNow, true);
    }
    window.addEventListener('unload', () => {
      window.soundDrownApp.stopAll();
    });
  }
  /**
   * Helper function to set up a noise
   * @param {string} key - Key to use for soundDrownNoises object.
   * @param {string} buttonID - ID for the button element for the noise toggler.
   * @param {Class} NoiseClass - The noise generator class to create & use.
   */
  _setupNoise(key, buttonID, NoiseClass) {
    const button = document.getElementById(buttonID);
    const opts = {button: button};
    if (this._gaEvent) {
      opts.gaEvent = this._gaEvent;
    }
    button.addEventListener('click', () => {
      let noise = this._noises[key];
      if (!noise) {
        noise = new NoiseClass(opts);
        this._noises[key] = noise;
      }
      noise.toggle();
      this._mediaSessionCtlr.updatePlayState();
    });
    button.removeAttribute('disabled');
  }
  /**
   * Stops all noises from playing.
   */
  stopAll() {
    // eslint-disable-next-line guard-for-in
    for (const key in this._noises) {
      this._noises[key].pause();
    }
  }
}

window.addEventListener('DOMContentLoaded', (e) => {
  // eslint-disable-next-line no-undef
  window.soundDrownApp = new SoundDrownApp({gaEvent});
});


