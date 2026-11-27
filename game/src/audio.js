// All sound is synthesized with WebAudio, so the game ships no audio files.
// Every call is guarded: with no audio device, or before the first gesture,
// the game stays silent instead of throwing. A quiet plucked loop plays
// while running (M mutes everything).
function beep(ctx, freq, dur, type, vol, when = 0, slideTo = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + when + dur);
  gain.gain.setValueAtTime(vol, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + dur + 0.02);
}

/** A slow autumn walk: root notes the loop plucks, one every half second. */
const TUNE = [220, 262, 330, 262, 196, 220, 262, 330, 392, 330, 262, 196];

export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let tuneStep = 0;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }

  function startMusic() {
    if (musicTimer !== null) return;
    musicTimer = window.setInterval(() => {
      const c = ctx;
      if (!c || muted || c.state !== 'running') return;
      const note = TUNE[tuneStep % TUNE.length];
      tuneStep += 1;
      beep(c, note, 0.42, 'triangle', 0.035);
      if (tuneStep % 4 === 1) beep(c, note / 2, 0.8, 'sine', 0.02);
    }, 500);
  }

  return {
    /** Call once on the first user gesture so later sounds are allowed. */
    unlock() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
      if (c) startMusic();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** The turkey's gobble: two quick descending clucks. */
    gobble() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 420, 0.09, 'square', 0.06);
      beep(c, 300, 0.12, 'square', 0.06, 0.09);
    },
    corn() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 660, 0.08, 'sine', 0.07);
      beep(c, 990, 0.1, 'sine', 0.07, 0.06);
    },
    feather() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 880, 0.1, 'sine', 0.08);
      beep(c, 1174, 0.12, 'sine', 0.08, 0.08);
      beep(c, 1568, 0.16, 'sine', 0.08, 0.16);
    },
    hit() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 180, 0.22, 'sawtooth', 0.1, 0, 70);
    },
    alarm() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 520, 0.1, 'square', 0.05);
      beep(c, 520, 0.1, 'square', 0.05, 0.13);
    },
    throwWhoosh() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 900, 0.18, 'sine', 0.04, 0, 300);
    },
    caught() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 330, 0.25, 'sawtooth', 0.09, 0, 110);
      beep(c, 220, 0.4, 'sawtooth', 0.09, 0.22, 82);
    },
    escaped() {
      const c = ensure();
      if (!c || muted) return;
      beep(c, 523, 0.14, 'triangle', 0.09);
      beep(c, 659, 0.14, 'triangle', 0.09, 0.13);
      beep(c, 784, 0.22, 'triangle', 0.09, 0.26);
      beep(c, 1046, 0.3, 'triangle', 0.09, 0.4);
    },
  };
}
