// A guard: walks a fixed patrol route with a head that sways left and right, leaves it to deal
// with a caught ghost or a tossed coin, then walks back and picks the route up again. Guards
// never guess: the same room on the same tick always gives the same guard.
import { ALARM, GUARD, TICK } from '../config.js';
import { angleDifference } from '../level/wallCollision.js';

export const PATROL = 'patrol';
export const RESPOND = 'respond';
export const HOLD = 'hold';
export const RETURN = 'return';
export const LISTEN = 'listen';

export function createGuard(post) {
  const start = post.route[0];
  const heading = Math.atan2(post.route[1].y - start.y, post.route[1].x - start.x);
  return {
    kind: 'guard', name: post.name, route: post.route, speed: post.speed,
    x: start.x, y: start.y, nextStop: 1, heading, look: heading, swayPhase: post.phase,
    mode: PATROL, target: null, holdSeconds: 0, leftRouteAt: null,
    range: GUARD.range, halfAngle: GUARD.halfAngle, suspicion: {},
  };
}

/** Send a guard off the route to a point they can walk straight to; they wait there, then return. */
export function sendGuardTo(guard, x, y, holdSeconds) {
  if (guard.mode === PATROL || guard.mode === LISTEN) guard.leftRouteAt = { x: guard.x, y: guard.y };
  guard.mode = RESPOND;
  guard.target = { x, y };
  guard.holdSeconds = holdSeconds;
}

/** Stop a guard and turn their head to a noise they cannot walk to. */
export function makeGuardListen(guard, x, y) {
  if (guard.mode !== PATROL) return;
  guard.mode = LISTEN;
  guard.target = { x, y };
  guard.holdSeconds = GUARD.listenSeconds;
}

function walkToward(guard, x, y, speed) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const distance = Math.hypot(dx, dy);
  const step = speed * TICK;
  const wanted = Math.atan2(dy, dx);
  if (distance > 1) guard.heading += Math.max(-GUARD.turnRate * TICK, Math.min(GUARD.turnRate * TICK, angleDifference(wanted, guard.heading)));
  if (distance <= step) {
    guard.x = x;
    guard.y = y;
    return true;
  }
  guard.x += (dx / distance) * step;
  guard.y += (dy / distance) * step;
  return false;
}

function facePoint(guard, x, y) {
  const wanted = Math.atan2(y - guard.y, x - guard.x);
  guard.heading += Math.max(-GUARD.turnRate * TICK, Math.min(GUARD.turnRate * TICK, angleDifference(wanted, guard.heading)));
}

/** Advance one guard by one tick. */
export function stepGuardPatrol(guard, world) {
  const pace = guard.speed * (world.alarm.level >= ALARM.alertAt ? GUARD.alertBoost : 1);
  guard.swayPhase += GUARD.swayRate * TICK;
  let sway = GUARD.sway;
  if (guard.mode === PATROL) {
    const stop = guard.route[guard.nextStop];
    if (walkToward(guard, stop.x, stop.y, pace)) guard.nextStop = (guard.nextStop + 1) % guard.route.length;
  } else if (guard.mode === RESPOND) {
    sway = 0.12;
    const dx = guard.target.x - guard.x;
    const dy = guard.target.y - guard.y;
    if (Math.hypot(dx, dy) < 30) guard.mode = HOLD;
    else walkToward(guard, guard.target.x, guard.target.y, pace * GUARD.respondBoost);
  } else if (guard.mode === HOLD || guard.mode === LISTEN) {
    sway = 0.2;
    facePoint(guard, guard.target.x, guard.target.y);
    guard.holdSeconds -= TICK;
    if (guard.holdSeconds <= 0) guard.mode = guard.mode === HOLD ? RETURN : PATROL;
  } else if (guard.mode === RETURN) {
    if (walkToward(guard, guard.leftRouteAt.x, guard.leftRouteAt.y, pace)) guard.mode = PATROL;
  }
  guard.look = guard.heading + sway * Math.sin(guard.swayPhase);
}
