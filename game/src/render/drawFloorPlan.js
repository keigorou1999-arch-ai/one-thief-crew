// Draws the building itself in blueprint ink: walls, door swings, windows, furniture, the green
// dotted safe cover, the air duct, the laser gate and its hold plate, the vault and the van.
import { VAULT } from '../config.js';
import {
  AIR_DUCT, DOORS, FURNITURE, GETAWAY_VAN, HOLD_PLATE, LASER_GATE, ROOM_LABELS, SAFE_COVER, VAULT_DOOR, WALLS, WINDOWS,
} from '../level/floorPlan.js';
import { drawLabel, drawTag, INK, strokeDashedRect, withGlow } from './blueprintStyle.js';

function drawRoomNames(ctx) {
  for (const room of ROOM_LABELS) drawLabel(ctx, room.text, room.x, room.y, room.text.length > 8 ? 17 : 30, INK.ghostText, 'center');
}

function drawSafeCover(ctx) {
  for (const cover of SAFE_COVER) {
    ctx.fillStyle = 'rgba(77, 255, 160, 0.13)';
    ctx.fillRect(cover.x, cover.y, cover.w, cover.h);
    strokeDashedRect(ctx, cover, INK.safe, [3, 5], 2.5);
    drawLabel(ctx, 'SAFE', cover.x + cover.w / 2, cover.y + cover.h / 2, 13, INK.safe, 'center');
  }
}

function drawWallsAndFurniture(ctx) {
  ctx.fillStyle = INK.line;
  for (const wall of WALLS) ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 1.5;
  for (const item of FURNITURE) {
    ctx.fillStyle = 'rgba(234, 244, 255, 0.12)';
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.strokeRect(item.x + 0.5, item.y + 0.5, item.w, item.h);
    ctx.beginPath();
    ctx.moveTo(item.x, item.y);
    ctx.lineTo(item.x + item.w, item.y + item.h);
    ctx.moveTo(item.x + item.w, item.y);
    ctx.lineTo(item.x, item.y + item.h);
    ctx.stroke();
  }
  ctx.strokeStyle = INK.ghost;
  ctx.lineWidth = 2;
  for (const pane of WINDOWS) {
    ctx.strokeRect(pane.x, pane.y + 1.5, pane.w, pane.h - 3);
    drawLabel(ctx, 'WINDOW', pane.x + pane.w / 2, pane.y + 20, 10, INK.faint, 'center');
  }
}

/** The quarter-circle an architect draws for a door's swing. */
function drawDoorSwings(ctx) {
  ctx.strokeStyle = INK.faint;
  ctx.lineWidth = 1.2;
  for (const door of DOORS) {
    ctx.beginPath();
    if (door.swing === 'north') {
      ctx.moveTo(door.x, door.y);
      ctx.lineTo(door.x, door.y - door.w);
      ctx.arc(door.x, door.y, door.w, -Math.PI / 2, 0);
    } else if (door.swing === 'south') {
      ctx.moveTo(door.x, door.y);
      ctx.lineTo(door.x, door.y + door.w);
      ctx.arc(door.x, door.y, door.w, Math.PI / 2, 0, true);
    } else {
      ctx.moveTo(door.x, door.y);
      ctx.lineTo(door.x + door.w, door.y);
      ctx.arc(door.x, door.y, door.w, 0, Math.PI / 2);
    }
    ctx.stroke();
    if (door.label) drawLabel(ctx, door.label, door.x + door.w / 2, door.y + 18, 11, INK.faint, 'center');
  }
}

function drawAirDuct(ctx) {
  const path = AIR_DUCT.path;
  ctx.save();
  ctx.strokeStyle = 'rgba(63, 233, 255, 0.55)';
  ctx.lineWidth = 9;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i += 1) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
  ctx.restore();
  drawLabel(ctx, 'AIR DUCT (CRAWL, UNSEEN)', 560, 684, 11, INK.ghost, 'center');
  for (const grate of [path[0], path[path.length - 1]]) {
    ctx.fillStyle = INK.paperDark;
    ctx.fillRect(grate.x - 13, grate.y - 13, 26, 26);
    ctx.strokeStyle = INK.ghost;
    ctx.lineWidth = 2;
    ctx.strokeRect(grate.x - 13, grate.y - 13, 26, 26);
    ctx.beginPath();
    for (let bar = -8; bar <= 8; bar += 4) {
      ctx.moveTo(grate.x - 13, grate.y + bar);
      ctx.lineTo(grate.x + 13, grate.y + bar);
    }
    ctx.stroke();
    drawLabel(ctx, 'VENT', grate.x, grate.y - 22, 12, INK.ghost, 'center');
  }
}

