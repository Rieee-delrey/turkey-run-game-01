// Keyboard and pointer input. Held keys steer; one-shot presses (jump, dash,
// hide, start, pause) are queued as bit flags and taken once by the loop, so
// a press between two frames is never lost and never counted twice.

export const ACTION_JUMP = 1;
export const ACTION_DASH = 2;
export const ACTION_HIDE = 4;
export const ACTION_CONFIRM = 8;
export const ACTION_PAUSE = 16;

const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const DASH = new Set(['ShiftLeft', 'ShiftRight', 'KeyX']);
const HIDE = new Set(['KeyH', 'ArrowDown', 'KeyS']);
const DUCK = new Set(['ArrowDown', 'KeyS']);
const PAUSE = new Set(['KeyP', 'Escape']);
const CONFIRM = new Set(['Enter']);

export function createInput(target) {
  let duck = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (JUMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_JUMP;
    } else if (DASH.has(event.code)) {
      if (!event.repeat) actions |= ACTION_DASH;
    } else if (HIDE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HIDE;
      duck = true;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (DUCK.has(event.code)) duck = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    duck = false;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_JUMP;
  });

  return {
    /** True while the duck key is held. */
    ducking() {
      return duck;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
