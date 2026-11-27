// The game's rules and state, with no drawing and no browser in it: the
// turkey's run, the farmer closing in behind, the obstacles, pickups and
// stages from farmyard to kitchen. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react without the
// world knowing about screens or sound. Nothing here allocates after
// createWorld returns. The farmer's mind lives in farmer.js; the combo
// chain and the stage banners live here.
import {
  COMBO, FARMER, FIELD, LIVES, OBSTACLE, POOL_SIZE, PX_PER_M, STAGES, STEP, TURKEY,
} from './config.js';
import { KNIFE_EVERY, SPAWN_PACE, SPAWN_TABLE, STAGE_SCENERY, TOTAL_LENGTH_M, stageAt } from './stages.js';
import { createFarmer, resetFarmer, stepFarmer } from './farmer.js';

export const KIND_FENCE = 0;
export const KIND_PUMPKIN = 1;
export const KIND_OVEN = 2;
export const KIND_MUD = 3;
export const KIND_HAY = 4;
export const KIND_KNIFE = 5;
export const KIND_CORN = 6;
export const KIND_FEATHER = 7;

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_FEATHER = 4;
export const EVENT_STAGE = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_CAUGHT = 32;
export const EVENT_SPOTTED = 64;
export const EVENT_HIDE = 128;
export const EVENT_COMBO = 256;
export const EVENT_THROW = 512;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random, particles) {
  const turkey = {
    x: TURKEY.x, y: FIELD.groundY - TURKEY.height, vy: 0, onGround: true,
    duck: false, hidden: false, hiddenTimer: 0, invuln: 0,
    dashTimer: 0, dashCooldown: 0, runPhase: 0,
  };
  const farmer = createFarmer();
  const obstacles = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    obstacles.push({ active: false, kind: KIND_FENCE, x: 0, y: 0, width: 0, height: 0, phase: 0 });
  }
  const state = {
    turkey, farmer, obstacles,
    score: 0, lives: LIVES, distanceM: 0, stage: 0, elapsed: 0,
    speed: STAGES[0].speed, spawnTimer: 1.0, knifeTimer: KNIFE_EVERY[0],
    spotted: false, inMud: false,
    combo: 0, comboTimer: 0,
    banner: null, bannerTimer: 0,
  };

  function showBanner(stage) {
    const scenery = STAGE_SCENERY[stage];
    state.banner = { title: scenery.banner, sub: scenery.bannerSub };
    state.bannerTimer = 2.2;
  }

  function reset() {
    turkey.y = FIELD.groundY - TURKEY.height;
    turkey.vy = 0;
    turkey.onGround = true;
    turkey.duck = false;
    turkey.hidden = false;
    turkey.hiddenTimer = 0;
    turkey.invuln = 0;
    turkey.dashTimer = 0;
    turkey.dashCooldown = 0;
    turkey.runPhase = 0;
    resetFarmer(farmer);
    for (const item of obstacles) item.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.distanceM = 0;
    state.stage = 0;
    state.elapsed = 0;
    state.speed = STAGES[0].speed;
    state.spawnTimer = 1.0;
    state.knifeTimer = KNIFE_EVERY[0];
    state.spotted = false;
    state.inMud = false;
    state.combo = 0;
    state.comboTimer = 0;
    state.banner = null;
    state.bannerTimer = 0;
  }

  function freeObstacle() {
    for (let index = 0; index < obstacles.length; index += 1) {
      if (!obstacles[index].active) return obstacles[index];
    }
    return null;
  }

  function pickKind(stage) {
    const table = SPAWN_TABLE[stage];
    let total = 0;
    for (const key of Object.keys(table)) total += table[key];
    let roll = random() * total;
    for (const key of Object.keys(table)) {
      roll -= table[key];
      if (roll <= 0) return key;
    }
    return 'corn';
  }

  function spawnObstacle() {
    const item = freeObstacle();
    if (item === null) return;
    const kind = pickKind(state.stage);
    const x = FIELD.width + 40;
    item.active = true;
    item.phase = random() * 1.6;
    if (kind === 'fence') {
      item.kind = KIND_FENCE;
      item.width = OBSTACLE.fence.width;
      item.height = OBSTACLE.fence.height;
      item.x = x;
      item.y = FIELD.groundY - item.height;
      // Corn over the fence rewards the jump that clears it.
      if (random() < 0.4) {
        const cob = freeObstacle();
        if (cob) {
          cob.active = true;
          cob.kind = KIND_CORN;
          cob.width = OBSTACLE.corn.size;
          cob.height = OBSTACLE.corn.size;
          cob.x = x + 4;
          cob.y = FIELD.groundY - 128;
          cob.phase = 0;
        }
      }
    } else if (kind === 'pumpkin') {
      item.kind = KIND_PUMPKIN;
      item.width = OBSTACLE.pumpkin.width;
      item.height = OBSTACLE.pumpkin.height;
      item.x = x;
      item.y = FIELD.groundY - item.height;
    } else if (kind === 'oven') {
      item.kind = KIND_OVEN;
      item.width = OBSTACLE.ovenJet.width;
      item.height = OBSTACLE.ovenJet.height;
      item.x = x;
      item.y = FIELD.groundY - item.height;
    } else if (kind === 'mud') {
      item.kind = KIND_MUD;
      item.width = OBSTACLE.mud.width;
      item.height = OBSTACLE.mud.height;
      item.x = x;
      item.y = FIELD.groundY - item.height;
    } else if (kind === 'hay') {
      item.kind = KIND_HAY;
      item.width = OBSTACLE.haystack.width;
      item.height = OBSTACLE.haystack.height;
      item.x = x;
      item.y = FIELD.groundY - item.height;
    } else if (kind === 'feather') {
      item.kind = KIND_FEATHER;
      item.width = OBSTACLE.feather.size;
      item.height = OBSTACLE.feather.size;
      item.x = x;
      item.y = FIELD.groundY - 150;
    } else {
      item.kind = KIND_CORN;
      item.width = OBSTACLE.corn.size;
      item.height = OBSTACLE.corn.size;
      item.x = x;
      item.y = FIELD.groundY - 40 - random() * 90;
    }
  }

  // Fairness rule: the farmer only throws when the runway ahead of the
  // turkey is clear of fences, pumpkins and ovens, so a knife never lands
  // on the same beat as a jump the turkey has to make. A human gets the
  // same deal: one threat at a time, each with room to answer it.
  function runwayClear() {
    for (const item of obstacles) {
      if (!item.active) continue;
      if ((item.kind === KIND_FENCE || item.kind === KIND_PUMPKIN || item.kind === KIND_OVEN)
        && item.x > turkey.x - 60 && item.x < turkey.x + 560) return false;
    }
    return true;
  }

  function throwKnife() {
    const item = freeObstacle();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_KNIFE;
    item.width = OBSTACLE.knife.width;
    item.height = OBSTACLE.knife.height;
    // The blade leaves the farmer's hand, not the edge of the screen: with
    // the farmer on screen now, a knife from off-screen left would read as
    // a bug and would fly longer than the pilot's duck window was tuned for.
    item.x = turkey.x - farmer.gap + 4;
    // The farmer throws at the turkey's chest: duck under it or jump over it.
    // The blade flies high enough that a ducked turkey is clear of it and a
    // jumping turkey is clear of it through most of its arc; it only bites
    // a standing turkey, or one just taking off or landing.
    item.y = FIELD.groundY - 66;
    item.phase = 0;
  }

  // The oven's flame runs a 1.6 s cycle: off for 1.1 s, on for 0.5 s.
  function ovenFlameOn(item) {
    return ((state.elapsed + item.phase) % 1.6) >= 1.1;
  }

  // Is the flame off for the whole future window [tEnter, tExit] seconds
  // from now? The pilot only jumps an oven when the pass fits an off-window.
  function ovenSafePass(item, tEnter, tExit) {
    const cycle = (state.elapsed + item.phase) % 1.6;
    if (cycle < 1.1) {
      // Off now; it fires at 1.1 - cycle and stays lit until 1.6 - cycle.
      return tExit <= 1.1 - cycle;
    }
    // Lit now; it goes out at 1.6 - cycle and stays out for 1.1 s after.
    const offAt = 1.6 - cycle;
    return tEnter >= offAt && tExit <= offAt + 1.1;
  }

  function turkeyBox() {
    const height = turkey.duck ? TURKEY.duckHeight : TURKEY.height;
    return {
      x: turkey.x + 6, y: turkey.y + (TURKEY.height - height), width: TURKEY.width - 12, height,
    };
  }

  function breakCombo() {
    state.combo = 0;
    state.comboTimer = 0;
  }

  /**
   * One fixed step. `controls` is { jump, dash, hide, duck } pressed this step
   * (jump/dash/hide are edges, duck is held). With `harmless` set (the title
   * screen's backdrop) things scroll but nothing touches the turkey, nothing
   * scores and the farmer never catches up.
   */
  function step(dt, controls, harmless) {
    let events = 0;
    state.elapsed += dt;
    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
      if (state.bannerTimer <= 0) state.banner = null;
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    const stage = stageAt(state.distanceM);
    if (stage !== state.stage) {
      state.stage = stage;
      state.speed = STAGES[stage].speed;
      if (!harmless) {
        showBanner(stage);
        events |= EVENT_STAGE;
      }
    }

    // Dash: a burst of speed that also buys breathing room from the farmer.
    if (controls.dash && turkey.dashCooldown <= 0 && !turkey.hidden) {
      turkey.dashTimer = TURKEY.dashTime;
      turkey.dashCooldown = TURKEY.dashCooldown;
      if (!harmless) farmer.gap = Math.min(420, farmer.gap + FARMER.dashBonus);
      if (particles) particles.dashBurst(turkey.x + 10, turkey.y + 30);
    }
    if (turkey.dashCooldown > 0) turkey.dashCooldown -= dt;
    if (turkey.dashTimer > 0) turkey.dashTimer -= dt;

    // Hide: duck into a nearby haystack and the farmer runs straight past,
    // then stops to search for you. He does not gain while he searches.
    let hideJustUsed = false;
    if (controls.hide && turkey.onGround && !turkey.hidden) {
      for (const item of obstacles) {
        if (item.active && item.kind === KIND_HAY && item.x > turkey.x - 40 && item.x < turkey.x + 160) {
          turkey.hidden = true;
          turkey.hiddenTimer = 1.2;
          hideJustUsed = true;
          if (!harmless) events |= EVENT_HIDE;
          break;
        }
      }
    }
    if (turkey.hidden) {
      turkey.hiddenTimer -= dt;
      if (turkey.hiddenTimer <= 0) turkey.hidden = false;
    }

    // Vertical motion.
    const wasAirborne = !turkey.onGround;
    if (controls.jump && turkey.onGround && !turkey.hidden) {
      turkey.vy = TURKEY.jumpVelocity;
      turkey.onGround = false;
    }
    turkey.vy += TURKEY.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= FIELD.groundY - TURKEY.height) {
      turkey.y = FIELD.groundY - TURKEY.height;
      turkey.vy = 0;
      if (wasAirborne && particles) particles.landPuff(turkey.x + 30);
      turkey.onGround = true;
    }
    turkey.duck = controls.duck && turkey.onGround;
    if (turkey.invuln > 0) turkey.invuln -= dt;

    // The farmer's mind: chase, wind up, throw, search, lunge.
    if (!harmless && !turkey.hidden) {
      state.knifeTimer -= dt;
      const throwReady = state.knifeTimer <= 0 && runwayClear() && turkey.onGround;
      const outcome = stepFarmer(farmer, dt, {
        gainPerSecond: FARMER.gainPerSecond[state.stage],
        hidden: turkey.hidden,
        hideJustUsed,
        throwReady,
      });
      if (outcome.throwNow) {
        throwKnife();
        state.knifeTimer += KNIFE_EVERY[state.stage];
        events |= EVENT_THROW;
      } else if (throwReady) {
        // He is winding up: the throw timer restarts only once the knife flies.
        state.knifeTimer = 0.05;
      }
      if (farmer.gap <= FARMER.warnGap && !state.spotted) {
        state.spotted = true;
        events |= EVENT_SPOTTED;
      } else if (farmer.gap > FARMER.warnGap + 40) {
        state.spotted = false;
      }
      if (outcome.caught) {
        events |= EVENT_CAUGHT;
        return events;
      }
    } else if (!harmless && turkey.hidden) {
      // Hidden in the hay: he searches where you vanished instead of gaining.
      stepFarmer(farmer, dt, {
        gainPerSecond: 0, hidden: true, hideJustUsed, throwReady: false,
      });
    }

    // World speed, mud, and distance.
    let inMud = false;
    if (!turkey.hidden) {
      const box = turkeyBox();
      for (const item of obstacles) {
        if (item.active && item.kind === KIND_MUD && overlaps(box, item)) {
          inMud = true;
          break;
        }
      }
    }
    state.inMud = inMud;
    let speed = state.speed * (turkey.dashTimer > 0 ? TURKEY.dashMultiplier : 1);
    if (inMud) speed *= 0.55;
    state.distanceM += (speed * dt) / PX_PER_M;
    turkey.runPhase += (speed * dt) / 14;

    // Spawning.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObstacle();
      state.spawnTimer += OBSTACLE.spawnInterval * SPAWN_PACE[state.stage];
    }

    // Move and collide.
    const box = turkeyBox();
    for (const item of obstacles) {
      if (!item.active) continue;
      if (item.kind === KIND_KNIFE) item.x += OBSTACLE.knife.speed * dt;
      else item.x -= speed * dt;
      if (item.x + item.width < -60 || item.x > FIELD.width + 200) {
        item.active = false;
        continue;
      }
      if (harmless || turkey.hidden) continue;
      if (item.kind === KIND_CORN || item.kind === KIND_FEATHER) {
        if (overlaps(box, item)) {
          item.active = false;
          if (item.kind === KIND_CORN) {
            state.combo += 1;
            state.comboTimer = COMBO.windowSeconds;
            let points = OBSTACLE.corn.points;
            if (state.combo % COMBO.every === 0) {
              points += COMBO.bonus;
              events |= EVENT_COMBO;
            }
            state.score += points;
            farmer.gap = Math.min(420, farmer.gap + FARMER.cornBonus);
            events |= EVENT_CORN;
          } else {
            state.score += OBSTACLE.feather.points;
            farmer.gap = Math.min(420, farmer.gap + FARMER.featherBonus);
            events |= EVENT_FEATHER;
          }
        }
        continue;
      }
      if (item.kind === KIND_MUD || item.kind === KIND_HAY) continue;
      // The oven's body is always solid; its flame column only bites while lit.
      // The flame tops out 90 px up: a well-timed jump threads it, a lazy
      // one does not, and waiting for the flame to go out is always an option.
      let hitBox = item;
      if (item.kind === KIND_OVEN) {
        hitBox = ovenFlameOn(item)
          ? { x: item.x, y: FIELD.groundY - 90, width: item.width, height: 90 }
          : { x: item.x, y: FIELD.groundY - 44, width: item.width, height: 44 };
      }
      if (overlaps(box, hitBox) && turkey.invuln <= 0) {
        item.active = false;
        state.lives -= 1;
        turkey.invuln = TURKEY.invulnerable;
        farmer.gap = Math.max(0, farmer.gap - FARMER.hitPenalty);
        breakCombo();
        if (particles) particles.hitBurst(turkey.x + 34, turkey.y + 20);
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          events |= EVENT_CAUGHT;
          return events;
        }
        if (farmer.gap <= 0) {
          events |= EVENT_CAUGHT;
          return events;
        }
      }
    }

    if (particles) {
      particles.ambient(dt, speed);
      particles.step(dt);
    }

    if (!harmless && state.distanceM >= TOTAL_LENGTH_M) {
      if (particles) particles.escapeBurst(FIELD.width - 160, FIELD.groundY - 120);
      events |= EVENT_ESCAPED;
    }
    return events;
  }

  /** Stage a thrown knife at once (the screenshot scenes use this, never the loop). */
  function forceKnife() {
    throwKnife();
    state.knifeTimer = KNIFE_EVERY[state.stage];
  }

  reset();
  return { state, reset, step, ovenFlameOn, ovenSafePass, forceKnife };
}
