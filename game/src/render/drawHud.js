// The drawing's title block and margins: the loop clock and the row of four selves, the take,
// the alarm meter, the tool price list and the legend that names every symbol on the sheet.
import { ALARM, LOOP_SECONDS, MAX_SELVES, TOOLS, VIEW } from '../config.js';
import { currentLoopNumber, secondsLeftInLoop } from '../loop/timeLoop.js';
import { alarmStage, ALERT, CALM } from '../systems/alarmMeter.js';
import { formatMoney, netTake, valueInHand } from '../systems/lootLedger.js';
import { drawLabel, hatchFill, INK, strokeDashedRect } from './blueprintStyle.js';

const BAR = { x: 0, y: 0, w: VIEW.width, h: 88 };

function drawTitleBlock(ctx) {
  ctx.fillStyle = INK.paperDark;
  ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
  ctx.fillStyle = INK.line;
  ctx.fillRect(0, BAR.h, VIEW.width, 2);
  for (const x of [318, 668, 900]) ctx.fillRect(x, 10, 1, BAR.h - 20);
  drawLabel(ctx, 'ONE-THIEF CREW', 20, 32, 31, INK.line);
  drawLabel(ctx, 'SHEET 01 · HOLLOW CROWN GALLERY', 20, 62, 13, INK.faint);
  drawLabel(ctx, 'ONE THIEF · FOUR LOOPS · 30 SEC', 20, 78, 13, INK.ghost);
}

