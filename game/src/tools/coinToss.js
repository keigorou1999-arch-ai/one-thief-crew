// Coin toss: a coin thrown to where the mouse points. Guards in earshot who can walk straight to
// it go and look; the others stop and turn their heads. Either way they are not watching you.
import { GUARD, TICK, TOOLS } from '../config.js';
import { SIGHT_BLOCKERS } from '../level/floorPlan.js';
import { sightBlocked } from '../level/wallCollision.js';
import { HOLD, makeGuardListen, RESPOND, sendGuardTo } from '../ai/guardPatrol.js';

/** Where a coin thrown from (fromX, fromY) at the aim point lands: no farther than the throw range. */
export function coinLanding(fromX, fromY, aimX, aimY) {
  const dx = aimX - fromX;
  const dy = aimY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance <= TOOLS.coin.throwRange) return { x: aimX, y: aimY };
  return { x: fromX + (dx / distance) * TOOLS.coin.throwRange, y: fromY + (dy / distance) * TOOLS.coin.throwRange };
}

export function tossCoin(world, x, y) {
  world.coins.push({ x, y, seconds: 3.5 });
  for (const guard of world.guards) {
    if (guard.mode === RESPOND || guard.mode === HOLD) continue;
    if (Math.hypot(guard.x - x, guard.y - y) > TOOLS.coin.hearing) continue;
    if (sightBlocked(guard.x, guard.y, x, y, SIGHT_BLOCKERS)) makeGuardListen(guard, x, y);
    else sendGuardTo(guard, x, y, GUARD.coinHoldSeconds);
  }
  world.events.push({ type: 'coin' });
}

export function stepCoins(world) {
  for (const coin of world.coins) coin.seconds -= TICK;
  world.coins = world.coins.filter((coin) => coin.seconds > 0);
}
