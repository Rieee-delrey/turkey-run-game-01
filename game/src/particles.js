// Small flying things: drifting autumn leaves, feathers kicked up by a
// dash, stars around a bonked turkey, confetti for an escape. One fixed
// pool, no allocation after boot, drawn by the renderer through drawParticles.
import { FIELD, PALETTE, PARTICLE_POOL } from './config.js';

export const PARTICLE_LEAF = 0;
export const PARTICLE_FEATHER = 1;
export const PARTICLE_STAR = 2;
export const PARTICLE_CONFETTI = 3;
export const PARTICLE_PUFF = 4;

export function createParticles(random) {
  const items = [];
  for (let i = 0; i < PARTICLE_POOL; i += 1) {
    items.push({ active: false, kind: PARTICLE_LEAF, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 4, color: '#fff', spin: 0 });
  }
  const state = { items, leafTimer: 0, random };

  function free() {
    for (let i = 0; i < items.length; i += 1) if (!items[i].active) return items[i];
    return null;
  }

  function spawn(kind, x, y, vx, vy, life, size, color) {
    const p = free();
    if (!p) return;
    p.active = true;
    p.kind = kind;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.maxLife = life; p.size = size; p.color = color;
    p.spin = random() * Math.PI * 2;
  }

  return {
    state,
    /** A leaf drifts in from the right every little while, always. */
    ambient(dt, speed) {
      state.leafTimer -= dt;
      if (state.leafTimer <= 0) {
        state.leafTimer = 0.5 + random() * 0.7;
        const color = PALETTE.leaf[Math.floor(random() * PALETTE.leaf.length)];
        spawn(PARTICLE_LEAF, FIELD.width + 10, 30 + random() * 220, -(40 + random() * 60) - speed * 0.15, 25 + random() * 35, 6, 4 + random() * 3, color);
      }
    },
    /** The turkey dashes: feathers burst off its tail. */
    dashBurst(x, y) {
      for (let i = 0; i < 7; i += 1) {
        spawn(PARTICLE_FEATHER, x, y, -(60 + random() * 90), -20 + random() * 60, 0.7, 5, PALETTE.turkeyTail[i % 4]);
      }
    },
    /** The turkey is hit: stars circle and a dust puff rises. */
    hitBurst(x, y) {
      for (let i = 0; i < 6; i += 1) {
        const ang = (i / 6) * Math.PI * 2;
        spawn(PARTICLE_STAR, x, y, Math.cos(ang) * 70, Math.sin(ang) * 70 - 30, 0.8, 6, '#ffd166');
      }
      spawn(PARTICLE_PUFF, x, FIELD.groundY - 6, -20, -30, 0.5, 14, 'rgba(214, 186, 150, 0.7)');
    },
    /** The escape: confetti over the forest gate. */
    escapeBurst(x, y) {
      const colors = ['#ffd166', '#e63946', '#7da05c', '#f4845f', '#fff3e0'];
      for (let i = 0; i < 36; i += 1) {
        spawn(PARTICLE_CONFETTI, x + (random() - 0.5) * 120, y + (random() - 0.5) * 40, (random() - 0.5) * 120, -40 - random() * 120, 1.6 + random(), 5, colors[i % colors.length]);
      }
    },
    /** A soft dust puff where feet land. */
    landPuff(x) {
      spawn(PARTICLE_PUFF, x, FIELD.groundY - 4, -30, -14, 0.4, 10, 'rgba(214, 186, 150, 0.55)');
    },
    step(dt) {
      for (const p of items) {
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) { p.active = false; continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.spin += dt * 4;
        if (p.kind === PARTICLE_LEAF) p.y += Math.sin(p.life * 6) * 12 * dt;
        if (p.kind === PARTICLE_CONFETTI) p.vy += 160 * dt;
        if (p.kind === PARTICLE_FEATHER) p.vy += 40 * dt;
        if (p.x < -20 || p.y > FIELD.height + 20) p.active = false;
      }
    },
    draw(ctx) {
      for (const p of items) {
        if (!p.active) continue;
        const fade = Math.min(1, (p.life / p.maxLife) * 2);
        ctx.globalAlpha = fade;
        if (p.kind === PARTICLE_STAR) {
          ctx.fillStyle = p.color;
          ctx.font = 'bold ' + Math.round(p.size * 3) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('*', p.x, p.y);
        } else if (p.kind === PARTICLE_PUFF) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.6 - fade * 0.6), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === PARTICLE_CONFETTI) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