/** Four small heads: cyan for selves already recorded, white for the live one, hollow for the rest. */
function drawLoopClock(ctx, session) {
  const loopNumber = Math.min(MAX_SELVES, currentLoopNumber(session.timeLoop));
  const left = secondsLeftInLoop(session.world.tick);
  drawLabel(ctx, `LOOP ${loopNumber} OF ${MAX_SELVES}`, 334, 20, 17, INK.line);
  for (let self = 1; self <= MAX_SELVES; self += 1) {
    const x = 520 + (self - 1) * 30;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = self < loopNumber ? INK.ghost : INK.line;
    ctx.fillStyle = self < loopNumber ? 'rgba(63, 233, 255, 0.45)' : self === loopNumber ? INK.you : 'transparent';
    ctx.beginPath();
    ctx.arc(x, 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  drawLabel(ctx, `0:${left.toFixed(1).padStart(4, '0')}`, 334, 52, 36, left < 6 ? INK.danger : INK.line);
  drawLabel(ctx, 'TO REWIND', 520, 56, 14, INK.faint);
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(334.5, 72.5, 316, 9);
  ctx.fillStyle = left < 6 ? INK.danger : INK.ghost;
  ctx.fillRect(336, 74, (313 * left) / LOOP_SECONDS, 6);
}

function drawTake(ctx, world) {
  const ledger = world.ledger;
  drawLabel(ctx, 'NET TAKE', 684, 20, 17, INK.loot);
  drawLabel(ctx, formatMoney(netTake(ledger)), 684, 51, 34, INK.loot);
  drawLabel(ctx, `IN HAND ${formatMoney(valueInHand(world.loot))}`, 684, 77, 13, INK.loot);
  drawLabel(ctx, `TOOLS ${formatMoney(-ledger.toolSpend)}`, 892, 77, 13, INK.faint, 'right');
  drawLabel(ctx, `IN VAN ${ledger.banked.length}/3`, 892, 20, 13, INK.faint, 'right');
}

function drawAlarmMeter(ctx, world) {
  const stage = alarmStage(world.alarm);
  const color = stage === CALM ? INK.loot : INK.danger;
  const x = 916;
  const width = 344;
  drawLabel(ctx, 'ALARM METER', x, 20, 20, INK.danger);
  drawLabel(ctx, stage, x + width, 20, 17, color, 'right');
  ctx.fillStyle = 'rgba(255, 61, 79, 0.12)';
  ctx.fillRect(x, 36, width, 28);
  const filled = (width * world.alarm.level) / ALARM.max;
  ctx.fillStyle = INK.danger;
  ctx.fillRect(x, 36, filled, 28);
  ctx.fillStyle = hatchFill(ctx, 'rgba(7, 31, 71, 0.55)', 9, 1);
  ctx.fillRect(x, 36, filled, 28);
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, 36, width, 28);
  ctx.fillStyle = INK.line;
  for (let tick = 1; tick < 10; tick += 1) ctx.fillRect(x + (width * tick) / 10, tick === 5 ? 30 : 58, tick === 5 ? 2 : 1, tick === 5 ? 40 : 6);
  drawLabel(ctx, `${Math.round(world.alarm.level)}%`, x + 6, 78, 13, INK.line);
  drawLabel(ctx, 'ALERT 50', x + width / 2, 78, 12, stage === ALERT ? INK.danger : INK.faint, 'center');
  drawLabel(ctx, 'LOCKDOWN 100', x + width, 78, 12, INK.faint, 'right');
}

function drawToolPrices(ctx) {
  const text = `WASD MOVE · SPACE VENT/DRIVE · [1] SMOKE ${formatMoney(TOOLS.smoke.price)} · [2] EMP ${formatMoney(TOOLS.emp.price)} · [CLICK] COIN ${formatMoney(TOOLS.coin.price)} · [R] REWIND`;
  drawLabel(ctx, 'TOOLS COST LOOT', 352, 718, 13, INK.loot);
  drawLabel(ctx, text, 352, 738, 13, INK.line);
}

/** One legend entry: a symbol drawn by `symbol` and its name; returns the x after it. */
function legendEntry(ctx, x, y, name, symbol) {
  symbol(x + 14, y);
  drawLabel(ctx, name, x + 34, y, 15, INK.line);
  ctx.font = 'bold 15px monospace';
  return x + 34 + name.length * 9.1 + 20;
}

function fan(ctx, x, y, color, lean) {
  ctx.beginPath();
  ctx.moveTo(x - 13, y);
  ctx.arc(x - 13, y, 28, -0.5, 0.5);
  ctx.closePath();
  ctx.fillStyle = hatchFill(ctx, color, 9, lean);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLegend(ctx) {
  const y = 777;
  ctx.fillStyle = INK.paperDark;
  ctx.fillRect(0, 754, VIEW.width, 46);
  ctx.fillStyle = INK.line;
  ctx.fillRect(0, 753, VIEW.width, 2);
  drawLabel(ctx, 'LEGEND', 18, y, 15, INK.faint);
  let x = 92;
  x = legendEntry(ctx, x, y, 'YOU', (sx, sy) => {
    ctx.fillStyle = INK.you;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  x = legendEntry(ctx, x, y, 'GHOST=PAST YOU', (sx, sy) => {
    ctx.fillStyle = 'rgba(63, 233, 255, 0.4)';
    ctx.strokeStyle = INK.ghost;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  x = legendEntry(ctx, x, y, 'GUARD CONE', (sx, sy) => fan(ctx, sx, sy, INK.danger, 1));
  x = legendEntry(ctx, x, y, 'CAMERA CONE', (sx, sy) => fan(ctx, sx, sy, INK.camera, -1));
  x = legendEntry(ctx, x, y, 'LOOT', (sx, sy) => {
    ctx.fillStyle = INK.loot;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 10);
    ctx.lineTo(sx + 10, sy);
    ctx.lineTo(sx, sy + 10);
    ctx.lineTo(sx - 10, sy);
    ctx.closePath();
    ctx.fill();
  });
  x = legendEntry(ctx, x, y, 'SAFE COVER', (sx, sy) => strokeDashedRect(ctx, { x: sx - 12, y: sy - 10, w: 24, h: 20 }, INK.safe, [3, 4], 2.5));
  legendEntry(ctx, x, y, 'ALARM', (sx, sy) => {
    ctx.fillStyle = INK.danger;
    ctx.fillRect(sx - 12, sy - 6, 16, 12);
    ctx.strokeStyle = INK.line;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 12, sy - 6, 26, 12);
  });
}

export function drawHud(ctx, session) {
  drawTitleBlock(ctx);
  drawLoopClock(ctx, session);
  drawTake(ctx, session.world);
  drawAlarmMeter(ctx, session.world);
  drawToolPrices(ctx);
  drawLegend(ctx);
}
