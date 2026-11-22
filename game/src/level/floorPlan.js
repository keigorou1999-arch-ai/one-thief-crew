// The one room of the heist, drawn as an architect would: the Hollow Crown Gallery, third floor.
// Everything is in canvas pixels (1280 x 800). Three ways lead to the vault: the front hall
// through the laser gate, the cornice ledge outside the north windows, and the air duct.

const rect = (x, y, w, h) => ({ x, y, w, h });
const point = (x, y) => ({ x, y });

/** Where anyone may stand at all: the building, the west alley, the north ledge and the street. */
export const BOUNDS = rect(22, 96, 1236, 652);

/** The paper outside the playfield, as solid blocks, so vision cones stop at its edge. */
export const PAPER_EDGE = [rect(0, 0, 1280, 94), rect(0, 750, 1280, 50), rect(0, 0, 20, 800), rect(1260, 0, 20, 800)];

export const WALLS = [
  // North wall, broken by the west and east windows.
  rect(106, 136, 84, 8), rect(246, 136, 814, 8), rect(1116, 136, 138, 8),
  // South wall, broken by the front door.
  rect(106, 696, 144, 8), rect(320, 696, 934, 8),
  // West and east walls.
  rect(106, 136, 8, 568), rect(1246, 136, 8, 568),
  // Lobby | gallery partition with a north and a south doorway.
  rect(426, 144, 8, 156), rect(426, 370, 8, 170), rect(426, 610, 8, 86),
  // Gallery | vault wing partition; the gap is the laser gate.
  rect(876, 144, 8, 266), rect(876, 480, 8, 216),
  // Office over vault room, with the office door.
  rect(884, 336, 246, 8), rect(1190, 336, 56, 8),
];

/** Furniture: solid, and it blocks a line of sight. */
export const FURNITURE = [
  rect(220, 380, 110, 28),
  rect(590, 400, 34, 34), rect(716, 400, 34, 34),
  rect(610, 585, 90, 22),
  rect(1020, 560, 56, 40),
  rect(900, 280, 80, 24),
];

/** Shadows a thief can stand in: unseen unless a watcher is almost on top of them. */
export const SAFE_COVER = [
  rect(118, 560, 84, 70),
  rect(438, 400, 56, 110),
  rect(790, 620, 80, 70),
  rect(888, 350, 70, 54),
  rect(1184, 150, 58, 70),
  rect(330, 98, 70, 36),
  rect(860, 98, 70, 36),
  rect(30, 380, 70, 90),
];

export const ROOM_LABELS = [
  { text: 'LOBBY', x: 270, y: 300 },
  { text: 'GALLERY', x: 655, y: 500 },
  { text: 'OFFICE', x: 1050, y: 190 },
  { text: 'VAULT ROOM', x: 1090, y: 440 },
  { text: 'CORNICE LEDGE', x: 560, y: 121 },
  { text: 'ALLEY', x: 64, y: 250 },
];

export const DOORS = [
  { x: 250, y: 700, w: 70, swing: 'north', label: 'FRONT DOOR' },
  { x: 430, y: 300, w: 70, swing: 'east' },
  { x: 430, y: 540, w: 70, swing: 'east' },
  { x: 1130, y: 340, w: 60, swing: 'south' },
];
export const WINDOWS = [rect(190, 136, 56, 8), rect(1060, 136, 56, 8)];

/** The laser gate between gallery and vault room, and the floor plate that holds it open. */
export const LASER_GATE = rect(877, 410, 6, 70);
export const HOLD_PLATE = { x: 838, y: 262, radius: 17 };

export const VAULT_DOOR = { x: 1196, y: 520, box: rect(1214, 488, 32, 64) };

export const LOOT_ITEMS = [
  { id: 'crown', name: 'THE HOLLOW CROWN', value: 900000, x: 1196, y: 520, inVault: true },
  { id: 'idol', name: 'JADE HERON IDOL', value: 300000, x: 670, y: 300, inVault: false },
  { id: 'bonds', name: 'BEARER BONDS', value: 180000, x: 940, y: 200, inVault: false },
];

/** The air duct: crawl it unseen from the lobby grate to the vault room grate, slowly. */
export const AIR_DUCT = { path: [point(150, 664), point(150, 684), point(912, 684), point(912, 650)] };

export const GETAWAY_VAN = { body: rect(36, 710, 118, 36), zone: rect(26, 702, 150, 48) };
export const THIEF_SPAWN = point(206, 728);

export const GUARD_POSTS = [
  { name: 'G1', speed: 72, phase: 0, route: [point(540, 210), point(800, 210), point(800, 640), point(540, 640)] },
  {
    name: 'G2', speed: 66, phase: 2,
    route: [point(1160, 400), point(1160, 230), point(950, 230), point(1160, 230), point(1160, 400), point(1000, 400), point(1000, 640), point(1160, 640)],
  },
  { name: 'G3', speed: 64, phase: 4, route: [point(180, 210), point(370, 210), point(370, 520), point(180, 520)] },
];

export const CAMERA_MOUNTS = [
  { name: 'C1', x: 650, y: 133, facing: -Math.PI / 2, sweep: 1.25, period: 9, phase: 0, range: 230, halfAngle: 0.33 },
  { name: 'C2', x: 868, y: 153, facing: Math.PI * 0.75, sweep: 0.6, period: 8, phase: 1.5, range: 340, halfAngle: 0.3 },
  { name: 'C3', x: 1238, y: 353, facing: Math.PI * 0.72, sweep: 0.5, period: 7, phase: 3, range: 300, halfAngle: 0.3 },
];

/** What a thief cannot walk through, without and with the laser gate shut. */
export const SOLIDS = [...WALLS, ...FURNITURE, VAULT_DOOR.box];
export const SOLIDS_GATE_SHUT = [...SOLIDS, LASER_GATE];
/** What a line of sight cannot pass. */
export const SIGHT_BLOCKERS = [...WALLS, ...FURNITURE, ...PAPER_EDGE];
