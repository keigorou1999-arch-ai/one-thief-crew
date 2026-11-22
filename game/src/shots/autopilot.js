// A scripted thief for the screenshot scenes: it turns a short list of steps (walk here, wait,
// use a tool, ride the duct, rewind) into the same per-tick input a player's keys would give, so
// a staged scene is the real game played by a script, never a drawing.
import { TICK } from '../config.js';
import { idleInput } from '../world/heistWorld.js';

export function createAutopilot(steps) {
  return { steps, index: 0, waited: 0 };
}

/** The input for this tick. Steps: {go:[x,y]} {wait:s} {until:s} {tool,at} {interact} {duct} {rewind}. */
export function autopilotInput(pilot, world) {
  const input = idleInput();
  const live = world.live;
  while (pilot.index < pilot.steps.length) {
    const step = pilot.steps[pilot.index];
    if (step.go) {
      const dx = step.go[0] - live.x;
      const dy = step.go[1] - live.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 2.6) {
        input.moveX = dx / distance;
        input.moveY = dy / distance;
        return input;
      }
    } else if (step.wait !== undefined) {
      pilot.waited += TICK;
      if (pilot.waited < step.wait) return input;
      pilot.waited = 0;
    } else if (step.until !== undefined) {
      if (world.tick * TICK < step.until) return input;
    } else if (step.duct) {
      if (live.duct) return input;
    } else if (step.tool) {
      input.tool = step.tool;
      if (step.at) input.aim = { x: step.at[0], y: step.at[1] };
      pilot.index += 1;
      return input;
    } else if (step.interact) {
      input.interact = true;
      pilot.index += 1;
      return input;
    } else if (step.rewind) {
      input.rewind = true;
      pilot.index += 1;
      return input;
    }
    pilot.index += 1;
  }
  return input;
}
