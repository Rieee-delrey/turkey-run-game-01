// All sound is synthesized with WebAudio, so the game ships no audio files.
// Every call is guarded: with no audio device, or before the first gesture,
// the game stays silent instead of throwing.

function beep(ctx, freq, dur, type, vol, when = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
  gain.gain.setValueAtTime(vol, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + dur + 0.02);
}

export function createAudio() {
  let ctx = null;
  let warned = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      if (!warned) {
        warned = true;
      }
      return null;
    }
    return ctx;
  }

  return {
    /** Call once on the first user gesture so later sounds are allowed. */
    unlock() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    },
    gobble() {
      const c = ensure();
      if (!c) return;
      // Three quick descending clucks: the turkey announcing itself.
      beep(c, 420, 0.07, 'square', 0.05, 0);
      beep(c, 330, 0.07, 'square', 0.05, 0.09);
      beep(c, 260, 0.1, 'square', 0.05, 0.18);
    },
    jump() {
      const c = ensure();
      if (!c) return;
      beep(c, 300, 0.12, 'sine', 0.06);
      beep(c, 520, 0.1, 'sine', 0.04, 0.05);
    },
    corn() {
      const c = ensure();
      if (!c) return;
      beep(c, 880, 0.08, 'triangle', 0.06);
      beep(c, 1320, 0.12, 'triangle', 0.05, 0.07);
    },
    feather() {
      const c = ensure();
      if (!c) return;
      beep(c, 660, 0.08, 'triangle', 0.06);
      beep(c, 990, 0.08, 'triangle', 0.06, 0.08);
      beep(c, 1320, 0.16, 'triangle', 0.06, 0.16);
    },
    hit() {
      const c = ensure();
      if (!c) return;
      beep(c, 140, 0.25, 'sawtooth', 0.09);
      beep(c, 90, 0.3, 'sawtooth', 0.08, 0.05);
    },
    alarm() {
      const c = ensure();
      if (!c) return;
      beep(c, 700, 0.09, 'square', 0.04);
      beep(c, 520, 0.09, 'square', 0.04, 0.12);
    },
    caught() {
      const c = ensure();
      if (!c) return;
      beep(c, 392, 0.18, 'sawtooth', 0.07);
      beep(c, 311, 0.18, 'sawtooth', 0.07, 0.18);
      beep(c, 233, 0.4, 'sawtooth', 0.07, 0.36);
    },
    escaped() {
      const c = ensure();
      if (!c) return;
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => beep(c, f, 0.18, 'triangle', 0.07, i * 0.13));
    },
  };
}
