// src/scripts/ui/shared/MusicToggle.ts
// Wires the background-music toggle button (#ex-toggle-music-btn-js) in
// Main.astro's toggle-container. data-sound-state drives both the button's
// wave-path animation (main.css) and which action the next click performs.

const STATE_PLAYING = 'playing';
const STATE_PAUSED  = 'paused';

const button = document.getElementById('ex-toggle-music-btn-js');
const audio  = document.getElementById('ex-bgm-link-js') as HTMLAudioElement | null; // guaranteed <audio> by Main.astro markup

button?.addEventListener('click', async () => {
  if (!audio) return;

  if (button.dataset.soundState === STATE_PLAYING) {
    audio.pause();
    button.dataset.soundState = STATE_PAUSED;
    return;
  }

  try {
    await audio.play();
    button.dataset.soundState = STATE_PLAYING;
  } catch {
    button.dataset.soundState = STATE_PAUSED;
  }
});
