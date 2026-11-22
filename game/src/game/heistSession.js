// One sitting of the game, as a small state machine over the heist world: title, play, the
// frozen "caught" frame, the rewind, the getaway receipt and the blown heist. The live game and
// the staged screenshot scenes both drive it through advanceSession, tick by tick.
import { PAUSES, TICK } from '../config.js';
import { createTimeLoop, currentLoopNumber, hasSelfLeft, sealLoopAsGhost } from '../loop/timeLoop.js';
import { buildGetawayReceipt } from '../systems/lootLedger.js';
import { createHeistWorld, ENDED_GETAWAY, ENDED_REWIND, stepHeist } from '../world/heistWorld.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_REWIND = 'rewind';
export const SCREEN_GETAWAY = 'getaway';
export const SCREEN_BLOWN = 'blown';

export function createHeistSession() {
  const timeLoop = createTimeLoop();
  return { screen: SCREEN_TITLE, timeLoop, world: createHeistWorld(timeLoop.recordings), seconds: 0, ending: null, receipt: null, cues: [] };
}

/** Leave the title, or start over after a getaway or a blown heist. */
export function startHeist(session) {
  session.timeLoop = createTimeLoop();
  session.world = createHeistWorld(session.timeLoop.recordings);
  session.screen = SCREEN_PLAY;
  session.seconds = 0;
  session.ending = null;
  session.receipt = null;
  session.cues.push('start');
}

function endLoop(session, ending) {
  session.ending = ending;
  session.seconds = 0;
  if (ending.endedBy === ENDED_GETAWAY) {
    session.receipt = buildGetawayReceipt(session.world, currentLoopNumber(session.timeLoop));
    session.screen = SCREEN_GETAWAY;
    session.cues.push('getaway');
    return;
  }
  session.cues.push(ending.endedBy);
  // A rewind the player asked for skips the frozen frame: nothing went wrong.
  if (ending.endedBy === ENDED_REWIND) rewindOrBlow(session);
  else session.screen = SCREEN_CAUGHT;
}

function rewindOrBlow(session) {
  sealLoopAsGhost(session.timeLoop, session.world.live.recording, session.ending.endedBy);
  session.seconds = 0;
  if (!hasSelfLeft(session.timeLoop)) {
    session.screen = SCREEN_BLOWN;
    session.cues.push('blown');
    return;
  }
  session.world = createHeistWorld(session.timeLoop.recordings);
  session.screen = SCREEN_REWIND;
  session.cues.push('rewindSweep');
}

/** Advance the session by one tick. `input` is the player's (or the autopilot's) for this tick. */
export function advanceSession(session, input) {
  session.seconds += TICK;
  if (session.screen === SCREEN_PLAY) {
    const ending = stepHeist(session.world, input);
    if (ending) endLoop(session, ending);
  } else if (session.screen === SCREEN_CAUGHT) {
    if (session.seconds >= PAUSES.caughtSeconds) rewindOrBlow(session);
  } else if (session.screen === SCREEN_REWIND) {
    if (session.seconds >= PAUSES.rewindSeconds) {
      session.screen = SCREEN_PLAY;
      session.seconds = 0;
    }
  }
}
