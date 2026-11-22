// Geometry against the floor plan's rectangles: a walking circle that slides along walls, rays
// that stop at the first wall (for vision cones) and the line-of-sight test built on them.

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function pointInAnyRect(x, y, rects) {
  for (let i = 0; i < rects.length; i += 1) if (pointInRect(x, y, rects[i])) return true;
  return false;
}

function circleTouchesRect(x, y, radius, r) {
  const nearX = Math.max(r.x, Math.min(x, r.x + r.w));
  const nearY = Math.max(r.y, Math.min(y, r.y + r.h));
  const dx = x - nearX;
  const dy = y - nearY;
  return dx * dx + dy * dy < radius * radius;
}

export function circleBlocked(x, y, radius, rects) {
  for (let i = 0; i < rects.length; i += 1) if (circleTouchesRect(x, y, radius, rects[i])) return true;
  return false;
}

/** Move a circle by (dx, dy), one axis at a time, so it slides along whatever it meets. */
export function slideMove(body, dx, dy, radius, rects, bounds) {
  const nextX = Math.max(bounds.x + radius, Math.min(bounds.x + bounds.w - radius, body.x + dx));
  if (!circleBlocked(nextX, body.y, radius, rects)) body.x = nextX;
  const nextY = Math.max(bounds.y + radius, Math.min(bounds.y + bounds.h - radius, body.y + dy));
  if (!circleBlocked(body.x, nextY, radius, rects)) body.y = nextY;
}

/** Distance along the unit ray (dx, dy) from (ox, oy) to rectangle r; Infinity when it misses. */
function rayToRect(ox, oy, dx, dy, r) {
  let near = 0;
  let far = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return Infinity;
  } else {
    let a = (r.x - ox) / dx;
    let b = (r.x + r.w - ox) / dx;
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return Infinity;
  } else {
    let a = (r.y - oy) / dy;
    let b = (r.y + r.h - oy) / dy;
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
  }
  return near <= far ? near : Infinity;
}

/** How far a ray travels before a rectangle stops it, at most `reach`. */
export function rayLength(ox, oy, dx, dy, reach, rects) {
  let best = reach;
  for (let i = 0; i < rects.length; i += 1) {
    const hit = rayToRect(ox, oy, dx, dy, rects[i]);
    if (hit < best) best = hit;
  }
  return best;
}

/** How far a ray travels before it enters a circle (a smoke cloud), at most `reach`. */
export function rayToCircle(ox, oy, dx, dy, reach, cx, cy, radius) {
  const fx = cx - ox;
  const fy = cy - oy;
  const along = fx * dx + fy * dy;
  const offSquared = fx * fx + fy * fy - along * along;
  if (offSquared > radius * radius) return reach;
  const entry = along - Math.sqrt(radius * radius - offSquared);
  if (entry < 0) return along + Math.sqrt(radius * radius - offSquared) > 0 ? 0 : reach;
  return Math.min(reach, entry);
}

/** True when a wall or furniture stands between two points. */
export function sightBlocked(ax, ay, bx, by, rects) {
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return false;
  return rayLength(ax, ay, dx / distance, dy / distance, distance, rects) < distance - 0.5;
}

/** The point `distance` along a polyline, and the polyline's whole length. */
export function pathLength(path) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  return total;
}

export function pointAlongPath(path, distance) {
  let left = distance;
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= length) return { x: a.x + ((b.x - a.x) * left) / length, y: a.y + ((b.y - a.y) * left) / length };
    left -= length;
  }
  return { x: path[path.length - 1].x, y: path[path.length - 1].y };
}

/** The signed smallest turn from angle b to angle a. */
export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
