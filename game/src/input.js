// Keyboard and pointer input, reduced to one bitmask a frame.
// Jump, dash, hide and pause are edges (pressed this frame); duck is held.
// Clicking or tapping the canvas jumps, so the mouse plays too.
export const ACTION_JUMP = 1;
export const ACTION_DASH = 2;
export const ACTION_HIDE = 4;
export const ACTION_PAUSE = 8;
export const ACTION_CONFIRM = 16;
export const ACTION_MUTE = 32;

const JUMP_KEYS = new Set(['Space', 'KeyW', 'ArrowUp']);
const DASH_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'KeyX']);
const HIDE_KEYS = new Set(['KeyH']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const DUCK_KEYS = new Set(['KeyS', 'ArrowDown']);
const MUTE_KEYS = new Set(['KeyM']);

export function createInput(canvas) {
  let queued = 0;
  const held = new Set();

  function press(code) {
    if (JUMP_KEYS.has(code)) queued |= ACTION_JUMP | ACTION_CONFIRM;
    else if (DASH_KEYS.has(code)) queued |= ACTION_DASH;
    else if (HIDE_KEYS.has(code)) queued |= ACTION_HIDE;
    else if (PAUSE_KEYS.has(code)) queued |= ACTION_PAUSE;
    else if (MUTE_KEYS.has(code)) queued |= ACTION_MUTE;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    if (JUMP_KEYS.has(event.code) || DASH_KEYS.has(event.code) || HIDE_KEYS.has(event.code)
      || PAUSE_KEYS.has(event.code) || DUCK_KEYS.has(event.code) || MUTE_KEYS.has(event.code)) {
      event.preventDefault();
    }
    held.add(event.code);
    press(event.code);
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointer(event) {
    event.preventDefault();
    queued |= ACTION_JUMP | ACTION_CONFIRM;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointer);

  return {
    /** Take this frame's edge actions and clear them. */
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
    /** Is a duck key held down right now? */
    ducking() {
      for (const code of DUCK_KEYS) if (held.has(code)) return true;
      return false;
    },
  };
}
