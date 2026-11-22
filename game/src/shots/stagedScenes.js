// The screenshot scenes behind ?shot=cover|plan|spotted|getaway. Each one starts a real heist and
// plays it forward with the autopilot, loop after loop, through the same session code the player
// drives, then stops on the frame to photograph. Same script, same frame, every time.
//
// The plan the scripts play is one a player can play: self 1 crawls the duct and cracks the
// vault under smoke, self 2 takes the ledge to the office bonds, self 3 lets a guard catch them
// in the lobby as a decoy, and self 4 lifts the idol and holds the gate plate.
import { PAUSES, TICK } from '../config.js';
import { advanceSession, SCREEN_CAUGHT, SCREEN_GETAWAY, SCREEN_PLAY, SCREEN_REWIND, startHeist } from '../game/heistSession.js';
import { idleInput } from '../world/heistWorld.js';
import { autopilotInput, createAutopilot } from './autopilot.js';

/** Shared last leg: across the gallery, wait for the lobby guard to turn, out of the door to the van. */
const RUN_TO_VAN = [{ go: [840, 470] }, { go: [460, 575] }, { until: 24.3 }, { go: [285, 640] }, { go: [285, 724] }];

/** Self 1: duct to the vault room, smoke at the vault door, crack it, EMP, out through the jammed gate. */
const CROWN_BY_DUCT = [
  { go: [285, 728] }, { go: [285, 668] }, { go: [150, 664] }, { interact: true }, { duct: true },
  { until: 12 }, { go: [1100, 600] }, { go: [1192, 522] }, { tool: 'smoke' }, { until: 17.7 }, { tool: 'emp' },
  { go: [1100, 470] }, { go: [900, 445] }, ...RUN_TO_VAN, { go: [110, 728] }, { wait: 0.2 }, { rewind: true },
];

/** Self 2: up the alley, along the cornice ledge past camera C1, in at the east window for the bonds. */
const BONDS_BY_LEDGE = [
  { go: [64, 728] }, { go: [64, 116] }, { go: [1088, 116] }, { go: [1088, 180] }, { go: [944, 204] },
  { go: [1160, 300] }, { until: 17.8 }, { go: [1160, 370] }, { go: [1100, 440] }, { go: [900, 445] },
  ...RUN_TO_VAN, { go: [120, 730] }, { wait: 0.2 }, { rewind: true },
];

/** Self 3: hide in the lobby's safe cover, then stand where guard G3 must find them. */
const LOBBY_DECOY = [
  { go: [285, 728] }, { go: [285, 668] }, { go: [160, 596] }, { until: 11.5 }, { go: [400, 560] }, { go: [372, 196] }, { until: 29 },
];

const TO_GALLERY_COVER = [{ go: [285, 728] }, { go: [285, 640] }, { go: [460, 575] }, { go: [466, 456] }];

/** Self 4: wait out camera C2, lift the idol, hold the gate plate, then leave with the others. */
const IDOL_AND_PLATE = [
  ...TO_GALLERY_COVER, { until: 12.8 }, { go: [556, 300] }, { until: 14.6 }, { go: [670, 302] }, { go: [838, 262] },
  { until: 19.3 }, { go: [790, 470] }, { go: [460, 575] }, { until: 24.4 }, { go: [285, 640] }, { go: [285, 724] }, { go: [140, 734] },
  { until: 28.2 }, { interact: true },
];

/** Self 4, careless: steps out of cover straight into guard G1's cone. */
const IDOL_TOO_EARLY = [...TO_GALLERY_COVER, { until: 13.7 }, { go: [640, 330] }];

const SCENES = {
  cover: { loops: [CROWN_BY_DUCT, BONDS_BY_LEDGE, LOBBY_DECOY, IDOL_AND_PLATE], stopAtSeconds: 17 },
  plan: { loops: [CROWN_BY_DUCT, BONDS_BY_LEDGE, LOBBY_DECOY] },
  spotted: { loops: [CROWN_BY_DUCT, BONDS_BY_LEDGE, LOBBY_DECOY, IDOL_TOO_EARLY] },
  getaway: { loops: [CROWN_BY_DUCT, BONDS_BY_LEDGE, LOBBY_DECOY, IDOL_AND_PLATE] },
};

/** Play one loop with a script, until the loop ends or the clock reaches `stopAtSeconds`. */
export function playScriptedLoop(session, steps, stopAtSeconds) {
  const pilot = createAutopilot(steps);
  while (session.screen === SCREEN_PLAY && (stopAtSeconds === undefined || session.world.tick * TICK < stopAtSeconds)) {
    advanceSession(session, autopilotInput(pilot, session.world));
  }
}

/** Let a pause screen (caught, rewind, van driving off) run for up to `seconds`. */
function runPause(session, screen, seconds) {
  let ticks = Math.round(seconds / TICK);
  while (session.screen === screen && ticks > 0) {
    advanceSession(session, idleInput());
    ticks -= 1;
  }
}

/** Bring `session` to the named scene (any unknown name is the cover). */
export function stageScene(name, session) {
  const scene = SCENES[name] ?? SCENES.cover;
  startHeist(session);
  scene.loops.forEach((steps, index) => {
    const last = index === scene.loops.length - 1;
    playScriptedLoop(session, steps, last ? scene.stopAtSeconds : undefined);
    if (last) return;
    runPause(session, SCREEN_CAUGHT, PAUSES.caughtSeconds + 1);
    runPause(session, SCREEN_REWIND, PAUSES.rewindSeconds + 1);
  });
  if (scene === SCENES.plan) {
    // Stop half way through the rewind sweep that follows the decoy's capture.
    runPause(session, SCREEN_CAUGHT, PAUSES.caughtSeconds + 1);
    runPause(session, SCREEN_REWIND, PAUSES.rewindSeconds * 0.45);
  } else if (scene === SCENES.spotted) {
    runPause(session, SCREEN_CAUGHT, 0.4);
  } else if (scene === SCENES.getaway) {
    runPause(session, SCREEN_GETAWAY, PAUSES.vanSeconds + 0.5);
  }
  session.cues.length = 0;
  session.world.events.length = 0;
}
