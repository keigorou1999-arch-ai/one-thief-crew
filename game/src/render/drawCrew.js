// Draws the crew of one: the live thief in white, every past self as a cyan ghost with the dotted
// trail of the path it walks, the loot they carry, the warning lines from a watcher that is
// starting to notice someone, and the tools in play (smoke, coins, EMP rings).
import { THIEF } from '../config.js';
import { ghostTrail } from '../loop/ghostRecorder.js';
import { drawLabel, drawTag, INK, withGlow } from './blueprintStyle.js';

/** Each ghost's whole recorded path as a dotted line, with an arrowhead where it ends. */
export function drawGhostTrails(ctx, world, emphasis) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const thief of world.selves) {
    if (thief.live) continue;
    const trail = ghostTrail(thief.recording, 6);
    if (trail.length < 2) continue;
    ctx.strokeStyle = INK.ghost;
    ctx.globalAlpha = emphasis ? 0.95 : 0.6;
    ctx.lineWidth = emphasis ? 3 : 2;
    ctx.setLineDash([2, 7]);
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i += 1) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
    const end = trail[trail.length - 1];
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(end.x - 6, end.y - 6);
    ctx.lineTo(end.x + 6, end.y + 6);
    ctx.moveTo(end.x + 6, end.y - 6);
    ctx.lineTo(end.x - 6, end.y + 6);
    ctx.stroke();
    if (emphasis) drawTag(ctx, `PATH OF SELF ${thief.id + 1}`, end.x, end.y - 20, 12, INK.ghost);
  }
  ctx.restore();
}

/** How much larger than a ghost the live thief is drawn: the hero must read at thumbnail size. */
const LIVE_SCALE = 1.55;

function drawThiefBody(ctx, thief, color, fill, scale = 1) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  ctx.rotate(thief.facing);
  ctx.scale(scale, scale);
  ctx.fillStyle = fill;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, THIEF.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The burglar's mask: a dark band across the face, and a nose pointing the way they walk.
  ctx.fillStyle = INK.paperDark;
  ctx.fillRect(1, -THIEF.radius + 2, 4, THIEF.radius * 2 - 4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(THIEF.radius + 6, 0);
  ctx.lineTo(THIEF.radius, -4);
  ctx.lineTo(THIEF.radius, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawNoticeMark(ctx, thief) {
  if (thief.noticed <= 0.02 || thief.caught) return;
  ctx.strokeStyle = INK.danger;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.live ? 34 : 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * thief.noticed);
  ctx.stroke();
}

export function drawThieves(ctx, world, clock) {
  for (const thief of world.selves) {
    if (thief.live) continue;
    ctx.save();
    ctx.globalAlpha = thief.hidden ? 0.4 : 0.85;
    drawThiefBody(ctx, thief, thief.caught ? INK.danger : INK.ghost, 'rgba(63, 233, 255, 0.35)');
    ctx.restore();
    const note = thief.caught ? 'CAUGHT' : thief.hidden ? 'IN DUCT' : '';
    drawTag(ctx, `GHOST ${thief.id + 1}${note ? ` ${note}` : ''}`, thief.x, thief.y + 24, 12, thief.caught ? INK.danger : INK.ghost);
    drawNoticeMark(ctx, thief);
  }
  const live = world.live;
  // A soft white halo and a solid glowing ring: the one bright white thing on the sheet.
  const ring = 27 + 2 * Math.sin(clock * 5);
  ctx.save();
  ctx.globalAlpha = live.hidden ? 0.4 : 1;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(live.x, live.y, ring, 0, Math.PI * 2);
  ctx.fill();
  withGlow(ctx, INK.you, 20, () => {
    ctx.strokeStyle = INK.you;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(live.x, live.y, ring, 0, Math.PI * 2);
    ctx.stroke();
    drawThiefBody(ctx, live, INK.you, INK.you, LIVE_SCALE);
  });
  ctx.restore();
  drawTag(ctx, live.hidden ? 'YOU (IN DUCT)' : 'YOU', live.x, live.y - 48, 22, INK.you);
  drawNoticeMark(ctx, live);
}

export function drawLoot(ctx, world, clock) {
  for (const item of world.loot) {
    if (item.banked) continue;
    const locked = item.inVault && !world.vault.open;
    // Carried loot rides at the carrier's shoulder, outside the live thief's bright ring.
    const shoulder = item.carrier ? (item.carrier.live ? 30 : 9) : 0;
    const x = item.x + shoulder;
    const y = item.y - shoulder * 0.6;
    const size = item.carrier ? 8 : 11 + Math.sin(clock * 4) * 1.2;
    ctx.save();
    ctx.globalAlpha = locked ? 0.55 : 1;
    withGlow(ctx, INK.loot, 18, () => {
      ctx.fillStyle = INK.loot;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = INK.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // A locked vault's own tag already names its loot.
    if (locked) continue;
    if (!item.carrier) drawTag(ctx, `LOOT $${item.value / 1000}K`, item.x - (item.inVault ? 40 : 0), item.y + 27, 14, INK.loot);
    else drawLabel(ctx, `$${item.value / 1000}K`, x + 12, y - 4, 13, INK.loot);
  }
}

/** A dashed red line from the eye to whoever is being noticed, and a solid one when a ghost is caught. */
export function drawSightLines(ctx, world) {
  ctx.save();
  ctx.strokeStyle = INK.danger;
  for (const sighting of world.sightings) {
    ctx.globalAlpha = 0.35 + 0.65 * sighting.level;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(sighting.watcher.x, sighting.watcher.y);
    ctx.lineTo(sighting.thief.x, sighting.thief.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const flash of world.sightFlashes) {
    ctx.globalAlpha = Math.min(1, flash.seconds);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(flash.fromX, flash.fromY);
    ctx.lineTo(flash.toX, flash.toY);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawToolEffects(ctx, world, clock) {
  for (const cloud of world.smokeClouds) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, cloud.seconds);
    ctx.fillStyle = 'rgba(214, 232, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK.line;
    ctx.lineWidth = 2;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.setLineDash([5 + ring * 3, 8]);
      ctx.lineDashOffset = clock * (12 + ring * 9);
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius - ring * 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawTag(ctx, 'SMOKE', cloud.x, cloud.y - cloud.radius - 10, 12, INK.line);
  }
  for (const coin of world.coins) {
    withGlow(ctx, INK.loot, 8, () => {
      ctx.strokeStyle = INK.loot;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 12 + ((clock * 40) % 26), 0, Math.PI * 2);
      ctx.stroke();
    });
    drawLabel(ctx, 'CLINK', coin.x, coin.y - 22, 12, INK.loot, 'center');
  }
  for (const ring of world.empRings) {
    ctx.strokeStyle = INK.ghost;
    ctx.lineWidth = 4;
    ctx.globalAlpha = ring.seconds / 0.7;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (1 - ring.seconds / 0.7), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
