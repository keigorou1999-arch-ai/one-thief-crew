// The look: an architect's blueprint. Deep blue grid paper, white ink for the building, red
// hatching for danger, green dots for safe cover, gold for loot, cyan for past selves. Every
// drawing file takes its colours, its lettering and its hatch fills from here.
import { VIEW } from '../config.js';

export const INK = {
  paper: '#0a2c63',
  paperDark: '#071f47',
  gridFine: 'rgba(150, 200, 255, 0.09)',
  gridBold: 'rgba(150, 200, 255, 0.2)',
  line: '#eaf4ff',
  faint: 'rgba(214, 232, 255, 0.5)',
  ghostText: 'rgba(214, 232, 255, 0.16)',
  danger: '#ff3d4f',
  camera: '#ff8a1f',
  safe: '#4dffa0',
  loot: '#ffd43b',
  ghost: '#3fe9ff',
  you: '#ffffff',
};

const LETTERING = '"Courier New", "Menlo", "Consolas", monospace';

export function setLettering(ctx, size, bold = true) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${LETTERING}`;
}

/** Stencil-style drawing text. */
export function drawLabel(ctx, text, x, y, size, color, align = 'left') {
  setLettering(ctx, size);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** A label on a paper-coloured plate, so it reads over hatching and grid. */
export function drawTag(ctx, text, x, y, size, color) {
  setLettering(ctx, size);
  const width = ctx.measureText(text).width + 8;
  ctx.fillStyle = INK.paperDark;
  ctx.fillRect(x - width / 2, y - size / 2 - 3, width, size + 5);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - width / 2 + 0.5, y - size / 2 - 2.5, width - 1, size + 4);
  drawLabel(ctx, text, x, y, size, color, 'center');
}

export function drawBlueprintPaper(ctx) {
  ctx.fillStyle = INK.paper;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.width; x += 20) {
    ctx.strokeStyle = x % 100 === 0 ? INK.gridBold : INK.gridFine;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, VIEW.height);
    ctx.stroke();
  }
  for (let y = 0; y <= VIEW.height; y += 20) {
    ctx.strokeStyle = y % 100 === 0 ? INK.gridBold : INK.gridFine;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(VIEW.width, y + 0.5);
    ctx.stroke();
  }
}

const hatchCache = new Map();

/** A repeating diagonal hatch in `color`; `lean` is 1 for / strokes and -1 for \ strokes. */
export function hatchFill(ctx, color, spacing, lean) {
  const key = `${color}|${spacing}|${lean}`;
  if (hatchCache.has(key)) return hatchCache.get(key);
  const tile = document.createElement('canvas');
  tile.width = spacing;
  tile.height = spacing;
  const pen = tile.getContext('2d');
  pen.strokeStyle = color;
  pen.lineWidth = 2;
  pen.beginPath();
  for (let offset = -spacing; offset <= spacing; offset += spacing) {
    if (lean > 0) {
      pen.moveTo(offset, spacing);
      pen.lineTo(offset + spacing, 0);
    } else {
      pen.moveTo(offset, 0);
      pen.lineTo(offset + spacing, spacing);
    }
  }
  pen.stroke();
  const pattern = ctx.createPattern(tile, 'repeat');
  hatchCache.set(key, pattern);
  return pattern;
}

export function tracePolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

export function strokeDashedRect(ctx, r, color, dash, width = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
  ctx.restore();
}

/** Draw with a soft glow of the same colour: loot and the live thief. */
export function withGlow(ctx, color, blur, draw) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  draw();
  ctx.restore();
}
