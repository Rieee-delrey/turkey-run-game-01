// The screenshot scenes behind ?shot=start|play|kitchen|end. Each one plays
// the real rules forward from a fresh run, steered by an autopilot that looks
// ahead for fences, knives and corn, so the frame is what a real game looks
// like and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import {
  EVENT_CAUGHT, EVENT_ESCAPED, KIND_CORN, KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_OVEN, KIND_PUMPKIN,
} from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 400;

/**
 * Decide this step's controls from the world: jump the fence or pumpkin in
 * the way, duck under a knife at chest height, dash when the farmer is
 * close, hide in the hay when he is nearly on you, chase the corn.
 * `skill` is how far ahead, in seconds, the pilot looks: a good pilot
 * survives, a hurried one gets caught.
 */
export function autopilot(state, skill, ovenSafePass) {
  const turkey = state.turkey;
  const controls = { jump: false, dash: false, hide: false, duck: false };
  const speed = state.speed;
  const look = speed * skill;
  let nearestHazard = null;
  let nearestKnife = null;
  let nearestCorn = null;
  let nearestHay = null;
  for (const item of state.obstacles) {
    if (!item.active) continue;
    // Knives come from behind, thrown by the farmer: they approach from
    // the left, so they are judged by their own window, not the one ahead.
    if (item.kind === KIND_KNIFE) {
      if (item.x > turkey.x - 260 && item.x < turkey.x + 80) {
        if (!nearestKnife || item.x < nearestKnife.x) nearestKnife = item;
      }
      continue;
    }
    const ahead = item.x - (turkey.x + 60);
    if (ahead < -20 || ahead > look + 120) continue;
    if (item.kind === KIND_FENCE || item.kind === KIND_PUMPKIN || item.kind === KIND_OVEN) {
      if (!nearestHazard || item.x < nearestHazard.x) nearestHazard = item;
    } else if (item.kind === KIND_CORN) {
      if (!nearestCorn || item.x < nearestCorn.x) nearestCorn = item;
    } else if (item.kind === KIND_HAY) {
      if (!nearestHay || item.x < nearestHay.x) nearestHay = item;
    }
  }
  // Jump timing: the turkey's high arc must cover the whole pass under the
  // obstacle, so the jump starts when it is about 0.30 s of scroll away.
  const jumpRange = speed * 0.30;
  if (nearestHazard && turkey.onGround) {
    const ahead = nearestHazard.x - (turkey.x + 60);
    if (ahead < jumpRange) {
      if (nearestHazard.kind === KIND_OVEN && ovenSafePass) {
        // An oven is jumped at the normal moment when its flame stays out
        // for the pass; when the flame is lit, the jump comes late, so the
        // turkey's high arc threads the flame instead of landing in it.
        const tEnter = ahead / speed;
        const tExit = tEnter + (nearestHazard.width + 52) / speed;
        if (ovenSafePass(nearestHazard, tEnter, tExit)) controls.jump = true;
        else if (tEnter <= 0.14) controls.jump = true;
      } else {
        controls.jump = true;
      }
    }
  }
  if (!controls.jump && nearestCorn && turkey.onGround) {
    const dx = nearestCorn.x - turkey.x;
    if (nearestCorn.y < FIELD.groundY - 90 && dx > 40 && dx < jumpRange) controls.jump = true;
  }
  // Never take off into a knife: if one is crossing the turkey now, will
  // in the next few frames, or will arrive as the jump is landing, hold the
  // jump a beat unless the fence is already on you. A knife takes about
  // 0.21 s to cross the turkey; the jump is low for its first 0.08 s and
  // its last 0.12 s, and high between them.
  if (controls.jump && nearestKnife) {
    const timeToKnife = (turkey.x + 6 - (nearestKnife.x + 46)) / 460;
    const hazardAhead = nearestHazard ? nearestHazard.x - (turkey.x + 60) : Infinity;
    const takeoffWindow = timeToKnife > -0.21 && timeToKnife < 0.18;
    const landingWindow = timeToKnife > 0.60 && timeToKnife < 0.82;
    if ((takeoffWindow || landingWindow) && hazardAhead > 30) controls.jump = false;
  }
  if (nearestKnife && !controls.jump) {
    const dx = nearestKnife.x - turkey.x;
    if (dx > -240 && dx < 70) controls.duck = true;
  }
  if (state.farmer.gap < 140 && turkey.dashCooldown <= 0) controls.dash = true;
  if (nearestHay && state.farmer.gap < 170 && turkey.onGround) {
    const dx = nearestHay.x - turkey.x;
    if (dx > -20 && dx < 120) controls.hide = true;
  }
  return controls;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. start: the title over a live farmyard. play: a
 * mid-farmyard run. kitchen: a late-kitchen chase with the farmer on your
 * tail. end: the escape at the forest gate.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { jump: false, dash: false, hide: false, duck: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
      if (world.step(STEP, autopilot(world.state, 0.7, world.ovenSafePass), false) & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'kitchen') {
    // Run a good pilot to the kitchen, then a hurried one, so the frame
    // catches the chase at its tensest: farmer close, oven lit.
    let index = 0;
    while (world.state.stage < 2 && index < 30000) {
      if (world.step(STEP, autopilot(world.state, 0.7, world.ovenSafePass), false) & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
      index += 1;
    }
    for (let i = 0; i < 12 / STEP; i += 1) {
      if (world.step(STEP, autopilot(world.state, 0.45, world.ovenSafePass), false) & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
    }
    if (world.state.lives > 0 && world.state.farmer.gap > 0) {
      // The frame a real chase reaches: the farmer a wingbeat behind.
      world.state.farmer.gap = 95;
      world.state.spotted = true;
    }
    return { screen: world.state.lives === 0 ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  // end: a clean run all the way to the forest gate.
  for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
    const events = world.step(STEP, autopilot(world.state, 0.8, world.ovenSafePass), false);
    if (events & EVENT_ESCAPED) return { screen: SCREEN_WIN, best: world.state.score };
    if (events & EVENT_CAUGHT) break;
  }
  return { screen: SCREEN_OVER, best: world.state.score };
}
