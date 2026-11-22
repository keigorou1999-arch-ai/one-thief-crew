// Every tunable number of ONE-THIEF CREW in one place: the 30 second loop, how fast a thief
// walks, how guards and cameras see, what fills the alarm meter and what each tool costs.

export const VIEW = { width: 1280, height: 800 };

/** The simulation advances in fixed steps so a recorded loop replays exactly. */
export const TICK = 1 / 60;
export const LOOP_SECONDS = 30;
export const LOOP_TICKS = LOOP_SECONDS * 60;
/** One thief, at most four copies of them in the room at once. */
export const MAX_SELVES = 4;

export const THIEF = { radius: 9, speed: 150, carrySpeed: 122, ventSpeed: 105, reach: 24 };

export const GUARD = {
  radius: 11,
  range: 215,
  halfAngle: 0.55,
  sway: 0.5,
  swayRate: 1.7,
  turnRate: 5,
  alertBoost: 1.25,
  respondBoost: 1.35,
  bustHoldSeconds: 5,
  coinHoldSeconds: 3,
  listenSeconds: 2.5,
};

/** Seconds a watcher needs to be sure of what it sees, up close and at the edge of its cone. */
export const SIGHT = { nearSeconds: 0.3, farSeconds: 0.85, forgetPerSecond: 1.6, coverRevealDistance: 64 };

/** Being fully spotted yourself is the loudest thing that can happen: the meter leaps. */
export const ALARM = { max: 100, perGhostCaught: 35, perLiveSpotted: 70, perSecondNoticed: 7, alertAt: 50 };

export const VAULT = { crackSeconds: 3.5, radius: 42 };

export const TOOLS = {
  smoke: { label: 'SMOKE', key: '1', price: 40000, radius: 85, seconds: 7 },
  emp: { label: 'EMP', key: '2', price: 90000, radius: 520, seconds: 6 },
  coin: { label: 'COIN', key: 'CLICK', price: 15000, throwRange: 280, hearing: 300 },
};

/** How long the frozen "SPOTTED" frame and the rewind sweep stay on screen. */
export const PAUSES = { caughtSeconds: 1.7, rewindSeconds: 1.1, vanSeconds: 1.4 };
