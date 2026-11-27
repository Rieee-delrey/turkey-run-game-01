// What each stage of the escape looks like and throws at the turkey.
// The run grows harder from the farmyard to the kitchen: faster scroll,
// more knives from the farmer, and the oven jets only in the kitchen.
import { STAGES } from './config.js';

/** Spawn weights per stage: kind -> relative chance. */
export const SPAWN_TABLE = [
  { fence: 30, pumpkin: 20, hay: 15, corn: 25, feather: 5, mud: 5 },
  { fence: 25, pumpkin: 20, hay: 12, corn: 20, feather: 5, mud: 8, oven: 10 },
  { fence: 15, pumpkin: 15, hay: 5, corn: 20, feather: 5, mud: 10, oven: 30 },
];

/** Seconds between the farmer's thrown knives, per stage. */
export const KNIFE_EVERY = [3.2, 2.8, 2.4];

/** Spawn interval multiplier per stage (the farm gets busier). */
export const SPAWN_PACE = [1, 0.92, 0.85];

/** Backdrop flavour per stage, for the renderer. */
export const STAGE_SCENERY = [
  { label: 'FARMYARD', building: 'farmhouse', tree: true },
  { label: 'BARN', building: 'barn', tree: true },
  { label: 'KITCHEN', building: 'kitchen', tree: false },
];

/** Total run length in metres, and the stage a distance falls in. */
export const TOTAL_LENGTH_M = STAGES.reduce((sum, stage) => sum + stage.lengthM, 0);

export function stageAt(distanceM) {
  let walked = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distanceM < walked + STAGES[i].lengthM) return i;
    walked += STAGES[i].lengthM;
  }
  return STAGES.length - 1;
}
