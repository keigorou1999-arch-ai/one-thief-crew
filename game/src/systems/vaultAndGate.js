// The two locks of the room. The vault opens once thieves have stood at its door for long
// enough (two selves crack it twice as fast); the laser gate is open only while some self
// stands on the hold plate, or for a few seconds after an EMP.
import { TICK, VAULT } from '../config.js';
import { HOLD_PLATE, VAULT_DOOR } from '../level/floorPlan.js';

export function createVault() {
  return { progress: 0, open: false };
}

export function createLaserGate() {
  return { open: false, jammedSeconds: 0, heldBy: null };
}

function canWork(thief) {
  return !thief.caught && !thief.hidden;
}

export function stepVaultCracking(world) {
  const vault = world.vault;
  if (vault.open) return;
  for (const thief of world.selves) {
    if (canWork(thief) && Math.hypot(thief.x - VAULT_DOOR.x, thief.y - VAULT_DOOR.y) < VAULT.radius) vault.progress += TICK;
  }
  if (vault.progress >= VAULT.crackSeconds) {
    vault.open = true;
    world.events.push({ type: 'vaultOpen' });
  }
}

export function stepLaserGate(world) {
  const gate = world.gate;
  const wasOpen = gate.open;
  if (gate.jammedSeconds > 0) gate.jammedSeconds -= TICK;
  gate.heldBy = null;
  for (const thief of world.selves) {
    if (canWork(thief) && Math.hypot(thief.x - HOLD_PLATE.x, thief.y - HOLD_PLATE.y) < HOLD_PLATE.radius) gate.heldBy = thief;
  }
  gate.open = gate.heldBy !== null || gate.jammedSeconds > 0;
  if (gate.open !== wasOpen) world.events.push({ type: 'gate', open: gate.open });
}
