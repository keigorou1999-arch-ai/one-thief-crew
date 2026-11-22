// Boot and the one loop of ONE-THIEF CREW. Keys and mouse are read every frame, the heist
// advances in fixed 1/60 s ticks (so a recorded loop replays exactly), sounds follow what
// happened, and the blueprint is repainted.
//
// ?shot=cover|plan|spotted|getaway stages that scene with the scripted autopilot instead of
// running the loop, paints it and sets window.__shotReady for a screenshot.
import { TICK, VIEW } from './config.js';
import {
  advanceSession, createHeistSession, SCREEN_BLOWN, SCREEN_GETAWAY, SCREEN_PLAY, SCREEN_TITLE, startHeist,
} from './game/heistSession.js';
import { idleInput } from './world/heistWorld.js';
import { renderFrame } from './render/renderFrame.js';
import { createSynthSounds } from './audio/synthSounds.js';
import { createKeyboardMouse } from './input/keyboardMouse.js';
import { stageScene } from './shots/stagedScenes.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME_SECONDS = 0.25;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const session = createHeistSession();
const shot = new URLSearchParams(window.location.search).get('shot');

function runShot(name) {
  stageScene(name, session);
  let painted = 0;
  function paint() {
    renderFrame(ctx, session, 1.3, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const sounds = createSynthSounds();
  const controls = createKeyboardMouse(canvas, sounds.unlock);
  let accumulator = 0;
  let last = performance.now();
  let clock = 0;
  let queued = idleInput();

  function announce(message) {
    status.textContent = message;
  }

  /** Turn this frame's key presses into the next tick's actions, or into menu choices. */
  function readPresses() {
    for (const press of controls.takePresses()) {
      if (press === 'mute') announce(sounds.toggleMute() ? 'Sound off.' : 'Sound on.');
      else if (session.screen === SCREEN_PLAY) {
        if (press === 'smoke' || press === 'emp') queued.tool = press;
        else if (press === 'coin' || press === 'click') queued.tool = 'coin';
        else if (press === 'interact') queued.interact = true;
        else if (press === 'rewind') queued.rewind = true;
      } else if (press === 'confirm' || press === 'click' || press === 'interact') {
        const menu = session.screen === SCREEN_TITLE || session.screen === SCREEN_BLOWN;
        if (menu || (session.screen === SCREEN_GETAWAY && session.seconds > 2)) {
          startHeist(session);
          announce('Loop 1 of 4. Thirty seconds.');
        }
      }
    }
  }

  function playSounds() {
    for (const cue of session.cues) sounds.play(cue);
    session.cues.length = 0;
    for (const event of session.world.events) sounds.play(event.type);
    session.world.events.length = 0;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    clock += elapsed;
    accumulator += elapsed;
    readPresses();
    while (accumulator >= TICK) {
      const stick = controls.stick();
      queued.moveX = stick.x;
      queued.moveY = stick.y;
      queued.aim = { x: controls.aim.x, y: controls.aim.y };
      advanceSession(session, queued);
      queued = idleInput();
      accumulator -= TICK;
    }
    playSounds();
    renderFrame(ctx, session, clock, controls.aim);
  }

  announce('One-Thief Crew. Press Enter to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
