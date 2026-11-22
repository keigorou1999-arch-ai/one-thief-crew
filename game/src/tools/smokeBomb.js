// Smoke bomb: a cloud at the thief's feet that no cone can see into or through while it lasts.
import { TICK, TOOLS } from '../config.js';

export function dropSmokeBomb(world, x, y) {
  world.smokeClouds.push({ x, y, radius: TOOLS.smoke.radius, seconds: TOOLS.smoke.seconds });
  world.events.push({ type: 'smoke' });
}

export function stepSmokeClouds(world) {
  for (const cloud of world.smokeClouds) cloud.seconds -= TICK;
  world.smokeClouds = world.smokeClouds.filter((cloud) => cloud.seconds > 0);
}
