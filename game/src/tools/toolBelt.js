// The tool belt: one entry point for the three tools. Every use is charged to the loot ledger,
// whether the live thief or a replaying ghost makes it, so the final bill counts the whole crew.
import { chargeForTool } from '../systems/lootLedger.js';
import { coinLanding, stepCoins, tossCoin } from './coinToss.js';
import { fireEmpPulse, stepEmpRings } from './empPulse.js';
import { dropSmokeBomb, stepSmokeClouds } from './smokeBomb.js';

/**
 * Use a tool as `thief`. `aim` is where the mouse points (the coin's target). Returns the use as
 * the recorder stores it, or null when the thief cannot use a tool right now.
 */
export function useTool(world, thief, kind, aim) {
  if (thief.caught || thief.hidden) return null;
  let x = thief.x;
  let y = thief.y;
  if (kind === 'smoke') dropSmokeBomb(world, x, y);
  else if (kind === 'emp') fireEmpPulse(world, x, y);
  else if (kind === 'coin') {
    const landing = thief.live ? coinLanding(thief.x, thief.y, aim.x, aim.y) : aim;
    x = landing.x;
    y = landing.y;
    tossCoin(world, x, y);
  } else return null;
  chargeForTool(world.ledger, kind);
  return { kind, x, y };
}

export function stepToolEffects(world) {
  stepSmokeClouds(world);
  stepEmpRings(world);
  stepCoins(world);
}
