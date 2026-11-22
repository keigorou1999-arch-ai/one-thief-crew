// The full-sheet moments drawn over the plan: the title briefing, the frozen "SPOTTED" frame
// with the red line that shows exactly who saw you, the rewind sweep, the getaway receipt and
// the blown heist.
import { MAX_SELVES, PAUSES, VIEW } from '../config.js';
import { currentLoopNumber } from '../loop/timeLoop.js';
import { formatMoney } from '../systems/lootLedger.js';
import { ENDED_LOCKDOWN, ENDED_SPOTTED } from '../world/heistWorld.js';
import { drawLabel, INK, setLettering } from './blueprintStyle.js';

function dimSheet(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 16, 40, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawPanel(ctx, x, y, w, h, color) {
  ctx.fillStyle = 'rgba(5, 22, 52, 0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
}

export function drawTitleScreen(ctx, clock) {
  dimSheet(ctx, 0.62);
  drawPanel(ctx, 170, 150, 940, 500, INK.line);
  drawLabel(ctx, 'ONE-THIEF CREW', 640, 222, 86, INK.line, 'center');
  drawLabel(ctx, 'A HEIST FOR ONE THIEF AND THEIR OWN PAST SELVES', 640, 286, 22, INK.ghost, 'center');
  const briefing = [
    ['30 SECONDS', 'then time rewinds. Getting spotted rewinds it too.'],
    ['GHOSTS', 'every past loop of you replays beside you: up to 4 of you at once.'],
    ['DECOYS', 'guards and cameras see ghosts. A caught ghost pulls a guard away,'],
    ['', 'but fills the ALARM METER. Fill it and the building locks down.'],
    ['3 ROUTES', 'front hall + laser gate · cornice ledge + windows · air duct.'],
    ['TOOLS', 'smoke, EMP and coin toss are paid for out of the loot.'],
    ['GETAWAY', 'carry loot to the van, then press SPACE in the van to drive.'],
  ];
  briefing.forEach(([head, body], row) => {
    const y = 338 + row * 31;
    drawLabel(ctx, head, 330, y, 18, INK.loot, 'right');
    drawLabel(ctx, body, 350, y, 16, INK.line);
  });
  drawLabel(ctx, 'WASD / ARROWS MOVE · SPACE VENT + VAN · 1 SMOKE · 2 EMP · CLICK COIN · R REWIND · M MUTE', 640, 574, 14, INK.faint, 'center');
  if (Math.sin(clock * 4) > -0.4) drawLabel(ctx, 'PRESS ENTER OR CLICK TO SEND IN THE FIRST YOU', 640, 614, 24, INK.safe, 'center');
}

/** The loop is over and the frame is frozen: say what happened and, if seen, draw who saw whom. */
export function drawCaughtFreeze(ctx, session) {
  const ending = session.ending;
  const live = session.world.live;
  ctx.fillStyle = 'rgba(255, 61, 79, 0.16)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  let headline = 'TIME UP';
  let reason = '30 SECONDS ARE GONE · THIS SELF BECOMES A GHOST';
  if (ending.endedBy === ENDED_SPOTTED) {
    const watcher = ending.watcher;
    ctx.save();
    ctx.strokeStyle = INK.danger;
    ctx.shadowColor = INK.danger;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(watcher.x, watcher.y);
    ctx.lineTo(live.x, live.y);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(watcher.x, watcher.y, 22, 0, Math.PI * 2);
    ctx.moveTo(live.x + 38, live.y);
    ctx.arc(live.x, live.y, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const who = watcher.kind === 'guard' ? `GUARD ${watcher.name}` : `CAMERA ${watcher.name}`;
    const distance = Math.round(Math.hypot(watcher.x - live.x, watcher.y - live.y) / 40);
    headline = 'SPOTTED';
    reason = `BY ${who} · CLEAR LINE OF SIGHT · ${distance} M AWAY`;
  } else if (ending.endedBy === ENDED_LOCKDOWN) {
    headline = 'LOCKDOWN';
    reason = 'THE ALARM METER IS FULL · TOO MANY OF YOU WERE SEEN';
  }
  // Keep the panel clear of both ends of the red line.
  const eyeY = ending.watcher ? (ending.watcher.y + live.y) / 2 : live.y;
  const top = eyeY > 420 ? 104 : 590;
  drawPanel(ctx, 250, top, 780, 150, INK.danger);
  drawLabel(ctx, headline, 640, top + 62, 96, INK.danger, 'center');
  drawLabel(ctx, reason, 640, top + 124, 18, INK.line, 'center');
}

export function drawRewindSweep(ctx, session, clock) {
  const progress = Math.min(1, session.seconds / PAUSES.rewindSeconds);
  ctx.fillStyle = 'rgba(63, 233, 255, 0.07)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = 'rgba(63, 233, 255, 0.5)';
  for (let line = 0; line < 7; line += 1) {
    const y = 96 + ((line * 97 + clock * 900) % 650);
    ctx.fillRect(0, y, VIEW.width, 2);
  }
  ctx.fillRect(VIEW.width * (1 - progress) - 3, 90, 6, 662);
  const loop = currentLoopNumber(session.timeLoop);
  drawPanel(ctx, 280, 560, 720, 104, INK.ghost);
  drawLabel(ctx, '<< REWIND', 640, 596, 50, INK.ghost, 'center');
  drawLabel(ctx, `0:30 AGAIN · SELF ${loop} OF ${MAX_SELVES} GOES IN · PAST SELVES REPLAY THEIR PATHS`, 640, 640, 15, INK.line, 'center');
}

function receiptRow(ctx, label, amount, y, color) {
  drawLabel(ctx, label, 430, y, 19, color);
  drawLabel(ctx, formatMoney(amount), 850, y, 19, color, 'right');
  ctx.fillStyle = 'rgba(234, 244, 255, 0.25)';
  setLettering(ctx, 19);
  const from = 430 + ctx.measureText(label).width + 8;
  const to = 850 - ctx.measureText(formatMoney(amount)).width - 8;
  for (let x = from; x < to; x += 9) ctx.fillRect(x, y + 5, 3, 2);
}

export function drawGetawayReceipt(ctx, session) {
  if (session.seconds < PAUSES.vanSeconds) {
    drawLabel(ctx, 'GETAWAY!', 640, 420, 110, INK.loot, 'center');
    return;
  }
  const receipt = session.receipt;
  dimSheet(ctx, 0.6);
  const rows = receipt.lines.length;
  const height = 330 + rows * 30;
  const top = Math.round((VIEW.height - height) / 2);
  drawPanel(ctx, 390, top, 500, height, INK.loot);
  drawLabel(ctx, 'GETAWAY', 640, top + 50, 62, INK.loot, 'center');
  drawLabel(ctx, 'HEIST RECEIPT · ONE-THIEF CREW', 640, top + 96, 16, INK.line, 'center');
  let y = top + 138;
  for (const line of receipt.lines) {
    receiptRow(ctx, line.label, line.amount, y, line.amount < 0 ? INK.danger : INK.line);
    y += 30;
  }
  ctx.fillStyle = INK.line;
  ctx.fillRect(430, y - 8, 420, 2);
  y += 20;
  drawLabel(ctx, 'NET TAKE', 430, y, 30, INK.loot);
  drawLabel(ctx, formatMoney(receipt.net), 850, y, 30, INK.loot, 'right');
  y += 42;
  drawLabel(ctx, `LOOPS USED   ${receipt.loopsUsed} OF ${receipt.maxLoops}`, 430, y, 17, INK.ghost);
  drawLabel(ctx, `CLOCK 0:${receipt.seconds.toFixed(1).padStart(4, '0')}`, 850, y, 17, INK.ghost, 'right');
  y += 26;
  drawLabel(ctx, `TOOLS SPENT  ${formatMoney(receipt.toolSpend)}`, 430, y, 17, INK.line);
  drawLabel(ctx, `ALARM PEAK ${receipt.alarmPeak}%`, 850, y, 17, INK.line, 'right');
  ctx.save();
  ctx.translate(640, y + 46);
  ctx.rotate(-0.05);
  setLettering(ctx, 24);
  const width = ctx.measureText(receipt.rating).width + 28;
  ctx.strokeStyle = INK.safe;
  ctx.lineWidth = 3;
  ctx.strokeRect(-width / 2, -20, width, 40);
  drawLabel(ctx, receipt.rating, 0, 1, 24, INK.safe, 'center');
  ctx.restore();
  drawLabel(ctx, 'PRESS ENTER TO PLAN ANOTHER JOB', 640, top + height - 24, 15, INK.faint, 'center');
}

export function drawBlownHeist(ctx) {
  dimSheet(ctx, 0.66);
  drawPanel(ctx, 250, 280, 780, 220, INK.danger);
  drawLabel(ctx, 'HEIST BLOWN', 640, 348, 84, INK.danger, 'center');
  drawLabel(ctx, 'ALL FOUR OF YOU ARE SPENT AND NO ONE REACHED THE VAN WITH LOOT', 640, 416, 17, INK.line, 'center');
  drawLabel(ctx, 'PRESS ENTER TO TRY A NEW PLAN', 640, 458, 22, INK.safe, 'center');
}
