// Detection: every guard and camera builds suspicion of each thief it has in its cone. A live
// thief who is fully noticed ends the loop ("SPOTTED"); a ghost who is fully noticed is caught,
// which raises the alarm and pulls a guard off patrol to deal with it: the decoy play.
import { ALARM, GUARD, SIGHT, TICK } from '../config.js';
import { SIGHT_BLOCKERS } from '../level/floorPlan.js';
import { sightBlocked } from '../level/wallCollision.js';
import { dropLoot } from '../actors/thief.js';
import { raiseAlarm } from '../systems/alarmMeter.js';
import { cameraIsWatching } from './securityCamera.js';
import { sendGuardTo } from './guardPatrol.js';
import { secondsToSpot, seenDistance } from './visionCone.js';

/** Every watcher that can see right now. */
export function activeWatchers(world) {
  return [...world.guards, ...world.cameras.filter(cameraIsWatching)];
}

/** A caught ghost stops where it is; the nearest guard with a clear walk comes to hold it. */
function catchGhost(ghost, watcher, world) {
  ghost.caught = true;
  dropLoot(ghost, world);
  raiseAlarm(world.alarm, ALARM.perGhostCaught);
  let responder = watcher.kind === 'guard' ? watcher : null;
  if (!responder) {
    let nearest = Infinity;
    for (const guard of world.guards) {
      const distance = Math.hypot(guard.x - ghost.x, guard.y - ghost.y);
      if (distance < nearest && !sightBlocked(guard.x, guard.y, ghost.x, ghost.y, SIGHT_BLOCKERS)) {
        nearest = distance;
        responder = guard;
      }
    }
  }
  if (responder) sendGuardTo(responder, ghost.x, ghost.y, GUARD.bustHoldSeconds);
  world.sightFlashes.push({ fromX: watcher.x, fromY: watcher.y, toX: ghost.x, toY: ghost.y, seconds: 1.2 });
  world.events.push({ type: 'ghostCaught', ghost, watcher });
}

/**
 * Advance every watcher's suspicion by one tick. Returns the watcher that has just spotted the
 * live thief, or null. world.sightings lists who is looking at whom, for the warning lines.
 */
export function watchForThieves(world) {
  let spottedBy = null;
  world.sightings.length = 0;
  for (const thief of world.selves) thief.noticed = 0;
  for (const watcher of activeWatchers(world)) {
    for (const thief of world.selves) {
      if (thief.caught) continue;
      const distance = thief.hidden ? -1 : seenDistance(watcher, thief.x, thief.y, world);
      let level = watcher.suspicion[thief.id] ?? 0;
      if (distance >= 0) {
        level = Math.min(1, level + TICK / secondsToSpot(watcher, distance));
        world.sightings.push({ watcher, thief, level });
        if (thief.live) raiseAlarm(world.alarm, ALARM.perSecondNoticed * TICK);
      } else {
        level = Math.max(0, level - SIGHT.forgetPerSecond * TICK);
      }
      watcher.suspicion[thief.id] = level;
      if (level > thief.noticed) thief.noticed = level;
      if (level < 1) continue;
      if (thief.live) spottedBy = spottedBy ?? watcher;
      else catchGhost(thief, watcher, world);
    }
  }
  return spottedBy;
}
