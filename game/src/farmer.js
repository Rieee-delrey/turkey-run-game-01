// The farmer's mind: a small state machine with no drawing and no browser
// in it. He chases, and that is the whole game for the turkey — but he is
// not a metronome. He winds up before every throw, so a watching player
// gets a fair warning; he stops and searches when the turkey vanishes into
// a haystack; and when he is nearly on the bird he lunges. The world owns
// the knife itself: this module only decides when one leaves his hand.
import { FARMER } from './config.js';

export const FARMER_CHASE = 'chase';
export const FARMER_WINDUP = 'windup';
export const FARMER_SEARCH = 'search';
export const FARMER_LUNGE = 'lunge';

export function createFarmer() {
  return { gap: FARMER.startGap, mode: FARMER_CHASE, timer: 0, lungeCooldown: 0 };
}

export function resetFarmer(farmer) {
  farmer.gap = FARMER.startGap;
  farmer.mode = FARMER_CHASE;
  farmer.timer = 0;
  farmer.lungeCooldown = 0;
}

/**
 * One step of the farmer. `input` is what the world knows this step:
 * gainPerSecond (how fast he closes in this stage), hidden (the turkey is
 * in the hay), hideJustUsed (the turkey ducked into a haystack this step),
 * throwReady (the throw timer is up and the runway ahead is clear).
 * Returns { throwNow, caught }: throwNow when a wound-up throw leaves his
 * hand this step, caught when the gap has closed to nothing.
 */
export function stepFarmer(farmer, dt, input) {
  const result = { throwNow: false, caught: false };
  if (farmer.mode === FARMER_SEARCH) {
    // He has stopped at the haystack, scratching his head. The turkey is
    // safe while he looks, and the search buys real breathing room.
    farmer.timer -= dt;
    if (farmer.timer <= 0) farmer.mode = FARMER_CHASE;
    return result;
  }
  if (farmer.mode === FARMER_WINDUP) {
    // Arm raised, knife glinting: he stands still to throw, so the windup
    // itself is a small breather for a turkey that reads it.
    farmer.timer -= dt;
    if (farmer.timer <= 0) {
      farmer.mode = FARMER_CHASE;
      result.throwNow = true;
    }
    return result;
  }
  if (farmer.mode === FARMER_LUNGE) {
    farmer.timer -= dt;
    farmer.gap -= input.gainPerSecond * FARMER.lungeGain * dt;
    if (farmer.timer <= 0) {
      farmer.mode = FARMER_CHASE;
      farmer.lungeCooldown = 1.2;
    }
  } else {
    farmer.gap -= input.gainPerSecond * dt;
    if (farmer.lungeCooldown > 0) farmer.lungeCooldown -= dt;
  }
  if (input.hideJustUsed) {
    farmer.mode = FARMER_SEARCH;
    farmer.timer = FARMER.searchTime;
    farmer.gap = Math.min(420, farmer.gap + FARMER.hideBonus);
    return result;
  }
  if (farmer.mode === FARMER_CHASE && input.throwReady) {
    farmer.mode = FARMER_WINDUP;
    farmer.timer = FARMER.windupTime;
    return result;
  }
  if (farmer.mode === FARMER_CHASE && farmer.gap <= FARMER.lungeGap && farmer.gap > 0 && farmer.lungeCooldown <= 0) {
    farmer.mode = FARMER_LUNGE;
    farmer.timer = FARMER.lungeTime;
  }
  if (farmer.gap <= 0) result.caught = true;
  return result;
}
