// EMP pulse: blinds every camera in its radius and jams the laser gate open for a few seconds.
import { TICK, TOOLS } from '../config.js';
import { LASER_GATE } from '../level/floorPlan.js';
import { blindCamera } from '../ai/securityCamera.js';

export function fireEmpPulse(world, x, y) {
  const radius = TOOLS.emp.radius;
  for (const camera of world.cameras) {
    if (Math.hypot(camera.x - x, camera.y - y) <= radius) blindCamera(camera, TOOLS.emp.seconds);
  }
  const gateX = LASER_GATE.x + LASER_GATE.w / 2;
  const gateY = LASER_GATE.y + LASER_GATE.h / 2;
  if (Math.hypot(gateX - x, gateY - y) <= radius) world.gate.jammedSeconds = TOOLS.emp.seconds;
  world.empRings.push({ x, y, radius, seconds: 0.7 });
  world.events.push({ type: 'emp' });
}

export function stepEmpRings(world) {
  for (const ring of world.empRings) ring.seconds -= TICK;
  world.empRings = world.empRings.filter((ring) => ring.seconds > 0);
}
