// Everything the eye sees: the autumn farm scrolling past, the turkey, the
// farmer closing in, the hazards, the HUD and the screens. Pure drawing:
// it reads state and paints the canvas, and never changes a rule.
import { FIELD, PALETTE, TURKEY } from './config.js';
import {
  KIND_CORN, KIND_FENCE, KIND_FEATHER, KIND_HAY, KIND_KNIFE, KIND_MUD, KIND_OVEN, KIND_PUMPKIN,
} from './world.js';
import { STAGE_SCENERY } from './stages.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_WIN = 4;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = FIELD.width;
  const H = FIELD.height;

  function drawSky(distanceM) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, PALETTE.skyTop);
    grad.addColorStop(0.55, PALETTE.skyMid);
    grad.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Low autumn sun.
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(1080, 92, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.beginPath();
    ctx.arc(1080, 92, 70, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds, placed by distance so the same run always looks the same.
    ctx.fillStyle = PALETTE.cloud;
    for (let i = 0; i < 5; i += 1) {
      const cx = ((i * 317 + 90 - distanceM * 12) % 1500 + 1500) % 1500 - 110;
      const cy = 46 + i * 26;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 58, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, cy + 6, 40, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Far hills.
    ctx.fillStyle = PALETTE.hillsFar;
    ctx.beginPath();
    ctx.moveTo(0, 340);
    for (let x = 0; x <= W; x += 160) {
      const hx = x - ((distanceM * 6) % 160);
      ctx.quadraticCurveTo(hx + 80, 268, hx + 160, 340);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawBuilding(scrollX, kind, baseX) {
    // Buildings recur down the road: wrap them so the farm never runs out.
    const x = (((baseX - scrollX) % 1400) + 1400) % 1400 - 260;
    if (x < -260 || x > W + 40) return;
    if (kind === 'farmhouse') {
      ctx.fillStyle = '#f7ead0';
      ctx.fillRect(x, 236, 190, 104);
      ctx.fillStyle = '#8a4b2d';
      ctx.beginPath();
      ctx.moveTo(x - 12, 240);
      ctx.lineTo(x + 95, 176);
      ctx.lineTo(x + 202, 240);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5b3a29';
      ctx.fillRect(x + 80, 282, 30, 58);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x + 24, 262, 30, 26);
      ctx.fillRect(x + 136, 262, 30, 26);
      ctx.fillStyle = '#8a4b2d';
      ctx.fillRect(x + 150, 150, 14, 30);
    } else if (kind === 'barn') {
      ctx.fillStyle = PALETTE.barn;
      ctx.fillRect(x, 220, 210, 120);
      ctx.fillStyle = PALETTE.barnRoof;
      ctx.beginPath();
      ctx.moveTo(x - 10, 224);
      ctx.lineTo(x + 105, 158);
      ctx.lineTo(x + 220, 224);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f7ead0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 85, 340);
      ctx.lineTo(x + 125, 272);
      ctx.moveTo(x + 125, 340);
      ctx.lineTo(x + 85, 272);
      ctx.stroke();
      ctx.fillStyle = '#f7ead0';
      ctx.fillRect(x + 85, 272, 40, 68);
      ctx.strokeStyle = '#7d2d22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 105, 272);
      ctx.lineTo(x + 105, 340);
      ctx.moveTo(x + 85, 306);
      ctx.lineTo(x + 125, 306);
      ctx.stroke();
    } else {
      // Kitchen: a warm house wall with a window and a chimney puffing.
      ctx.fillStyle = PALETTE.kitchenWall;
      ctx.fillRect(x, 210, 220, 130);
      ctx.fillStyle = '#8a4b2d';
      ctx.beginPath();
      ctx.moveTo(x - 10, 214);
      ctx.lineTo(x + 110, 156);
      ctx.lineTo(x + 230, 214);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3d3d3d';
      ctx.fillRect(x + 170, 128, 22, 44);
      ctx.fillStyle = 'rgba(255, 243, 224, 0.85)';
      ctx.beginPath();
      ctx.ellipse(x + 181, 108, 16, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 190, 88, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x + 30, 250, 44, 40);
      ctx.fillRect(x + 140, 250, 44, 40);
      ctx.fillStyle = '#5b3a29';
      ctx.fillRect(x + 95, 282, 32, 58);
    }
  }

  function drawGround(distanceM) {
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, FIELD.groundY, W, H - FIELD.groundY);
    ctx.fillStyle = PALETTE.groundTop;
    ctx.fillRect(0, FIELD.groundY, W, 10);
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, FIELD.groundY - 4, W, 6);
    // Fence posts and tufts scrolling with the ground.
    ctx.fillStyle = PALETTE.fence;
    const off = (distanceM * 20) % 90;
    for (let x = -off; x < W; x += 90) {
      ctx.fillRect(x, FIELD.groundY - 26, 6, 26);
    }
    ctx.fillStyle = '#5da244';
    for (let i = 0; i < 24; i += 1) {
      const gx = ((i * 173 + 40 - distanceM * 20) % 1400 + 1400) % 1400 - 60;
      ctx.beginPath();
      ctx.moveTo(gx, FIELD.groundY);
      ctx.lineTo(gx + 5, FIELD.groundY - 12);
      ctx.lineTo(gx + 10, FIELD.groundY);
      ctx.fill();
    }
  }

  function drawTurkey(turkey, hidden) {
    if (hidden) return;
    if (turkey.invuln > 0 && Math.floor(turkey.elapsed * 12) % 2 === 0) return;
    const x = turkey.x;
    const y = turkey.y;
    const bob = turkey.onGround ? Math.sin(turkey.runPhase) * 3 : 0;
    const ducking = turkey.duck;
    const bodyY = y + (ducking ? 14 : 0) + bob;
    // Fanned tail, the turkey's pride.
    const tailColors = PALETTE.turkeyTail;
    for (let i = 0; i < 5; i += 1) {
      const ang = (-0.9 + i * 0.45) - (ducking ? 0.35 : 0);
      ctx.save();
      ctx.translate(x + 8, bodyY + 30);
      ctx.rotate(ang);
      ctx.fillStyle = tailColors[i % tailColors.length];
      ctx.beginPath();
      ctx.ellipse(-16, 0, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(x + 34, bodyY + 30, 32, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(x + 34, bodyY + 38, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head and neck.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.ellipse(x + 60, bodyY + 2, 12, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(x + 70, bodyY - 2);
    ctx.lineTo(x + 82, bodyY + 2);
    ctx.lineTo(x + 70, bodyY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(x + 64, bodyY + 12, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + 63, bodyY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Legs, pumping while it runs.
    ctx.strokeStyle = '#f2a007';
    ctx.lineWidth = 4;
    const legSwing = turkey.onGround ? Math.sin(turkey.runPhase) * 10 : 6;
    ctx.beginPath();
    ctx.moveTo(x + 24, bodyY + 48);
    ctx.lineTo(x + 24 + legSwing, FIELD.groundY);
    ctx.moveTo(x + 44, bodyY + 48);
    ctx.lineTo(x + 44 - legSwing, FIELD.groundY);
    ctx.stroke();
  }

  function drawFarmer(state) {
    const gap = state.farmer.gap;
    const x = state.turkey.x - gap - 56;
    if (x < -90) return;
    const y = FIELD.groundY;
    const swing = Math.sin(state.turkey.runPhase * 1.15) * 12;
    // Legs.
    ctx.strokeStyle = PALETTE.farmerPants;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x + 26, y - 52);
    ctx.lineTo(x + 26 + swing, y);
    ctx.moveTo(x + 40, y - 52);
    ctx.lineTo(x + 40 - swing, y);
    ctx.stroke();
    // Body and apron.
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, x + 12, y - 108, 44, 60, 10);
    ctx.fill();
    ctx.fillStyle = '#f7ead0';
    ctx.fillRect(x + 18, y - 96, 32, 44);
    // Head, nose and straw hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(x + 34, y - 122, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(x + 34, y - 134, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 20, y - 152, 28, 20);
    // Pitchfork, raised and ready.
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 52, y - 60);
    ctx.lineTo(x + 66, y - 140);
    ctx.stroke();
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 66 + i * 7, y - 140);
      ctx.lineTo(x + 66 + i * 7, y - 156);
      ctx.stroke();
    }
    // "!" when he is about to grab you.
    if (gap < 120) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 34px ' + "'Trebuchet MS', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('!', x + 34, y - 168);
    }
  }

  function drawObstacle(item, elapsed) {
    const { x, y, width: w, height: h } = item;
    if (item.kind === KIND_FENCE) {
      ctx.fillStyle = PALETTE.fence;
      ctx.fillRect(x, y, 8, h);
      ctx.fillRect(x + w - 8, y, 8, h);
      ctx.fillRect(x - 6, y + 12, w + 12, 8);
      ctx.fillRect(x - 6, y + 38, w + 12, 8);
    } else if (item.kind === KIND_PUMPKIN) {
      ctx.fillStyle = PALETTE.pumpkin;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2 + 4, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b34d0e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 10, y + 4);
      ctx.quadraticCurveTo(x + w / 2 - 12, y + h / 2, x + w / 2 - 10, y + h - 4);
      ctx.moveTo(x + w / 2 + 10, y + 4);
      ctx.quadraticCurveTo(x + w / 2 + 12, y + h / 2, x + w / 2 + 10, y + h - 4);
      ctx.stroke();
      ctx.fillStyle = '#5da244';
      ctx.fillRect(x + w / 2 - 3, y - 8, 6, 10);
    } else if (item.kind === KIND_OVEN) {
      // The stove body is 44 px tall; the flame rises from its top to
      // 90 px above the ground while lit, and that is the deadly height.
      ctx.fillStyle = PALETTE.oven;
      roundRect(ctx, x, FIELD.groundY - 44, w, 44, 6);
      ctx.fill();
      ctx.fillStyle = '#222';
      roundRect(ctx, x + 8, FIELD.groundY - 36, w - 16, 28, 4);
      ctx.fill();
      const on = ((elapsed + item.phase) % 1.6) >= 1.1;
      if (on) {
        const flick = Math.sin(elapsed * 22 + item.phase * 9) * 5;
        ctx.fillStyle = PALETTE.flame;
        ctx.beginPath();
        ctx.moveTo(x + 6, FIELD.groundY - 40);
        ctx.quadraticCurveTo(x + w / 2 + flick, FIELD.groundY - 90, x + w - 6, FIELD.groundY - 40);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.flameCore;
        ctx.beginPath();
        ctx.moveTo(x + 16, FIELD.groundY - 40);
        ctx.quadraticCurveTo(x + w / 2 - flick, FIELD.groundY - 70, x + w - 16, FIELD.groundY - 40);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px ' + "'Trebuchet MS', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('OVEN', x + w / 2, FIELD.groundY - 54);
    } else if (item.kind === KIND_MUD) {
      ctx.fillStyle = '#5b3a29';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5230';
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 20, y + h / 2, 22, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(x + w / 2 + 26, y + h / 2 + 2, 18, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === KIND_HAY) {
      ctx.fillStyle = PALETTE.hay;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.quadraticCurveTo(x + w / 2, y - 18, x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + (w * i) / 4, y + h - 8);
        ctx.quadraticCurveTo(x + (w * i) / 4 - 8, y + h / 2, x + (w * i) / 4, y + 14);
        ctx.stroke();
      }
    } else if (item.kind === KIND_KNIFE) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(Math.sin(elapsed * 9 + x * 0.05) * 0.5);
      ctx.fillStyle = PALETTE.knife;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2 - 12, -7);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(w / 2 - 12, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PALETTE.knifeHandle;
      ctx.fillRect(-w / 2 - 10, -4, 12, 8);
      ctx.restore();
    } else if (item.kind === KIND_CORN) {
      const bobY = Math.sin(elapsed * 4 + x * 0.1) * 3;
      ctx.fillStyle = PALETTE.corn;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2 + bobY, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5da244';
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 8, y + h - 2 + bobY);
      ctx.lineTo(x + w / 2, y + h + 12 + bobY);
      ctx.lineTo(x + w / 2 + 8, y + h - 2 + bobY);
      ctx.closePath();
      ctx.fill();
    } else if (item.kind === KIND_FEATHER) {
      const bobY = Math.sin(elapsed * 5 + x * 0.1) * 4;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2 + bobY);
      ctx.rotate(0.6);
      ctx.fillStyle = PALETTE.feather;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9a441';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHud(state, best) {
    ctx.fillStyle = 'rgba(43, 29, 18, 0.82)';
    roundRect(ctx, 12, 10, W - 24, 52, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px ' + "'Trebuchet MS', sans-serif";
    ctx.fillText('SCORE ' + state.score, 28, 44);
    ctx.font = 'bold 20px ' + "'Trebuchet MS', sans-serif";
    ctx.fillText(Math.floor(state.distanceM) + ' m', 250, 42);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 16px ' + "'Trebuchet MS', sans-serif";
    ctx.fillText(STAGE_SCENERY[state.stage].label + '  ·  BEST ' + best, 380, 42);
    // Lives as hearts.
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'right';
    let hearts = '';
    for (let i = 0; i < state.lives; i += 1) hearts += '♥';
    ctx.fillStyle = '#ff6b81';
    ctx.fillText(hearts || '—', W - 210, 44);
    // The farmer's threat bar.
    const gapFrac = Math.max(0, Math.min(1, state.farmer.gap / 420));
    ctx.fillStyle = '#1d120a';
    roundRect(ctx, W - 196, 26, 170, 14, 7);
    ctx.fill();
    ctx.fillStyle = gapFrac > 0.35 ? '#7da05c' : PALETTE.danger;
    roundRect(ctx, W - 196, 26, 170 * gapFrac, 14, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px ' + "'Trebuchet MS', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('FARMER', W - 196, 20);
    if (state.spotted) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = 'bold 20px ' + "'Trebuchet MS', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('HE IS RIGHT BEHIND YOU — DASH!', W / 2, 92);
    }
  }

  function drawPanel(title, lines, accent) {
    ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, W / 2 - 330, 92, 660, 296, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    roundRect(ctx, W / 2 - 330, 92, 660, 296, 18);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = 'bold 52px ' + "'Trebuchet MS', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 168);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '22px ' + "'Trebuchet MS', sans-serif";
    lines.forEach((line, i) => ctx.fillText(line, W / 2, 220 + i * 34));
  }

  function draw(state, screen, best) {
    const turkey = state.turkey;
    // The title screen reuses the live world as its backdrop.
    turkey.elapsed = state.elapsed;
    ctx.clearRect(0, 0, W, H);
    drawSky(state.distanceM);
    const scrollMid = state.distanceM * 10;
    drawBuilding(scrollMid, STAGE_SCENERY[state.stage].building, 300);
    drawBuilding(scrollMid, STAGE_SCENERY[(state.stage + 1) % 3].building, 950);
    drawGround(state.distanceM);
    for (const item of state.obstacles) {
      if (item.active) drawObstacle(item, state.elapsed);
    }
    // The haystack hides the turkey: draw it after the bird when hidden.
    drawTurkey(turkey, turkey.hidden);
    drawFarmer(state);
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(20, 12, 6, 0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 84px ' + "'Trebuchet MS', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('GOBBLE RUN', W / 2, 150);
      ctx.fillStyle = PALETTE.sun;
      ctx.font = 'bold 30px ' + "'Trebuchet MS', sans-serif";
      ctx.fillText('The Great Thanksgiving Escape', W / 2, 196);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '22px ' + "'Trebuchet MS', sans-serif";
      ctx.fillText('Jump the fences · Duck the knives · Hide in the hay · Outrun the farmer', W / 2, 252);
      ctx.fillText('SPACE / CLICK jump    SHIFT dash    H hide    P pause', W / 2, 288);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = 'bold 24px ' + "'Trebuchet MS', sans-serif";
      ctx.fillText('Press SPACE or click to run' + (best > 0 ? '   ·   BEST ' + best : ''), W / 2, 344);
      return;
    }
    drawHud(state, best);
    if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['Take a breath. The farmer waits.', 'Press P or SPACE to keep running'], PALETTE.sun);
    } else if (screen === SCREEN_OVER) {
      drawPanel('CAUGHT!', [
        'The farmer got you at ' + Math.floor(state.distanceM) + ' m.',
        'Score ' + state.score + '   ·   Best ' + best,
        'Press SPACE to run again',
      ], PALETTE.danger);
    } else if (screen === SCREEN_WIN) {
      drawPanel('ESCAPED!', [
        'You made it past the kitchen to the forest gate!',
        'Score ' + state.score + '   ·   Best ' + best,
        'Press SPACE to run it again',
      ], '#7da05c');
    }
  }

  return { draw };
}
