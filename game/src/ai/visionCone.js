// The vision cone guards and cameras share: who is inside it, and its outline for drawing. A
// cone is cut by walls and furniture, swallowed by smoke, and blind to a thief standing in safe
// cover unless the watcher is almost on top of them. What is drawn is exactly what is tested.
import { SIGHT } from '../config.js';
import { SAFE_COVER, SIGHT_BLOCKERS } from '../level/floorPlan.js';
import { angleDifference, pointInAnyRect, rayLength, rayToCircle, sightBlocked } from '../level/wallCollision.js';

const CONE_RAYS = 30;

/** Distance from watcher to (x, y) when the watcher can see that point; -1 when it cannot. */
export function seenDistance(watcher, x, y, world) {
  const dx = x - watcher.x;
  const dy = y - watcher.y;
  const distance = Math.hypot(dx, dy);
  if (distance > watcher.range) return -1;
  if (distance > 1 && Math.abs(angleDifference(Math.atan2(dy, dx), watcher.look)) > watcher.halfAngle) return -1;
  if (distance > SIGHT.coverRevealDistance && pointInAnyRect(x, y, SAFE_COVER)) return -1;
  if (sightBlocked(watcher.x, watcher.y, x, y, SIGHT_BLOCKERS)) return -1;
  if (distance > 1) {
    for (const cloud of world.smokeClouds) {
      if (rayToCircle(watcher.x, watcher.y, dx / distance, dy / distance, distance, cloud.x, cloud.y, cloud.radius) < distance) return -1;
    }
  }
  return distance;
}

/** The cone's outline as a polygon: the watcher's eye, then where each ray ends. */
export function coneOutline(watcher, world) {
  const outline = [{ x: watcher.x, y: watcher.y }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const angle = watcher.look - watcher.halfAngle + (2 * watcher.halfAngle * i) / CONE_RAYS;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let reach = rayLength(watcher.x, watcher.y, dx, dy, watcher.range, SIGHT_BLOCKERS);
    for (const cloud of world.smokeClouds) reach = rayToCircle(watcher.x, watcher.y, dx, dy, reach, cloud.x, cloud.y, cloud.radius);
    outline.push({ x: watcher.x + dx * reach, y: watcher.y + dy * reach });
  }
  return outline;
}

/** Seconds a watcher needs to be sure of a thief at this distance. */
export function secondsToSpot(watcher, distance) {
  return SIGHT.nearSeconds + (SIGHT.farSeconds - SIGHT.nearSeconds) * (distance / watcher.range);
}
