// The time loop itself: which of the four selves is live, the loops already sealed into ghost
// recordings, and the clock that runs down to the rewind.
import { LOOP_TICKS, MAX_SELVES, TICK } from '../config.js';

export function createTimeLoop() {
  return { recordings: [] };
}

/** 1 for the first self, up to MAX_SELVES. */
export function currentLoopNumber(timeLoop) {
  return timeLoop.recordings.length + 1;
}

export function secondsLeftInLoop(tick) {
  return Math.max(0, (LOOP_TICKS - tick) * TICK);
}

/** Keep the loop just played as a ghost for every loop after it. */
export function sealLoopAsGhost(timeLoop, recording, endedBy) {
  recording.endedBy = endedBy;
  timeLoop.recordings.push(recording);
}

/** False once the fourth self has been spent: there is no one left to send in. */
export function hasSelfLeft(timeLoop) {
  return timeLoop.recordings.length < MAX_SELVES;
}