function drawLaserGateAndPlate(ctx, world, clock) {
  const gate = world.gate;
  ctx.save();
  if (gate.open) {
    strokeDashedRect(ctx, LASER_GATE, INK.safe, [2, 6], 2);
  } else {
    ctx.strokeStyle = INK.danger;
    ctx.lineWidth = 2;
    ctx.shadowColor = INK.danger;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let beam = 0; beam < 5; beam += 1) {
      const y = LASER_GATE.y + 8 + beam * 14 + Math.sin(clock * 6 + beam) * 1.5;
      ctx.moveTo(LASER_GATE.x - 3, y);
      ctx.lineTo(LASER_GATE.x + LASER_GATE.w + 3, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  drawLabel(ctx, gate.open ? 'GATE OPEN' : 'LASER GATE', LASER_GATE.x - 8, LASER_GATE.y + 35, 11, gate.open ? INK.safe : INK.danger, 'right');

  const held = gate.heldBy !== null;
  ctx.strokeStyle = held ? INK.safe : INK.line;
  ctx.fillStyle = held ? 'rgba(77, 255, 160, 0.3)' : 'rgba(234, 244, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.fillRect(HOLD_PLATE.x - 15, HOLD_PLATE.y - 15, 30, 30);
  ctx.strokeRect(HOLD_PLATE.x - 15, HOLD_PLATE.y - 15, 30, 30);
  ctx.strokeRect(HOLD_PLATE.x - 9, HOLD_PLATE.y - 9, 18, 18);
  // Below the plate, so it never sits under the tag of whoever stands on it.
  drawLabel(ctx, held ? 'PLATE HELD' : 'HOLD PLATE', HOLD_PLATE.x, HOLD_PLATE.y + 30, 11, held ? INK.safe : INK.faint, 'center');
}

function drawVault(ctx, world) {
  const box = VAULT_DOOR.box;
  const vault = world.vault;
  withGlow(ctx, INK.loot, 14, () => {
    ctx.strokeStyle = INK.loot;
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255, 212, 59, 0.16)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.beginPath();
    ctx.arc(box.x + box.w / 2, box.y + box.h / 2, 10, 0, Math.PI * 2);
    ctx.stroke();
  });
  // One tag says everything about the vault, so nothing piles up around its door.
  const cracking = !vault.open && vault.progress > 0;
  let tag = 'VAULT · LOOT $900K';
  if (vault.open) tag = 'VAULT OPEN';
  else if (cracking) tag = `CRACKING ${Math.round((100 * vault.progress) / VAULT.crackSeconds)}% · $900K`;
  drawTag(ctx, tag, 1160, box.y - 28, 14, INK.loot);
  if (cracking) {
    ctx.strokeStyle = INK.loot;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(VAULT_DOOR.x, VAULT_DOOR.y, 26, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * vault.progress) / VAULT.crackSeconds);
    ctx.stroke();
  }
}

/** The getaway van, top view; `driveOff` slides it out of the frame during the getaway. */
function drawGetawayVan(ctx, driveOff) {
  const body = GETAWAY_VAN.body;
  const x = body.x - driveOff;
  ctx.fillStyle = 'rgba(234, 244, 255, 0.1)';
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, body.y, body.w, body.h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeRect(x + 8, body.y + 5, 22, body.h - 10);
  ctx.fillStyle = INK.loot;
  ctx.fillRect(x - 2, body.y + 4, 4, 7);
  ctx.fillRect(x - 2, body.y + body.h - 11, 4, 7);
  drawLabel(ctx, 'GETAWAY VAN', x + 76, body.y + body.h / 2, 12, INK.line, 'center');
  strokeDashedRect(ctx, GETAWAY_VAN.zone, 'rgba(255, 212, 59, 0.6)', [6, 5], 1.5);
}

export function drawFloorPlan(ctx, world, clock, vanDriveOff) {
  drawRoomNames(ctx);
  drawSafeCover(ctx);
  drawAirDuct(ctx);
  drawDoorSwings(ctx);
  drawWallsAndFurniture(ctx);
  drawLaserGateAndPlate(ctx, world, clock);
  drawVault(ctx, world);
  drawGetawayVan(ctx, vanDriveOff);
}
