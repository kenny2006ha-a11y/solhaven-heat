import { PLAYER, CAR } from './config.js';
import { collidesBuilding } from './city.js';
import { addParticle } from './entities.js';
import { ACTION_INTERACT, ACTION_SHOOT } from './input.js';

let shootCooldown = 0;

export function updatePlayer(state, input, dt) {
  if (!state.player) {
    state.player = { x: 100, y: 100, angle: 0, hp: PLAYER.maxHp, armor: PLAYER.maxArmor, ammo: 100, cash: 500, inCar: false };
  }
  if (!state.events) state.events = [];
  if (!state.bullets) state.bullets = [];
  if (!state.particles) state.particles = [];
  if (!state.pickups) state.pickups = [];
  if (!state.cars) state.cars = [];

  const player = state.player;
  const actions = input.takeActions();

  // Shoot cooldown reduction
  if (shootCooldown > 0) {
    shootCooldown = Math.max(0, shootCooldown - dt);
  }

  // --- Shooting logic (On foot) ---
  if (!player.inCar) {
    const wantShoot = (actions & ACTION_SHOOT) || input.mouseDown();
    if (wantShoot && shootCooldown <= 0) {
      if (player.ammo > 0) {
        player.ammo -= 1;
        shootCooldown = 0.15;
        state.events.push('shoot');

        const mouse = input.mouse();
        const camera = state.camera || { x: 0, y: 0 };
        const targetX = mouse.x + camera.x;
        const targetY = mouse.y + camera.y;

        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 900;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        player.angle = Math.atan2(dy, dx);

        state.bullets.push({
          x: player.x + Math.cos(player.angle) * 16,
          y: player.y + Math.sin(player.angle) * 16,
          vx,
          vy,
          from: 'player',
          damage: 25
        });

        // Muzzle and shell particles
        addParticle(state, player.x, player.y, { color: '#f1c40f', size: 4, maxLife: 0.1 });
        addParticle(state, player.x - Math.cos(player.angle) * 10, player.y - Math.sin(player.angle) * 10, {
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          color: '#bdc3c7',
          size: 2,
          maxLife: 0.3
        });
      }
    }
  }

  // --- Interaction (Enter / Exit car) ---
  if (actions & ACTION_INTERACT) {
    if (player.inCar) {
      // Exit car
      const car = state.cars.find(c => c.id === player.carId);
      if (car) {
        car.driver = 'traffic';
        player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 30;
        player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 30;
      }
      player.inCar = false;
      player.carId = null;
    } else {
      // Find nearest car
      let nearestCar = null;
      let minDist = 40;
      for (const car of state.cars) {
        const d = Math.hypot(car.x - player.x, car.y - player.y);
        if (d < minDist) {
          minDist = d;
          nearestCar = car;
        }
      }
      if (nearestCar) {
        player.inCar = true;
        player.carId = nearestCar.id;
        nearestCar.driver = 'player';
        if (nearestCar.kind === 'police') {
          state.wanted = Math.min(5, (state.wanted || 0) + 1);
          state.events.push('steal');
        } else if (nearestCar.kind === 'traffic' || nearestCar.driver === 'traffic') {
          state.wanted = Math.min(5, (state.wanted || 0) + 1);
          state.events.push('steal');
        } else {
          state.events.push('steal');
        }
      }
    }
  }

  // --- Movement & Physics ---
  if (!player.inCar) {
    // On foot movement
    const mx = input.moveX();
    const my = input.moveY();
    const running = input.run();
    const speed = running ? PLAYER.run : PLAYER.walk;

    if (mx !== 0 || my !== 0) {
      const angle = Math.atan2(my, mx);
      player.angle = angle;
      const stepDist = speed * dt;
      const nx = player.x + Math.cos(angle) * stepDist;
      const ny = player.y + Math.sin(angle) * stepDist;

      // Slide collision with buildings
      if (!collidesBuilding(state.city, nx, player.y, PLAYER.radius)) {
        player.x = nx;
      }
      if (!collidesBuilding(state.city, player.x, ny, PLAYER.radius)) {
        player.y = ny;
      }
    }
  } else {
    // In car movement
    const car = state.cars.find(c => c.id === player.carId);
    if (!car) {
      player.inCar = false;
      player.carId = null;
    } else {
      if (!car.speed) car.speed = 0;

      const throttle = -input.moveY(); // W is forward (-1 in moveY), S is reverse (+1)
      const steer = input.moveX();
      const handbrake = input.handbrake();

      if (throttle !== 0) {
        car.speed += throttle * CAR.accel * dt;
      } else {
        // Natural friction
        car.speed *= 0.98;
      }

      // Max speed bounds
      car.speed = Math.max(-CAR.maxSpeed * 0.4, Math.min(CAR.maxSpeed, car.speed));

      // Steering scales with speed
      if (Math.abs(car.speed) > 10) {
        const turnRate = CAR.turn * (car.speed / CAR.maxSpeed);
        car.angle += steer * turnRate * dt;
      }

      // Handbrake grip reduction
      const grip = handbrake ? 0.85 : 0.98;

      const moveDist = car.speed * dt;
      const nx = car.x + Math.cos(car.angle) * moveDist;
      const ny = car.y + Math.sin(car.angle) * moveDist;

      // Car building collision
      if (collidesBuilding(state.city, nx, ny, CAR.radius)) {
        car.speed = -car.speed * 0.3; // bounce
        addParticle(state, car.x, car.y, { color: '#e74c3c', size: 5, maxLife: 0.3 });
        if (Math.abs(car.speed) > 150) {
          player.hp = Math.max(0, player.hp - 5);
        }
      } else {
        car.x = nx;
        car.y = ny;
      }

      // Car to traffic car collisions
      for (const other of state.cars) {
        if (other.id === car.id) continue;
        const dist = Math.hypot(other.x - car.x, other.y - car.y);
        if (dist < CAR.radius * 2) {
          car.speed *= 0.5;
          other.speed = (other.speed || 100) * 0.5;
          addParticle(state, (car.x + other.x) / 2, (car.y + other.y) / 2, { color: '#f39c12', size: 4, maxLife: 0.2 });
        }
      }

      // Sync player pos to car
      player.x = car.x;
      player.y = car.y;
      player.angle = car.angle;
    }
  }

  // --- Pickups collection ---
  const collectRadius = player.inCar ? CAR.radius + 10 : PLAYER.radius + 10;
  state.pickups = state.pickups.filter(pickup => {
    const dist = Math.hypot(pickup.x - player.x, pickup.y - player.y);
    if (dist < collectRadius) {
      if (pickup.kind === 'cash') {
        player.cash = (player.cash || 0) + pickup.amount;
      } else if (pickup.kind === 'ammo') {
        player.ammo = Math.min(999, (player.ammo || 0) + pickup.amount);
      } else if (pickup.kind === 'hp') {
        player.hp = Math.min(PLAYER.maxHp, (player.hp || 0) + pickup.amount);
      } else if (pickup.kind === 'armor') {
        player.armor = Math.min(PLAYER.maxArmor, (player.armor || 0) + pickup.amount);
      }
      return false; // remove collected
    }
    return true;
  });
}
