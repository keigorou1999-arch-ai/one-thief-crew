// The room at one moment of one loop, and the single step that advances it: the live thief
// moves, the ghosts replay, loot changes hands, locks update, guards and cameras turn, and the
// watchers decide what they saw. A step returns how the loop ended, or null while it goes on.
import { LOOP_TICKS, TICK } from '../config.js';
import { CAMERA_MOUNTS, GUARD_POSTS, LOOT_ITEMS } from '../level/floorPlan.js';
import { createRecording, recordFrame, recordToolUse } from '../loop/ghostRecorder.js';
import { createThief, isInVan, moveThief, replayGhost, tryEnterDuct, updateCarrying } from '../actors/thief.js';
import { createGuard, stepGuardPatrol } from '../ai/guardPatrol.js';
import { createSecurityCamera, stepSecurityCamera } from '../ai/securityCamera.js';
import { watchForThieves } from '../ai/spotThieves.js';
import { alarmIsLockdown, createAlarmMeter } from '../systems/alarmMeter.js';
import { createLootLedger } from '../systems/lootLedger.js';
import { createLaserGate, createVault, stepLaserGate, stepVaultCracking } from '../systems/vaultAndGate.js';
import { stepToolEffects, useTool } from '../tools/toolBelt.js';

export const ENDED_SPOTTED = 'spotted';
export const ENDED_LOCKDOWN = 'lockdown';
export const ENDED_TIME_UP = 'timeUp';
export const ENDED_REWIND = 'rewind';
export const ENDED_GETAWAY = 'getaway';

/** The input of a tick in which the player does nothing. */
export function idleInput() {
  return { moveX: 0, moveY: 0, tool: null, aim: { x: 0, y: 0 }, interact: false, rewind: false };
}

/** A fresh timeline at 0:30: the room reset, one ghost per sealed recording, one new live thief. */
export function createHeistWorld(recordings) {
  const selves = recordings.map((recording, index) => createThief(index, false, recording));
  const live = createThief(recordings.length, true, createRecording());
  selves.push(live);
  return {
    tick: 0,
    selves,
    live,
    guards: GUARD_POSTS.map(createGuard),
    cameras: CAMERA_MOUNTS.map(createSecurityCamera),
    loot: LOOT_ITEMS.map((item) => ({ ...item, carrier: null, banked: false })),
    vault: createVault(),
    gate: createLaserGate(),
    alarm: createAlarmMeter(),
    ledger: createLootLedger(),
    smokeClouds: [],
    coins: [],
    empRings: [],
    sightings: [],
    sightFlashes: [],
    events: [],
  };
}

function stepSightFlashes(world) {
  for (const flash of world.sightFlashes) flash.seconds -= TICK;
  world.sightFlashes = world.sightFlashes.filter((flash) => flash.seconds > 0);
}

/** Advance the heist by one tick of the player's input. */
export function stepHeist(world, input) {
  const live = world.live;
  let wantsToDrive = false;
  if (input.rewind) return { endedBy: ENDED_REWIND };
  if (input.tool) {
    const use = useTool(world, live, input.tool, input.aim);
    if (use) recordToolUse(live.recording, world.tick, use);
  }
  if (input.interact && !tryEnterDuct(live)) wantsToDrive = isInVan(live);
  moveThief(live, input.moveX, input.moveY, world);
  recordFrame(live.recording, live);
  for (const thief of world.selves) if (!thief.live) replayGhost(thief, world.tick, world);
  for (const thief of world.selves) updateCarrying(thief, world);

  stepVaultCracking(world);
  stepLaserGate(world);
  for (const guard of world.guards) stepGuardPatrol(guard, world);
  for (const camera of world.cameras) stepSecurityCamera(camera, world.tick);
  stepToolEffects(world);
  stepSightFlashes(world);

  const spottedBy = watchForThieves(world);
  world.tick += 1;
  const canDrive = isInVan(live) && world.ledger.banked.length > 0;
  if (wantsToDrive && canDrive) return { endedBy: ENDED_GETAWAY };
  if (spottedBy) return { endedBy: ENDED_SPOTTED, watcher: spottedBy };
  if (alarmIsLockdown(world.alarm)) return { endedBy: ENDED_LOCKDOWN };
  if (world.tick >= LOOP_TICKS) return { endedBy: canDrive ? ENDED_GETAWAY : ENDED_TIME_UP };
  return null;
}
