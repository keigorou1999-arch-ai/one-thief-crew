// Draws the danger: each guard's and each camera's vision cone as a red hatched fan cut by the
// walls, then the guards and cameras themselves. A blinded camera shows a broken grey cone.
import { GUARD } from '../config.js';
import { HOLD, LISTEN, RESPOND } from '../ai/guardPatrol.js';
import { cameraIsWatching } from '../ai/securityCamera.js';
import { coneOutline } from '../ai/visionCone.js';
import { drawLabel, drawTag, hatchFill, INK, tracePolygon } from './blueprintStyle.js';

function drawCone(ctx, watcher, world, color, lean) {
  const outline = coneOutline(watcher, world);
  tracePolygon(ctx, outline);
  ctx.fillStyle = watcher.kind === 'guard' ? 'rgba(255, 61, 79, 0.2)' : 'rgba(255, 138, 31, 0.18)';
  ctx.fill();
  ctx.fillStyle = hatchFill(ctx, color, 9, lean);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawVisionCones(ctx, world) {
  for (const camera of world.cameras) {
    if (cameraIsWatching(camera)) drawCone(ctx, camera, world, INK.camera, -1);
    else {
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = INK.faint;
      ctx.lineWidth = 1.5;
      tracePolygon(ctx, coneOutline(camera, world));
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const guard of world.guards) drawCone(ctx, guard, world, INK.danger, 1);
}

function guardMood(guard) {
  if (guard.mode === RESPOND) return '!';
  if (guard.mode === HOLD) return 'GOT ONE';
  if (guard.mode === LISTEN) return '?';
  return '';
}

export function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.look);
    ctx.fillStyle = INK.danger;
    ctx.strokeStyle = INK.line;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // The cap's peak points where the guard is looking.
    ctx.fillStyle = INK.line;
    ctx.beginPath();
    ctx.moveTo(GUARD.radius + 7, 0);
    ctx.lineTo(GUARD.radius - 3, -6);
    ctx.lineTo(GUARD.radius - 3, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawTag(ctx, `GUARD ${guard.name}`, guard.x, guard.y - 25, 13, INK.danger);
    const mood = guardMood(guard);
    if (mood) drawLabel(ctx, mood, guard.x, guard.y + 26, 15, INK.loot, 'center');
  }
}

export function drawCameras(ctx, world) {
  for (const camera of world.cameras) {
    const watching = cameraIsWatching(camera);
    const color = watching ? INK.camera : INK.faint;
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.rotate(camera.look);
    ctx.fillStyle = INK.paperDark;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillRect(-10, -7, 20, 14);
    ctx.strokeRect(-10, -7, 20, 14);
    ctx.fillStyle = color;
    ctx.fillRect(10, -4, 6, 8);
    ctx.restore();
    const below = camera.facing > 0 ? 22 : -22;
    drawTag(ctx, watching ? `CAMERA ${camera.name}` : `${camera.name} BLIND`, camera.x - 52, camera.y - below * 0.2 + 12, 13, color);
  }
}
