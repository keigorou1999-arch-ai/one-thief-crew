// Records one loop of the thief, tick by tick, and plays it back as a ghost. A recording is the
// thief's position on every tick plus the tools they used; a ghost walks the same path again and
// uses the same tools at the same moments, while the room around it may react differently.
import { LOOP_TICKS } from '../config.js';

export function createRecording() {
  return {
    xs: new Float32Array(LOOP_TICKS + 1),
    ys: new Float32Array(LOOP_TICKS + 1),
    inDuct: new Uint8Array(LOOP_TICKS + 1),
    length: 0,
    toolUses: [],
    endedBy: null,
  };
}

/** Store where the live thief stands on this tick. */
export function recordFrame(recording, thief) {
  if (recording.length > LOOP_TICKS) return;
  recording.xs[recording.length] = thief.x;
  recording.ys[recording.length] = thief.y;
  recording.inDuct[recording.length] = thief.hidden ? 1 : 0;
  recording.length += 1;
}

export function recordToolUse(recording, tick, use) {
  recording.toolUses.push({ tick, kind: use.kind, x: use.x, y: use.y });
}

/** Where a ghost is on `tick`; past the end of its recording it stands where it stopped. */
export function ghostFrame(recording, tick) {
  const index = Math.max(0, Math.min(tick, recording.length - 1));
  return {
    x: recording.xs[index],
    y: recording.ys[index],
    hidden: recording.inDuct[index] === 1,
    ended: tick >= recording.length,
  };
}

export function toolUsesAtTick(recording, tick) {
  return recording.toolUses.filter((use) => use.tick === tick);
}

/** The path a recording walked, thinned to one point every `every` ticks, for the dotted trail. */
export function ghostTrail(recording, every) {
  const trail = [];
  for (let i = 0; i < recording.length; i += every) trail.push({ x: recording.xs[i], y: recording.ys[i], hidden: recording.inDuct[i] === 1 });
  if (recording.length > 0) trail.push({ x: recording.xs[recording.length - 1], y: recording.ys[recording.length - 1], hidden: false });
  return trail;
}
