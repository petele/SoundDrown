/* global gaEvent, gaTiming, WhiteNoise, PinkNoise, BrownNoise, BinauralTone */
'use strict';

/**
 * SoundDrown App Base Class
 */
class SoundDrownApp {
  /**
   * Create the SoundDrown app.
   */
  constructor() {
    this._setupNoise('butWhite', WhiteNoise);
    this._setupNoise('butPink', PinkNoise);
    this._setupNoise('butBrown', BrownNoise);
    this._setupNoise('butBinaural', BinauralTone);

    window.addEventListener('unload', () => {
      this.stopAll();
    });

    if ('performance' in window) {
      // eslint-disable-next-line compat/compat
      const pNow = Math.round(performance.now());
      gaTiming('Start', 'sound-ready', pNow);
    }
  }
  /**
   * Helper function to set up a noise
   * @param {string} buttonID - ID for the button element for the noise toggler.
   * @param {Class} NoiseClass - The noise generator class to create & use.
   * @param {Object} [opts={}] - Optional parameters.
   */
  _setupNoise(buttonID, NoiseClass, opts) {
    const button = document.getElementById(buttonID);
    const noise = new NoiseClass(button, opts);
    button.noise = noise;
    // Set up the button click listener.
    button.addEventListener('click', (e) => {
      noise.toggle();
      if (this.mediaSessionController) {
        this.mediaSessionController.updatePlayState();
      }
    });
    // Set up the noise initialized listener.
    button.addEventListener('initialized', (e) => {
      gaEvent('Noise', 'initialized', e.detail.name);
    });
    // Set up the noise start listener.
    button.addEventListener('start', (e) => {
      gaEvent('Noise', 'start', e.detail.name);
    });
    // Set up the noise stop listener.
    button.addEventListener('stop', (e) => {
      gaEvent('Noise', 'duration', e.detail.name, e.detail.duration);
    });
    // Remove the disabled button from the event.
    button.removeAttribute('disabled');
  }
  /**
   * Gets the current audio context
   * @readonly
   * @return {AudioContext}
   */
  get audioContext() {
    if (this._audioContext) {
      return this._audioContext;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this._audioContext = new AudioContext();
    if ('performance' in window) {
      // eslint-disable-next-line compat/compat
      const pNow = Math.round(performance.now());
      gaTiming('First Noise', 'audio-context-created', pNow);
    }
    return this._audioContext;
  }
  /**
   * Stops all noises from playing.
   */
  stopAll() {
    const buttons = document.querySelectorAll('.sound-container button');
    buttons.forEach((noiseButton) => {
      noiseButton.noise.pause();
    });
    gaEvent('Noise', 'stopAll');
  }
}

window.addEventListener('DOMContentLoaded', (e) => {
  // eslint-disable-next-line no-undef
  window.soundDrownApp = new SoundDrownApp();
});


