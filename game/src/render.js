import { MISSIONS } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_WASTED = 3;
export const SCREEN_BUSTED = 4;

export const TITLE = 0;
export const PLAY = 1;
export const PAUSED = 2;
export const WASTED = 3;
export const BUSTED = 4;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = 1280;
  canvas.height = 720;

  function drawTextWithShadow(text, x, y, font, fill = '#ffffff', align = 'left') {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function draw(state, screen, hasSave) {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (screen === SCREEN_TITLE || screen === TITLE) {
      drawTitleScreen(width, height, hasSave);
      return;
    }

    // World & Entity rendering
    const camera = state.camera || { x: 0, y: 0 };
    ctx.save();
    ctx.translate(width / 2 - camera.x, height / 2 - camera.y);

    drawWorld(state);
    drawEntities(state);

    ctx.restore();

    // UI & HUD overlays
    drawHUD(state, width, height);
    drawMinimap(state, width, height);
    drawMissionPanel(state, width, height);

    if (screen === SCREEN_PAUSED || screen === PAUSED) {
      drawOverlayMessage(width, height, "PAUSED", "Press ESC to Resume");
    } else if (screen === SCREEN_WASTED || screen === WASTED) {
      drawOverlayMessage(width, height, "WASTED", "Busted by hospital fees...", "#e74c3c");
    } else if (screen === SCREEN_BUSTED || screen === BUSTED) {
      drawOverlayMessage(width, height, "BUSTED", "Busted by police...", "#e67e22");
    }
  }

  function drawTitleScreen(width, height, hasSave) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a252f');
    grad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 20;
    drawTextWithShadow("SOLHAVEN HEAT", width / 2, height / 2 - 60, 'bold 42px sans-serif', '#f1c40f', 'center');
    ctx.restore();

    drawTextWithShadow("Press ENTER or Click to Start", width / 2, height / 2 + 10, '20px sans-serif', '#ffffff', 'center');
    if (hasSave) {
      drawTextWithShadow("Press 'C' to Continue Saved Game", width / 2, height / 2 + 50, '16px sans-serif', '#3498db', 'center');
    }
    drawTextWithShadow("WASD / Arrows to Move • E to Enter/Exit Car • SPACE to Shoot/Brake", width / 2, height / 2 + 110, '14px sans-serif', '#bdc3c7', 'center');
  }

  function drawWorld(state) {
    // Ground
    ctx.fillStyle = '#4a8c44';
    ctx.fillRect(-5000, -5000, 10000, 10000);

    // Beach (Bright Sand) — east edge of the city, from city data when present.
    if (state.city && state.city.beach) {
      const b = state.city.beach;
      ctx.fillStyle = '#f5cba7';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Water (Bright Blue) — beyond the beach, from city data when present.
    if (state.city && state.city.water) {
      const w = state.city.water;
      ctx.fillStyle = '#3498db';
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // Roads
    if (state.city && state.city.roads) {
      for (const road of state.city.roads) {
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(road.x, road.y, road.w, road.h);

        // Yellow dashed center lines
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 4;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        if (road.w > road.h) {
          ctx.moveTo(road.x, road.y + road.h / 2);
          ctx.lineTo(road.x + road.w, road.y + road.h / 2);
        } else {
          ctx.moveTo(road.x + road.w / 2, road.y);
          ctx.lineTo(road.x + road.w / 2, road.y + road.h);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Buildings
    if (state.city && state.city.buildings) {
      const colors = ['#e67e22', '#d35400', '#e74c3c', '#c0392b', '#8e44ad', '#2980b9', '#16a085', '#d98880'];
      let idx = 0;
      for (const b of state.city.buildings) {
        ctx.fillStyle = colors[idx % colors.length];
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // Roof shadow/border
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Inner roof detail
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(b.x + 6, b.y + 6, b.w - 12, b.h - 12);
        idx++;
      }
    }
  }

  function drawEntities(state) {
    // Pedestrians
    if (state.pedestrians) {
      for (const p of state.pedestrians) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color || '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Cars
    if (state.cars) {
      for (const car of state.cars) {
        drawCar(car);
      }
    }

    // Player
    const player = state.player;
    if (player) {
      if (player.inCar && player.car) {
        drawCar(player.car, true);
      } else {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle || 0);

        // Player body (red circle with white tick & dark outline)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 3;
        ctx.stroke();

        // White tick / aiming indicator
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, -3, 8, 6);

        ctx.restore();
      }
    }

    // Time of day overlay
    const timeVal = state.time !== undefined ? state.time : 0.25;
    // Day (0.25 to 0.75): alpha <= 0.08, Night (rest): max 0.45
    let darkAlpha = 0.05;
    if (timeVal < 0.2 || timeVal > 0.8) {
      darkAlpha = 0.42;
    } else if (timeVal >= 0.2 && timeVal <= 0.25) {
      darkAlpha = 0.05 + (0.25 - timeVal) * 6;
    } else if (timeVal >= 0.75 && timeVal <= 0.8) {
      darkAlpha = 0.05 + (timeVal - 0.75) * 6;
    }
    if (darkAlpha > 0.45) darkAlpha = 0.45;

    ctx.save();
    const cam = state.camera || { x: 0, y: 0 };
    ctx.fillStyle = `rgba(10, 15, 30, ${darkAlpha})`;
    ctx.fillRect(cam.x - canvas.width, cam.y - canvas.height, canvas.width * 2, canvas.height * 2);
    ctx.restore();
  }

  function drawCar(car, isPlayer = false) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle || 0);

    const isPolice = car.isPolice || car.type === 'police';
    const bodyColor = isPolice ? '#ffffff' : (car.color || '#3498db');

    // Car Body (34x18 rounded rect approximation)
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = isPolice ? '#2c3e50' : '#1a252f';
    ctx.lineWidth = 2;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-17, -9, 34, 18, 5);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(-17, -9, 34, 18);
      ctx.strokeRect(-17, -9, 34, 18);
    }

    // Player yellow outline ring if player car
    if (isPlayer) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Windshield
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-3, -7, 10, 14);

    // Headlights
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(15, -7, 3, 4);
    ctx.fillRect(15, 3, 3, 4);

    // Taillights
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-17, -7, 2, 4);
    ctx.fillRect(-17, 3, 2, 4);

    // Police light bar
    if (isPolice) {
      ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? '#e74c3c' : '#3498db';
      ctx.fillRect(-3, -4, 6, 8);
    }

    ctx.restore();
  }

  function drawHUD(state, width, height) {
    // Top right HUD: Health, Armor, Cash, Wanted Level
    const player = state.player || {};
    const hp = Math.max(0, Math.round(player.hp || 100));
    const armor = Math.max(0, Math.round(player.armor || 0));
    const cash = player.cash !== undefined ? player.cash : 5000;
    const wanted = player.wanted !== undefined ? player.wanted : 0;

    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';

    drawTextWithShadow(`$${cash.toLocaleString()}`, width - 20, 35, 'bold 24px sans-serif', '#2ecc71', 'right');
    drawTextWithShadow(`HP: ${hp}`, width - 20, 65, 'bold 16px sans-serif', '#e74c3c', 'right');
    drawTextWithShadow(`Armor: ${armor}`, width - 20, 90, 'bold 16px sans-serif', '#3498db', 'right');

    // Wanted stars
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += (i < wanted) ? '★ ' : '☆ ';
    }
    drawTextWithShadow(stars, width - 20, 120, '18px sans-serif', '#f1c40f', 'right');

    ctx.restore();
  }

  function drawMinimap(state, width, height) {
    const mw = 150;
    const mh = 110;
    const mx = width - mw - 15;
    const my = height - mh - 20;

    ctx.save();
    // Minimap background (Navy)
    ctx.fillStyle = '#1a252f';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    ctx.save();
    ctx.beginPath();
    ctx.rect(mx, my, mw, mh);
    ctx.clip();

    const player = state.player || { x: 0, y: 0 };
    const scale = 0.08; // zoom factor

    ctx.translate(mx + mw / 2, my + mh / 2);
    ctx.scale(scale, scale);
    ctx.translate(-player.x, -player.y);

    // Water on minimap (from city data)
    if (state.city && state.city.water) {
      const w = state.city.water;
      ctx.fillStyle = '#3498db';
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }

    // Roads on minimap
    if (state.city && state.city.roads) {
      ctx.fillStyle = '#7f8c8d';
      for (const road of state.city.roads) {
        ctx.fillRect(road.x, road.y, road.w, road.h);
      }
    }

    // Mission marker (Yellow diamond)
    if (state.missions && state.missions.target) {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(state.missions.target.x, state.missions.target.y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police on minimap (Red dots)
    if (state.cars) {
      ctx.fillStyle = '#e74c3c';
      for (const car of state.cars) {
        if (car.isPolice || car.type === 'police') {
          ctx.beginPath();
          ctx.arc(car.x, car.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Player position on minimap (White arrow / dot)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // View-box rect on minimap border
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mx + 10, my + 10, mw - 20, mh - 20);

    ctx.restore();
  }

  function drawMissionPanel(state, width, height) {
    const ms = state.missions || {};
    const cur = MISSIONS[ms.current || 0] || { name: 'Free Roam' };
    const mission = {
      name: cur.name || 'Free Roam',
      objective: (ms.target && ms.target.label) || 'Explore the city & cause chaos',
      progress: ms.vaultProgress !== undefined ? ms.vaultProgress : (ms.timer !== undefined ? ms.timer : 1),
    };
    const px = 20;
    const py = height - 110;
    const pw = 280;
    const ph = 90;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);

    drawTextWithShadow(`JOB: ${mission.name || 'Free Roam'}`, px + 12, py + 24, 'bold 14px sans-serif', '#f1c40f');
    drawTextWithShadow(mission.objective || 'Explore the city', px + 12, py + 48, '12px sans-serif', '#ffffff');

    // Timer / Vault progress bar
    const barX = px + 12;
    const barY = py + 62;
    const barW = pw - 24;
    const barH = 12;

    ctx.fillStyle = '#34495e';
    ctx.fillRect(barX, barY, barW, barH);

    const prog = Math.max(0, Math.min(1, mission.progress !== undefined ? mission.progress : 0.75));
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(barX, barY, barW * prog, barH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.restore();
  }

  function drawOverlayMessage(width, height, title, subtitle, color = '#e74c3c') {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, width, height);

    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    drawTextWithShadow(title, width / 2, height / 2 - 30, 'bold 56px sans-serif', color, 'center');
    ctx.restore();

    drawTextWithShadow(subtitle, width / 2, height / 2 + 25, '20px sans-serif', '#ffffff', 'center');
  }

  return { draw };
}
