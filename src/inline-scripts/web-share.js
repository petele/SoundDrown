/* global gaEvent */
'use strict';

window.addEventListener('load', () => {
  if (!('share' in navigator)) {
    return;
  }
  const butShare = document.getElementById('butShare');
  butShare.addEventListener('click', (e) => {
    gaEvent('Share', 'click');
    const shareOpts = {
      title: 'SoundDrown',
      text:
        'Check out SoundDrown, a a simple, easy to use, white noise ' +
        'generator. Use it to drown out annoying noises, friends, ' +
        'co-workers, family, or anything else.',
      url: 'https://SoundDrown.app',
    };
    navigator.share(shareOpts)
        .then((e) => {
          gaEvent('Share', 'success');
        })
        .catch((err) => {
          gaEvent('Share', 'failed');
        });
  });
  butShare.classList.toggle('hidden', false);
});

