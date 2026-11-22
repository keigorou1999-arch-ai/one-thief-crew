// The thief, live or ghost: walking, crawling the air duct, picking loot up, carrying it to the
// van, and being replayed from a recording. A live thief and a ghost obey the same rules.
import { THIEF, TICK } from '../config.js';
import { AIR_DUCT, BOUNDS, GETAWAY_VAN, LASER_GATE, SOLIDS, SOLIDS_GATE_SHUT, THIEF_SPAWN } from '../level/floorPlan.js';
import { circleBlocked, pathLength, pointAlongPath, pointInRect, slideMove } from '../level/wallCollision.js';
import { ghostFrame, toolUsesAtTick } from '../loop/ghostRecorder.js';
import { bankLoot } from '../systems/lootLedger.js';
import { useTool } from '../tools/toolBelt.js';

const DUCT_LENGTH = pathLength(AIR_DUCT.path);
const GRATE_REACH = 30;

export function createThief(id, live, recording) {
  return {
    id, live, recording,
    x: THIEF_SPAWN.x, y: THIEF_SPAWN.y, facing: -Math.PI / 2,
    hidden: false, caught: false, ended: false,
    carrying: null, duct: null, moving: false, stepClock: 0, noticed: 0,
  };
}

export function isInVan(thief) {
  return !thief.hidden && pointInRect(thief.x, thief.y, GETAWAY_VAN.zone);
}

/** Walk the live thief by the player's stick (mx, my), or carry on crawling the duct. */
export function moveThief(thief, mx, my, world) {
  if (thief.duct) {
    crawlDuct(thief);
    return;
  }
  const length = Math.hypot(mx, my);
  thief.moving = length > 0.01;
  if (!thief.moving) return;
  const speed = (thief.carrying ? THIEF.carrySpeed : THIEF.speed) * TICK;
  // A thief already standing in the gate when its beams come back on may still step out of it.
  const gateIsPassable = world.gate.open || circleBlocked(thief.x, thief.y, THIEF.radius, [LASER_GATE]);
  slideMove(thief, (mx / length) * speed, (my / length) * speed, THIEF.radius, gateIsPassable ? SOLIDS : SOLIDS_GATE_SHUT, BOUNDS);
  thief.facing = Math.atan2(my, mx);
  thief.stepClock += TICK;
  if (thief.stepClock > 0.28) {
    thief.stepClock = 0;
    world.events.push({ type: 'footstep' });
  }
}

/** Which end of the duct the thief is standing on: 'lobby', 'vault' or null. */
export function ductGrateUnder(thief) {
  if (thief.duct) return null;
  const first = AIR_DUCT.path[0];
  const last = AIR_DUCT.path[AIR_DUCT.path.length - 1];
  if (Math.hypot(thief.x - first.x, thief.y - first.y) < GRATE_REACH) return 'lobby';
  if (Math.hypot(thief.x - last.x, thief.y - last.y) < GRATE_REACH) return 'vault';
  return null;
}

/** Climb into the duct when standing on one of its grates. */
export function tryEnterDuct(thief) {
  const grate = ductGrateUnder(thief);
  if (!grate) return false;
  thief.duct = grate === 'lobby' ? { along: 0, direction: 1 } : { along: DUCT_LENGTH, direction: -1 };
  thief.hidden = true;
  return true;
}

function crawlDuct(thief) {
  thief.duct.along += thief.duct.direction * THIEF.ventSpeed * TICK;
  const out = thief.duct.along <= 0 || thief.duct.along >= DUCT_LENGTH;
  const spot = pointAlongPath(AIR_DUCT.path, Math.max(0, Math.min(DUCT_LENGTH, thief.duct.along)));
  thief.x = spot.x;
  thief.y = spot.y;
  thief.moving = true;
  if (out) {
    thief.duct = null;
    thief.hidden = false;
  }
}

/** Put a ghost where its recording says and fire the tools it used on this tick. */
export function replayGhost(ghost, tick, world) {
  if (ghost.caught) return;
  const frame = ghostFrame(ghost.recording, tick);
  if (frame.x !== ghost.x || frame.y !== ghost.y) ghost.facing = Math.atan2(frame.y - ghost.y, frame.x - ghost.x);
  ghost.moving = frame.x !== ghost.x || frame.y !== ghost.y;
  ghost.x = frame.x;
  ghost.y = frame.y;
  ghost.hidden = frame.hidden;
  if (frame.ended && !ghost.ended) {
    ghost.ended = true;
    dropLoot(ghost, world);
  }
  for (const use of toolUsesAtTick(ghost.recording, tick)) useTool(world, ghost, use.kind, use);
}

/** One item at a time: pick up what you touch, bank it when you reach the van. */
export function updateCarrying(thief, world) {
  if (thief.caught || thief.hidden || thief.ended) return;
  if (thief.carrying) {
    const item = thief.carrying;
    item.x = thief.x;
    item.y = thief.y;
    if (isInVan(thief)) {
      thief.carrying = null;
      item.carrier = null;
      bankLoot(world.ledger, item);
      world.events.push({ type: 'banked', item });
    }
    return;
  }
  for (const item of world.loot) {
    if (item.carrier || item.banked || (item.inVault && !world.vault.open)) continue;
    if (Math.hypot(item.x - thief.x, item.y - thief.y) > THIEF.reach) continue;
    item.carrier = thief;
    thief.carrying = item;
    world.events.push({ type: 'pickup', item });
    return;
  }
}

/** Whatever a thief was carrying stays on the floor where they stopped. */
export function dropLoot(thief, world) {
  if (!thief.carrying) return;
  thief.carrying.carrier = null;
  thief.carrying = null;
  world.events.push({ type: 'drop' });
}
