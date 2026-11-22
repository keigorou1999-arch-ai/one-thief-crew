// Keyboard and mouse: held keys become a movement stick, single presses become one-shot actions
// (tool, interact, rewind, confirm), and the mouse position is kept in drawing coordinates so a
// click can throw a coin at it.
import { VIEW } from '../config.js';

const MOVE_KEYS = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
};
const PRESS_KEYS = {
  Digit1: 'smoke', Digit2: 'emp', Digit3: 'coin',
  Space: 'interact', KeyE: 'interact',
  KeyR: 'rewind', Enter: 'confirm', KeyM: 'mute',
};

export function createKeyboardMouse(canvas, onFirstTouch) {
  const held = new Set();
  let pressed = [];
  const aim = { x: VIEW.width / 2, y: VIEW.height / 2 };

  function aimFromEvent(event) {
    const box = canvas.getBoundingClientRect();
    aim.x = ((event.clientX - box.left) / box.width) * VIEW.width;
    aim.y = ((event.clientY - box.top) / box.height) * VIEW.height;
  }

  window.addEventListener('keydown', (event) => {
    onFirstTouch();
    if (MOVE_KEYS[event.code]) {
      held.add(event.code);
      event.preventDefault();
    } else if (PRESS_KEYS[event.code]) {
      if (!event.repeat) pressed.push(PRESS_KEYS[event.code]);
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousemove', aimFromEvent);
  canvas.addEventListener('mousedown', (event) => {
    onFirstTouch();
    aimFromEvent(event);
    pressed.push('click');
    event.preventDefault();
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  /** The movement stick from the held keys: each axis -1, 0 or 1. */
  function stick() {
    let x = 0;
    let y = 0;
    for (const code of held) {
      x += MOVE_KEYS[code][0];
      y += MOVE_KEYS[code][1];
    }
    return { x: Math.sign(x), y: Math.sign(y) };
  }

  /** The one-shot actions since the last call, oldest first. */
  function takePresses() {
    const taken = pressed;
    pressed = [];
    return taken;
  }

  return { stick, takePresses, aim };
}
