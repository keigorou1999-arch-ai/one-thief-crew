// Paints one whole frame in drawing order: paper, building, trails, loot, cones, watchers, the
// crew, the margins, then whichever full-sheet moment the session is in.
import { PAUSES, VIEW } from '../config.js';
import { ductGrateUnder, isInVan } from '../actors/thief.js';
import { SCREEN_BLOWN, SCREEN_CAUGHT, SCREEN_GETAWAY, SCREEN_PLAY, SCREEN_REWIND, SCREEN_TITLE } from '../game/heistSession.js';
import { coinLanding } from '../tools/coinToss.js';
import { drawBlueprintPaper, drawTag, INK } from './blueprintStyle.js';
import { drawFloorPlan } from './drawFloorPlan.js';
import { drawCameras, drawGuards, drawVisionCones } from './drawWatchers.js';
import { drawGhostTrails, drawLoot, drawSightLines, drawThieves, drawToolEffects } from './drawCrew.js';
import { drawHud } from './drawHud.js';
import { drawBlownHeist, drawCaughtFreeze, drawGetawayReceipt, drawRewindSweep, drawTitleScreen } from './drawScreens.js';

/** Where a coin would land if the player clicked now. */
function drawCoinAim(ctx, world, aim) {
  const live = world.live;
  if (live.hidden) return;
  const landing = coinLanding(live.x, live.y, aim.x, aim.y);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 212, 59, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.moveTo(live.x, live.y);
  ctx.lineTo(landing.x, landing.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(landing.x, landing.y, 7, 0, Math.PI * 2);
  ctx.moveTo(landing.x - 11, landing.y);
  ctx.lineTo(landing.x + 11, landing.y);
  ctx.moveTo(landing.x, landing.y - 11);
  ctx.lineTo(landing.x, landing.y + 11);
  ctx.stroke();
  ctx.restore();
}

/** One line telling the live thief what SPACE does where they stand. */
function drawSpacePrompt(ctx, world) {
  const live = world.live;
  let prompt = '';
  if (live.duct) prompt = 'CRAWLING THE DUCT · NOBODY CAN SEE YOU';
  else if (ductGrateUnder(live)) prompt = 'SPACE: CRAWL INTO THE DUCT';
  else if (isInVan(live)) prompt = world.ledger.banked.length > 0 ? 'SPACE: DRIVE AWAY WITH THE LOOT' : 'NO LOOT IN THE VAN YET';
  if (prompt) drawTag(ctx, prompt, Math.max(200, Math.min(1080, live.x)), live.y - 62, 15, INK.safe);
}

export function renderFrame(ctx, session, clock, aim) {
  const world = session.world;
  const screen = session.screen;
  const leaving = screen === SCREEN_GETAWAY;
  const vanDriveOff = leaving ? Math.min(1, session.seconds / PAUSES.vanSeconds) ** 2 * 260 : 0;
  ctx.setTransform(ctx.canvas.width / VIEW.width, 0, 0, ctx.canvas.height / VIEW.height, 0, 0);
  drawBlueprintPaper(ctx);
  drawFloorPlan(ctx, world, clock, vanDriveOff);
  drawGhostTrails(ctx, world, screen === SCREEN_REWIND);
  drawLoot(ctx, world, clock);
  drawToolEffects(ctx, world, clock);
  drawVisionCones(ctx, world);
  drawSightLines(ctx, world);
  drawGuards(ctx, world);
  drawCameras(ctx, world);
  if (!leaving) drawThieves(ctx, world, clock);
  if (screen === SCREEN_PLAY && aim) drawCoinAim(ctx, world, aim);
  drawHud(ctx, session);
  if (screen === SCREEN_TITLE) drawTitleScreen(ctx, clock);
  else if (screen === SCREEN_CAUGHT) drawCaughtFreeze(ctx, session);
  else if (screen === SCREEN_REWIND) drawRewindSweep(ctx, session, clock);
  else if (screen === SCREEN_GETAWAY) drawGetawayReceipt(ctx, session);
  else if (screen === SCREEN_BLOWN) drawBlownHeist(ctx);
  if (screen === SCREEN_PLAY) drawSpacePrompt(ctx, world);
}
