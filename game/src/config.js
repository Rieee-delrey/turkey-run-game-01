// Gobble Run v2: every tuning number and colour in one place.
// The playfield is a fixed 1280x480 logical area; the renderer scales it
// to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 480, groundY: 400 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Pixels of world scrolled per metre of distance. */
export const PX_PER_M = 20;

/** The turkey runs at x 380 now, so the farmer chasing behind it is on
 * screen from the first second instead of hiding off the left edge. */
export const TURKEY = {
  x: 380,
  width: 64,
  height: 56,
  duckHeight: 34,
  gravity: 2600,
  jumpVelocity: -1000,
  dashTime: 0.5,
  dashCooldown: 2.5,
  dashMultiplier: 1.6,
  invulnerable: 1.5,
};

export const LIVES = 3;

/** The farmer behind you: gap is pixels of breathing room; 0 means caught.
 * He winds up for 0.45 s before every throw (watch his raised arm), and
 * when he is nearly on you he lunges. Hiding in hay makes him stop and
 * search, which buys more room than just running. */
export const FARMER = {
  startGap: 220,
  gainPerSecond: [3.5, 4.5, 5.5],
  cornBonus: 10,
  featherBonus: 30,
  dashBonus: 50,
  hitPenalty: 80,
  hideBonus: 90,
  warnGap: 130,
  windupTime: 0.45,
  lungeGap: 60,
  lungeTime: 0.6,
  lungeGain: 2,
  searchTime: 1.0,
};

/** Corn chained without a hit builds a combo; every fifth cob in a chain
 * pays a bonus. A hit, or four quiet seconds, breaks the chain. */
export const COMBO = { windowSeconds: 4, every: 5, bonus: 25 };

/** Stage lengths in metres: farmyard, barn, kitchen. The forest gate waits at the end. */
export const STAGES = [
  { name: 'FARMYARD', lengthM: 500, speed: 260 },
  { name: 'BARN', lengthM: 500, speed: 300 },
  { name: 'KITCHEN', lengthM: 600, speed: 340 },
];

export const OBSTACLE = {
  fence: { width: 26, height: 72 },
  pumpkin: { width: 44, height: 40 },
  ovenJet: { width: 60, height: 150 },
  mud: { width: 130, height: 12 },
  haystack: { width: 90, height: 78 },
  knife: { width: 46, height: 14, speed: 460 },
  corn: { size: 26, points: 10 },
  feather: { size: 26, points: 50 },
  spawnInterval: 1.15,
  minGapPx: 260,
};

/** How many obstacles can exist at once; the pool is allocated once, at boot. */
export const POOL_SIZE = 48;

/** How many particles can exist at once; the pool is allocated once, at boot. */
export const PARTICLE_POOL = 120;

export const PALETTE = {
  skyTop: '#f7b267',
  skyMid: '#f4845f',
  skyLow: '#e76f51',
  sun: '#ffd166',
  cloud: '#fff3e0',
  hills: '#b5651d',
  hillsFar: '#c97b2d',
  treeLine: '#8a5a2b',
  ground: '#8a5a2b',
  groundTop: '#a06a35',
  grass: '#7da05c',
  fence: '#6b4423',
  hay: '#e9c46a',
  pumpkin: '#e76f1f',
  barn: '#a63d2f',
  barnRoof: '#7d2d22',
  kitchenWall: '#f4e3c2',
  oven: '#3d3d3d',
  flame: '#ff9f1c',
  flameCore: '#ffe66d',
  turkeyBody: '#8a5230',
  turkeyDark: '#6b3f24',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c', '#c1440e'],
  turkeyHead: '#d9c7a7',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#f2a007',
  farmerShirt: '#4a7c59',
  farmerPants: '#3b4a6b',
  farmerHat: '#e9c46a',
  farmerSkin: '#e8b98a',
  knife: '#dfe3e8',
  knifeHandle: '#7a4a26',
  corn: '#f2c94c',
  feather: '#ffd166',
  panel: '#2b1d12',
  text: '#fff8ec',
  muted: '#e8c9a0',
  danger: '#e63946',
  leaf: ['#d2691e', '#e8a33c', '#c1440e', '#ffd166'],
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';
