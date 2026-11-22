// A wall camera: its cone sweeps left and right on a fixed period, and an EMP blinds it for a
// few seconds.
import { TICK } from '../config.js';

export function createSecurityCamera(mount) {
  return {
    kind: 'camera', name: mount.name, x: mount.x, y: mount.y,
    facing: mount.facing, sweep: mount.sweep, period: mount.period, phase: mount.phase,
    look: mount.facing, range: mount.range, halfAngle: mount.halfAngle,
    blindSeconds: 0, suspicion: {},
  };
}

export function stepSecurityCamera(camera, tick) {
  camera.look = camera.facing + camera.sweep * Math.sin((tick * TICK * Math.PI * 2) / camera.period + camera.phase);
  if (camera.blindSeconds > 0) camera.blindSeconds -= TICK;
}

export function blindCamera(camera, seconds) {
  camera.blindSeconds = seconds;
  camera.suspicion = {};
}

export function cameraIsWatching(camera) {
  return camera.blindSeconds <= 0;
}
